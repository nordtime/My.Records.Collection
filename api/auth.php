<?php
/**
 * Authentication & account endpoints.
 *
 *  GET  ?me         → current session user + csrf token + registration status
 *  GET  ?captcha    → new captcha challenge
 *  GET  ?users      → (admin) list users
 *  POST ?action=register|login|logout|delete_account
 *  POST ?action=approve|disable|set_role|delete_user|set_open_registration  (admin)
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth_lib.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') { http_response_code(204); exit; }

try {
    $pdo = get_db();
    ensureAuthSchema($pdo);

    if ($method === 'GET') {
        if (isset($_GET['captcha'])) {
            json_out(['success' => true] + captcha_generate());
        }
        if (isset($_GET['users'])) {
            require_admin($pdo);
            $rows = $pdo->query('
                SELECT u.id, u.username, u.email, u.role, u.status, u.email_verified, u.created_at, u.last_login,
                       (SELECT COUNT(*) FROM records r WHERE r.user_id = u.id) AS record_count
                FROM users u ORDER BY u.created_at ASC
            ')->fetchAll();
            json_out(['success' => true, 'users' => $rows]);
        }
        // ?me — current auth state
        $user = current_user($pdo);
        $hasAdmin = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn() > 0;
        $discogsSet = false;
        if ($user) {
            try {
                $t = $pdo->prepare('SELECT discogs_token FROM users WHERE id = :id');
                $t->execute([':id' => $user['id']]);
                $discogsSet = trim((string) $t->fetchColumn()) !== '';
            } catch (\Throwable $e) { /* column may not exist yet */ }
        }
        json_out([
            'success'           => true,
            'authenticated'     => (bool) $user,
            'user'              => $user ? [
                'id' => (int) $user['id'], 'username' => $user['username'],
                'email' => $user['email'], 'role' => $user['role'],
            ] : null,
            'csrf'              => $user ? csrf_token() : null,
            'has_admin'         => $hasAdmin,
            'open_registration' => get_setting($pdo, 'open_registration', '0') === '1',
            'discogs_token_set' => $discogsSet,
        ]);
    }

    if ($method !== 'POST') {
        json_out(['error' => 'Method not allowed.'], 405);
    }

    $data   = json_decode(file_get_contents('php://input'), true) ?: [];
    $action = $data['action'] ?? '';

    switch ($action) {
        case 'register': handleRegister($pdo, $data); break;
        case 'login':    handleLogin($pdo, $data);    break;
        case 'logout':   handleLogout();               break;
        case 'delete_account': handleDeleteAccount($pdo, $data); break;
        case 'set_discogs_token': handleSetDiscogsToken($pdo, $data); break;
        case 'change_password': handleChangePassword($pdo, $data); break;
        case 'change_email':    handleChangeEmail($pdo, $data);    break;
        case 'verify_email':        handleVerifyEmail($pdo, $data);        break;
        case 'resend_verification': handleResendVerification($pdo, $data); break;
        case 'request_reset':       handleRequestReset($pdo, $data);       break;
        case 'reset_password':      handleResetPassword($pdo, $data);      break;

        // Admin actions
        case 'approve':
        case 'disable':
        case 'set_role':
        case 'delete_user':
        case 'set_open_registration':
        case 'resend_verification_for':
            handleAdminAction($pdo, $action, $data);
            break;

        default:
            json_out(['error' => 'Unknown action.'], 400);
    }
} catch (\Throwable $e) {
    error_log('[Auth] ' . get_class($e) . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    json_out(['error' => 'Internal server error.'], 500);
}

// ── Handlers ─────────────────────────────────────────────────

function handleRegister(PDO $pdo, array $data): void {
    $username = trim($data['username'] ?? '');
    $email    = trim($data['email'] ?? '');
    $password = (string) ($data['password'] ?? '');

    if (!captcha_verify($data['captcha'] ?? '')) {
        json_out(['success' => false, 'message' => 'Incorrect verification answer. Please try again.'], 422);
    }

    $errors = [];
    if (!valid_username($username)) $errors[] = 'Username must be 3–50 characters (letters, numbers, . _ -).';
    if (!valid_email($email))       $errors[] = 'A valid email address is required.';
    $errors = array_merge($errors, password_problems($password));
    if ($errors) {
        json_out(['success' => false, 'message' => implode(' ', $errors)], 422);
    }

    // Uniqueness
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = :u OR email = :e LIMIT 1');
    $stmt->execute([':u' => $username, ':e' => $email]);
    if ($stmt->fetch()) {
        json_out(['success' => false, 'message' => 'That username or email is already registered.'], 409);
    }

    $isFirst = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0;
    $openReg = get_setting($pdo, 'open_registration', '0') === '1';

    // The first account is the owner/admin and is trusted immediately.
    // Everyone else must verify their email before they can sign in.
    if ($isFirst) {
        $stmt = $pdo->prepare('
            INSERT INTO users (username, email, password_hash, role, status, email_verified)
            VALUES (:u, :e, :p, \'admin\', \'active\', 1)
        ');
        $stmt->execute([
            ':u' => $username, ':e' => $email,
            ':p' => password_hash($password, PASSWORD_DEFAULT),
        ]);
        $newId = (int) $pdo->lastInsertId();
        try {
            $pdo->prepare('UPDATE records SET user_id = :id WHERE user_id IS NULL')->execute([':id' => $newId]);
            $pdo->prepare('UPDATE wishlist SET user_id = :id WHERE user_id IS NULL')->execute([':id' => $newId]);
        } catch (\Throwable $e) {
            error_log('[Auth] orphan assignment failed: ' . $e->getMessage());
        }
        start_secure_session();
        session_regenerate_id(true);
        $_SESSION['uid'] = $newId;
        $pdo->prepare('UPDATE users SET last_login = NOW() WHERE id = :id')->execute([':id' => $newId]);
        json_out([
            'success' => true,
            'message' => 'Admin account created.',
            'authenticated' => true,
            'user' => ['id' => $newId, 'username' => $username, 'email' => $email, 'role' => 'admin'],
            'csrf' => csrf_token(),
        ]);
    }

    $status = $openReg ? 'active' : 'pending';
    [$rawToken, $tokenHash] = make_token();

    $stmt = $pdo->prepare('
        INSERT INTO users (username, email, password_hash, role, status, email_verified, verify_token_hash, verify_expires)
        VALUES (:u, :e, :p, \'user\', :s, 0, :vh, DATE_ADD(NOW(), INTERVAL 24 HOUR))
    ');
    $stmt->execute([
        ':u' => $username,
        ':e' => $email,
        ':p' => password_hash($password, PASSWORD_DEFAULT),
        ':s' => $status,
        ':vh' => $tokenHash,
    ]);

    $verifyUrl = app_base_url() . '/verify.html?token=' . $rawToken;
    $body = mail_template('Confirm your email',
        '<p>Welcome! Please confirm your email address to activate your My Records Collection account.</p>'
        . mail_button('Verify my email', $verifyUrl)
        . '<p style="font-size:13px;color:#8b949e;">This link expires in 24 hours.</p>');
    send_app_mail($email, 'Verify your email · My Records Collection', $body);

    json_out([
        'success' => true,
        'authenticated' => false,
        'verify_sent' => true,
        'message' => 'Account created. Check your email for a verification link to activate your account'
            . ($status === 'pending' ? ', then an administrator will approve access.' : '.'),
    ]);
}

function handleLogin(PDO $pdo, array $data): void {
    if (!login_rate_check()) {
        json_out(['success' => false, 'message' => 'Too many failed sign-in attempts. For your security this is locked for about 15 minutes — or reset your password to regain access sooner.'], 429);
    }

    $identifier = trim($data['identifier'] ?? $data['username'] ?? '');
    $password   = (string) ($data['password'] ?? '');
    if ($identifier === '' || $password === '') {
        json_out(['success' => false, 'message' => 'Enter your username/email and password.'], 422);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = :u OR email = :e LIMIT 1');
    $stmt->execute([':u' => $identifier, ':e' => $identifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        login_rate_record_failure();
        json_out(['success' => false, 'message' => 'Incorrect username/email or password.'], 401);
    }

    if ((int) $user['email_verified'] !== 1) {
        json_out(['success' => false, 'unverified' => true,
            'message' => 'Please verify your email first. Check your inbox for the verification link.'], 403);
    }

    if ($user['status'] === 'pending') {
        json_out(['success' => false, 'message' => 'Your account is awaiting administrator approval.'], 403);
    }
    if ($user['status'] === 'disabled') {
        json_out(['success' => false, 'message' => 'This account has been disabled.'], 403);
    }

    login_rate_clear();
    $remember = !empty($data['remember']);
    start_secure_session($remember ? 60 * 60 * 24 * 30 : 0);
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $user['id'];
    $pdo->prepare('UPDATE users SET last_login = NOW() WHERE id = :id')->execute([':id' => $user['id']]);

    json_out([
        'success' => true,
        'authenticated' => true,
        'user' => ['id' => (int) $user['id'], 'username' => $user['username'], 'email' => $user['email'], 'role' => $user['role']],
        'csrf' => csrf_token(),
    ]);
}

/**
 * Verify an email address using the token from the verification link.
 */
function handleVerifyEmail(PDO $pdo, array $data): void {
    $token = trim((string) ($data['token'] ?? ''));
    if ($token === '') {
        json_out(['success' => false, 'message' => 'Missing verification token.'], 400);
    }
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare('SELECT id, pending_email FROM users WHERE verify_token_hash = :h AND verify_expires > NOW() LIMIT 1');
    $stmt->execute([':h' => $hash]);
    $user = $stmt->fetch();
    if (!$user) {
        json_out(['success' => false, 'message' => 'This verification link is invalid or has expired.'], 400);
    }

    // If this token confirms an email change, swap the pending address in.
    if (!empty($user['pending_email'])) {
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = :e AND id != :id LIMIT 1');
        $chk->execute([':e' => $user['pending_email'], ':id' => $user['id']]);
        if ($chk->fetch()) {
            $pdo->prepare('UPDATE users SET pending_email = NULL, verify_token_hash = NULL, verify_expires = NULL WHERE id = :id')
                ->execute([':id' => $user['id']]);
            json_out(['success' => false, 'message' => 'That email address is already in use by another account.'], 409);
        }
        $pdo->prepare('UPDATE users SET email = pending_email, pending_email = NULL, email_verified = 1, verify_token_hash = NULL, verify_expires = NULL WHERE id = :id')
            ->execute([':id' => $user['id']]);
        json_out(['success' => true, 'message' => 'Your new email address is verified.']);
    }

    $pdo->prepare('UPDATE users SET email_verified = 1, verify_token_hash = NULL, verify_expires = NULL WHERE id = :id')
        ->execute([':id' => $user['id']]);
    json_out(['success' => true, 'message' => 'Your email is verified. You can now sign in.']);
}

/**
 * Resend a verification email. Captcha-protected. Always responds generically.
 */
function handleResendVerification(PDO $pdo, array $data): void {
    if (!captcha_verify($data['captcha'] ?? '')) {
        json_out(['success' => false, 'message' => 'Incorrect verification answer.'], 422);
    }
    $email = trim((string) ($data['email'] ?? ''));
    $generic = ['success' => true, 'message' => 'If that email needs verifying, a new link is on its way.'];
    if (!valid_email($email)) json_out($generic);
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :e AND email_verified = 0 LIMIT 1');
    $stmt->execute([':e' => $email]);
    $user = $stmt->fetch();
    if ($user) {
        [$raw, $hash] = make_token();
        $pdo->prepare('UPDATE users SET verify_token_hash = :h, verify_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = :id')
            ->execute([':h' => $hash, ':id' => $user['id']]);
        $url = app_base_url() . '/verify.html?token=' . $raw;
        $body = mail_template('Confirm your email',
            '<p>Here is your new verification link.</p>' . mail_button('Verify my email', $url)
            . '<p style="font-size:13px;color:#8b949e;">This link expires in 24 hours.</p>');
        send_app_mail($email, 'Verify your email · My Records Collection', $body);
    }
    json_out($generic);
}

/**
 * Request a password reset email. Captcha-protected. Always responds generically.
 */
function handleRequestReset(PDO $pdo, array $data): void {
    if (!captcha_verify($data['captcha'] ?? '')) {
        json_out(['success' => false, 'message' => 'Incorrect verification answer.'], 422);
    }
    $email = trim((string) ($data['email'] ?? ''));
    $generic = ['success' => true, 'message' => 'If an account exists for that email, a reset link has been sent.'];
    if (!valid_email($email)) json_out($generic);
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :e LIMIT 1');
    $stmt->execute([':e' => $email]);
    $user = $stmt->fetch();
    if ($user) {
        [$raw, $hash] = make_token();
        $pdo->prepare('UPDATE users SET reset_token_hash = :h, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = :id')
            ->execute([':h' => $hash, ':id' => $user['id']]);
        $url = app_base_url() . '/reset.html?token=' . $raw;
        $body = mail_template('Reset your password',
            '<p>We received a request to reset your password. Click below to choose a new one.</p>'
            . mail_button('Reset my password', $url)
            . '<p style="font-size:13px;color:#8b949e;">This link expires in 1 hour. If you didn\'t request it, ignore this email.</p>');
        send_app_mail($email, 'Reset your password · My Records Collection', $body);
    }
    json_out($generic);
}

/**
 * Complete a password reset using the token from the email link.
 */
function handleResetPassword(PDO $pdo, array $data): void {
    $token = trim((string) ($data['token'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    if ($token === '') {
        json_out(['success' => false, 'message' => 'Missing reset token.'], 400);
    }
    $errs = password_problems($password);
    if ($errs) {
        json_out(['success' => false, 'message' => implode(' ', $errs)], 422);
    }
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare('SELECT id FROM users WHERE reset_token_hash = :h AND reset_expires > NOW() LIMIT 1');
    $stmt->execute([':h' => $hash]);
    $user = $stmt->fetch();
    if (!$user) {
        json_out(['success' => false, 'message' => 'This reset link is invalid or has expired.'], 400);
    }
    // Resetting the password proves control of the mailbox, so mark verified too.
    $pdo->prepare('UPDATE users SET password_hash = :p, email_verified = 1, reset_token_hash = NULL, reset_expires = NULL WHERE id = :id')
        ->execute([':p' => password_hash($password, PASSWORD_DEFAULT), ':id' => $user['id']]);
    json_out(['success' => true, 'message' => 'Your password has been reset. You can now sign in.']);
}

function handleLogout(): void {
    start_secure_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'], $p['httponly']);
    }
    session_destroy();
    json_out(['success' => true]);
}

/**
 * Change the signed-in user's password.
 */
function handleChangePassword(PDO $pdo, array $data): void {
    $user = require_auth($pdo);
    require_csrf();
    $current = (string) ($data['current_password'] ?? '');
    $new     = (string) ($data['new_password'] ?? '');

    $row = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id');
    $row->execute([':id' => $user['id']]);
    $hash = $row->fetchColumn();
    if (!$hash || !password_verify($current, $hash)) {
        json_out(['success' => false, 'message' => 'Your current password is incorrect.'], 401);
    }
    $errs = password_problems($new);
    if ($errs) {
        json_out(['success' => false, 'message' => implode(' ', $errs)], 422);
    }
    if (password_verify($new, $hash)) {
        json_out(['success' => false, 'message' => 'Please choose a password different from your current one.'], 422);
    }
    $pdo->prepare('UPDATE users SET password_hash = :p WHERE id = :id')
        ->execute([':p' => password_hash($new, PASSWORD_DEFAULT), ':id' => $user['id']]);
    session_regenerate_id(true);
    json_out(['success' => true, 'message' => 'Your password has been changed.']);
}

/**
 * Change the signed-in user's email. The new address must be verified via a
 * link before it replaces the current one (no lock-out risk).
 */
function handleChangeEmail(PDO $pdo, array $data): void {
    $user = require_auth($pdo);
    require_csrf();
    $password = (string) ($data['password'] ?? '');
    $newEmail = trim((string) ($data['new_email'] ?? ''));

    $row = $pdo->prepare('SELECT password_hash, email FROM users WHERE id = :id');
    $row->execute([':id' => $user['id']]);
    $u = $row->fetch();
    if (!$u || !password_verify($password, $u['password_hash'])) {
        json_out(['success' => false, 'message' => 'Password confirmation failed.'], 401);
    }
    if (!valid_email($newEmail)) {
        json_out(['success' => false, 'message' => 'Enter a valid email address.'], 422);
    }
    if (strcasecmp($newEmail, $u['email']) === 0) {
        json_out(['success' => false, 'message' => 'That is already your email address.'], 409);
    }
    $chk = $pdo->prepare('SELECT id FROM users WHERE email = :e AND id != :id LIMIT 1');
    $chk->execute([':e' => $newEmail, ':id' => $user['id']]);
    if ($chk->fetch()) {
        json_out(['success' => false, 'message' => 'That email address is already in use.'], 409);
    }

    // Store as pending until verified; current email stays active meanwhile.
    [$raw, $hash] = make_token();
    $pdo->prepare('UPDATE users SET pending_email = :e, verify_token_hash = :h, verify_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = :id')
        ->execute([':e' => $newEmail, ':h' => $hash, ':id' => $user['id']]);

    $url = app_base_url() . '/verify.html?token=' . $raw;
    $body = mail_template('Confirm your new email',
        '<p>Please confirm this new email address for your My Records Collection account.</p>'
        . mail_button('Verify my new email', $url)
        . '<p style="font-size:13px;color:#8b949e;">Your current email stays active until you confirm. This link expires in 24 hours.</p>');
    $sent = send_app_mail($newEmail, 'Verify your new email · My Records Collection', $body);

    json_out(['success' => true, 'sent' => $sent, 'pending_email' => $newEmail,
        'message' => 'Almost there — check ' . $newEmail . ' for a link to confirm your new address.']);
}

/**
 * Save (or clear) the current user's personal Discogs API token.
 *
 * POST { "action": "set_discogs_token", "token": "..." }
 */
function handleSetDiscogsToken(PDO $pdo, array $data): void {
    $user = require_auth($pdo);
    require_csrf();

    $token = trim((string) ($data['token'] ?? ''));
    if (mb_strlen($token) > 255) {
        json_out(['success' => false, 'message' => 'Token is too long.'], 422);
    }
    $pdo->prepare('UPDATE users SET discogs_token = :t WHERE id = :id')
        ->execute([':t' => $token, ':id' => $user['id']]);
    json_out(['success' => true, 'discogs_token_set' => $token !== '']);
}

function handleDeleteAccount(PDO $pdo, array $data): void {
    $user = require_auth($pdo);
    require_csrf();

    $password = (string) ($data['password'] ?? '');
    $row = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id');
    $row->execute([':id' => $user['id']]);
    $hash = $row->fetchColumn();
    if (!$hash || !password_verify($password, $hash)) {
        json_out(['success' => false, 'message' => 'Password confirmation failed.'], 401);
    }

    // Prevent deleting the last remaining admin
    if ($user['role'] === 'admin') {
        $admins = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active'")->fetchColumn();
        if ($admins <= 1) {
            json_out(['success' => false, 'message' => 'You are the last administrator. Promote another admin before deleting your account.'], 409);
        }
    }

    purge_user_data($pdo, (int) $user['id']);
    $pdo->prepare('DELETE FROM users WHERE id = :id')->execute([':id' => $user['id']]);
    handleLogout();
}

function handleAdminAction(PDO $pdo, string $action, array $data): void {
    $admin = require_admin($pdo);
    require_csrf();

    if ($action === 'set_open_registration') {
        set_setting($pdo, 'open_registration', !empty($data['value']) ? '1' : '0');
        json_out(['success' => true, 'open_registration' => !empty($data['value'])]);
    }

    $targetId = (int) ($data['user_id'] ?? 0);
    if ($targetId <= 0) {
        json_out(['success' => false, 'message' => 'A valid user_id is required.'], 400);
    }

    switch ($action) {
        case 'approve':
            $pdo->prepare("UPDATE users SET status = 'active' WHERE id = :id")->execute([':id' => $targetId]);
            json_out(['success' => true]);
            break;

        case 'disable':
            if ($targetId === (int) $admin['id']) {
                json_out(['success' => false, 'message' => 'You cannot disable your own account.'], 409);
            }
            $pdo->prepare("UPDATE users SET status = 'disabled' WHERE id = :id")->execute([':id' => $targetId]);
            json_out(['success' => true]);
            break;

        case 'set_role':
            $role = ($data['role'] ?? '') === 'admin' ? 'admin' : 'user';
            if ($targetId === (int) $admin['id'] && $role !== 'admin') {
                json_out(['success' => false, 'message' => 'You cannot remove your own admin role.'], 409);
            }
            $pdo->prepare('UPDATE users SET role = :r WHERE id = :id')->execute([':r' => $role, ':id' => $targetId]);
            json_out(['success' => true]);
            break;

        case 'delete_user':
            if ($targetId === (int) $admin['id']) {
                json_out(['success' => false, 'message' => 'Use "Delete my account" to remove your own account.'], 409);
            }
            purge_user_data($pdo, $targetId);
            $pdo->prepare('DELETE FROM users WHERE id = :id')->execute([':id' => $targetId]);
            json_out(['success' => true]);
            break;

        case 'resend_verification_for':
            $row = $pdo->prepare('SELECT email, email_verified FROM users WHERE id = :id');
            $row->execute([':id' => $targetId]);
            $target = $row->fetch();
            if (!$target) {
                json_out(['success' => false, 'message' => 'User not found.'], 404);
            }
            if ((int) $target['email_verified'] === 1) {
                json_out(['success' => false, 'message' => 'That account is already verified.'], 409);
            }
            [$raw, $hash] = make_token();
            $pdo->prepare('UPDATE users SET verify_token_hash = :h, verify_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = :id')
                ->execute([':h' => $hash, ':id' => $targetId]);
            $url = app_base_url() . '/verify.html?token=' . $raw;
            $body = mail_template('Confirm your email',
                '<p>An administrator has sent you a new verification link for My Records Collection.</p>'
                . mail_button('Verify my email', $url)
                . '<p style="font-size:13px;color:#8b949e;">This link expires in 24 hours.</p>');
            $sent = send_app_mail($target['email'], 'Verify your email · My Records Collection', $body);
            json_out(['success' => true, 'sent' => $sent, 'message' => 'Verification email sent.']);
            break;
    }
}

/**
 * Permanently remove all data belonging to a user.
 */
function purge_user_data(PDO $pdo, int $userId): void {
    try {
        $pdo->prepare('
            DELETE s FROM listening_sessions s
            JOIN records r ON r.id = s.record_id
            WHERE r.user_id = :id
        ')->execute([':id' => $userId]);
    } catch (\Throwable $e) { /* table may not exist */ }

    try {
        $pdo->prepare('DELETE FROM discogs_cache WHERE record_id IN (SELECT id FROM records WHERE user_id = :id)')
            ->execute([':id' => $userId]);
    } catch (\Throwable $e) { /* optional */ }

    $pdo->prepare('DELETE FROM records WHERE user_id = :id')->execute([':id' => $userId]);
    try {
        $pdo->prepare('DELETE FROM wishlist WHERE user_id = :id')->execute([':id' => $userId]);
    } catch (\Throwable $e) { /* optional */ }
}
