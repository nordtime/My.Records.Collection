<?php
/**
 * Auth library — shared helpers for authentication, sessions, CSRF,
 * a built-in captcha, login rate limiting, and schema setup.
 *
 * Included by both api/api.php and api/auth.php.
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'auth_lib.php') {
    http_response_code(403);
    exit('Access denied.');
}

define('AUTH_RATE_FILE', sys_get_temp_dir() . '/records_login_rate.json');
define('AUTH_LOGIN_MAX', 10);       // max failed attempts
define('AUTH_LOGIN_WINDOW', 900);   // per 15 minutes

/**
 * Current request's authenticated user id (set by api.php after require_auth).
 */
function uid(): int {
    return (int) ($GLOBALS['RC_UID'] ?? 0);
}

/**
 * Start a hardened PHP session.
 *
 * @param int $lifetime Cookie lifetime in seconds (0 = until browser closes).
 */
function start_secure_session(int $lifetime = 0): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;

    $secure = (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    if ($lifetime > 0) {
        ini_set('session.gc_maxlifetime', (string) $lifetime);
    }

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('RCSESSID');
    session_start();
}

/**
 * Send a JSON response and exit.
 */
function json_out($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Return the logged-in user row, or null.
 */
function current_user(PDO $pdo): ?array {
    start_secure_session();
    $uid = $_SESSION['uid'] ?? null;
    if (!$uid) return null;

    static $cached = null;
    if ($cached !== null && ($cached['id'] ?? null) == $uid) return $cached;

    $stmt = $pdo->prepare('SELECT id, username, email, role, status, created_at, last_login FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $uid]);
    $user = $stmt->fetch();
    if (!$user || $user['status'] !== 'active') {
        return null;
    }
    $cached = $user;
    return $user;
}

/**
 * Require an authenticated, active user. Exits with 401 otherwise.
 */
function require_auth(PDO $pdo): array {
    $user = current_user($pdo);
    if (!$user) {
        json_out(['error' => 'Authentication required.', 'auth' => false], 401);
    }
    return $user;
}

/**
 * Require an admin user. Exits with 403 otherwise.
 */
function require_admin(PDO $pdo): array {
    $user = require_auth($pdo);
    if (($user['role'] ?? '') !== 'admin') {
        json_out(['error' => 'Administrator access required.'], 403);
    }
    return $user;
}

/**
 * Get (creating if needed) the session CSRF token.
 */
function csrf_token(): string {
    start_secure_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/**
 * Verify the CSRF token for a state-changing request. Exits with 419 on failure.
 */
function require_csrf(): void {
    start_secure_session();
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $known = $_SESSION['csrf'] ?? '';
    if ($known === '' || $sent === '' || !hash_equals($known, $sent)) {
        json_out(['error' => 'Invalid or missing CSRF token.'], 419);
    }
}

// ── Captcha (built-in math challenge) ───────────────────────

/**
 * Generate a simple arithmetic captcha and stash the answer in the session.
 */
function captcha_generate(): array {
    start_secure_session();
    $a = random_int(1, 9);
    $b = random_int(1, 9);
    $ops = ['+', '-', '×'];
    $op = $ops[array_rand($ops)];
    switch ($op) {
        case '+': $answer = $a + $b; break;
        case '-': if ($b > $a) { [$a, $b] = [$b, $a]; } $answer = $a - $b; break;
        default:  $answer = $a * $b; break;
    }
    $_SESSION['captcha_answer'] = (string) $answer;
    $_SESSION['captcha_time']   = time();
    return ['question' => "What is $a $op $b?"];
}

/**
 * Verify a captcha answer (valid once, within 10 minutes).
 */
function captcha_verify($answer): bool {
    start_secure_session();
    $expected = $_SESSION['captcha_answer'] ?? null;
    $ts = $_SESSION['captcha_time'] ?? 0;
    unset($_SESSION['captcha_answer'], $_SESSION['captcha_time']);
    if ($expected === null || (time() - $ts) > 600) return false;
    return trim((string) $answer) !== '' && trim((string) $answer) === (string) $expected;
}

// ── Login rate limiting (per IP, file-based) ────────────────

function login_rate_key(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    return hash('sha256', $ip);
}

function login_rate_check(): bool {
    $now = time();
    $data = [];
    if (is_file(AUTH_RATE_FILE)) {
        $raw = @file_get_contents(AUTH_RATE_FILE);
        if ($raw !== false) $data = json_decode($raw, true) ?: [];
    }
    $key = login_rate_key();
    $attempts = array_values(array_filter($data[$key] ?? [], fn($ts) => ($now - $ts) < AUTH_LOGIN_WINDOW));
    return count($attempts) < AUTH_LOGIN_MAX;
}

function login_rate_record_failure(): void {
    $now = time();
    $data = [];
    if (is_file(AUTH_RATE_FILE)) {
        $raw = @file_get_contents(AUTH_RATE_FILE);
        if ($raw !== false) $data = json_decode($raw, true) ?: [];
    }
    $key = login_rate_key();
    $attempts = array_values(array_filter($data[$key] ?? [], fn($ts) => ($now - $ts) < AUTH_LOGIN_WINDOW));
    $attempts[] = $now;
    $data[$key] = $attempts;
    @file_put_contents(AUTH_RATE_FILE, json_encode($data), LOCK_EX);
}

function login_rate_clear(): void {
    if (!is_file(AUTH_RATE_FILE)) return;
    $raw = @file_get_contents(AUTH_RATE_FILE);
    $data = $raw !== false ? (json_decode($raw, true) ?: []) : [];
    unset($data[login_rate_key()]);
    @file_put_contents(AUTH_RATE_FILE, json_encode($data), LOCK_EX);
}

// ── App settings ────────────────────────────────────────────

function get_setting(PDO $pdo, string $key, ?string $default = null): ?string {
    ensureAuthSchema($pdo);
    $stmt = $pdo->prepare('SELECT v FROM app_settings WHERE k = :k LIMIT 1');
    $stmt->execute([':k' => $key]);
    $row = $stmt->fetch();
    return $row ? $row['v'] : $default;
}

function set_setting(PDO $pdo, string $key, string $value): void {
    ensureAuthSchema($pdo);
    $stmt = $pdo->prepare('
        INSERT INTO app_settings (k, v) VALUES (:k, :v)
        ON DUPLICATE KEY UPDATE v = VALUES(v)
    ');
    $stmt->execute([':k' => $key, ':v' => $value]);
}

// ── Schema setup ────────────────────────────────────────────

/**
 * Create the users + app_settings tables and add user_id ownership
 * columns to records/wishlist. Runs once per request.
 */
function ensureAuthSchema(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $done = true;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username      VARCHAR(50)  NOT NULL UNIQUE,
            email         VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role          ENUM('admin','user') NOT NULL DEFAULT 'user',
            status        ENUM('active','pending','disabled') NOT NULL DEFAULT 'pending',
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login    TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Add later columns to users if missing (per-user Discogs token, etc.)
    try {
        $ucols = $pdo->query(
            "SELECT LOWER(COLUMN_NAME) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
        )->fetchAll(PDO::FETCH_COLUMN);
        $uadd = [];
        if (!in_array('discogs_token', $ucols, true)) $uadd[] = "ADD COLUMN discogs_token VARCHAR(255) DEFAULT ''";
        $addVerified = !in_array('email_verified', $ucols, true);
        if ($addVerified)                                  $uadd[] = "ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0";
        if (!in_array('verify_token_hash', $ucols, true))  $uadd[] = "ADD COLUMN verify_token_hash VARCHAR(64) NULL";
        if (!in_array('verify_expires', $ucols, true))     $uadd[] = "ADD COLUMN verify_expires DATETIME NULL";
        if (!in_array('reset_token_hash', $ucols, true))   $uadd[] = "ADD COLUMN reset_token_hash VARCHAR(64) NULL";
        if (!in_array('reset_expires', $ucols, true))      $uadd[] = "ADD COLUMN reset_expires DATETIME NULL";
        if (!in_array('pending_email', $ucols, true))      $uadd[] = "ADD COLUMN pending_email VARCHAR(255) NULL";
        if ($uadd) {
            $pdo->exec('ALTER TABLE users ' . implode(', ', $uadd));
            // Grandfather existing accounts as verified so they aren't locked out
            if ($addVerified) {
                $pdo->exec('UPDATE users SET email_verified = 1');
            }
        }
    } catch (\Throwable $e) {
        error_log('[Auth] users column add failed: ' . $e->getMessage());
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS app_settings (
            k VARCHAR(64) PRIMARY KEY,
            v TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Add user_id ownership columns if missing
    try {
        $cols = $pdo->query(
            "SELECT LOWER(COLUMN_NAME) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'records'"
        )->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('user_id', $cols, true)) {
            $pdo->exec('ALTER TABLE records ADD COLUMN user_id INT UNSIGNED NULL, ADD INDEX idx_user (user_id)');
        }
    } catch (\Throwable $e) {
        error_log('[Auth] records.user_id add failed: ' . $e->getMessage());
    }

    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS wishlist (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            artist VARCHAR(255) NOT NULL,
            album VARCHAR(255) NOT NULL,
            format VARCHAR(50) DEFAULT 'Vinyl',
            target_price DECIMAL(10,2),
            discogs_url VARCHAR(500),
            notes TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $wcols = $pdo->query(
            "SELECT LOWER(COLUMN_NAME) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlist'"
        )->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('user_id', $wcols, true)) {
            $pdo->exec('ALTER TABLE wishlist ADD COLUMN user_id INT UNSIGNED NULL, ADD INDEX idx_user (user_id)');
        }
    } catch (\Throwable $e) {
        error_log('[Auth] wishlist.user_id add failed: ' . $e->getMessage());
    }
}

/**
 * Basic validators.
 */
function valid_username(string $u): bool {
    return (bool) preg_match('/^[A-Za-z0-9_.-]{3,50}$/', $u);
}
function valid_email(string $e): bool {
    return (bool) filter_var($e, FILTER_VALIDATE_EMAIL) && mb_strlen($e) <= 255;
}
function password_problems(string $p): array {
    $errs = [];
    if (mb_strlen($p) < 8)  $errs[] = 'Password must be at least 8 characters.';
    if (mb_strlen($p) > 200) $errs[] = 'Password is too long.';
    if (!preg_match('/[A-Za-z]/', $p) || !preg_match('/[0-9]/', $p)) {
        $errs[] = 'Password must include at least one letter and one number.';
    }
    return $errs;
}

// ── Email ────────────────────────────────────────────────────

define('MAIL_FROM', 'noreply@mime-time.com');
define('MAIL_FROM_NAME', 'My Records Collection');

/**
 * Base URL of the app, e.g. https://records.mime-time.com
 */
function app_base_url(): string {
    $https = (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    // Strip anything odd from host to avoid header/link injection
    $host = preg_replace('/[^A-Za-z0-9.\-:]/', '', $host);
    return $scheme . '://' . $host;
}

/**
 * Send an HTML email via the server's configured mail relay.
 * Returns true on success.
 */
function send_app_mail(string $to, string $subject, string $html): bool {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    $subject = preg_replace('/[\r\n]+/', ' ', $subject);

    $headers = 'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM . ">\r\n";
    $headers .= 'Reply-To: ' . MAIL_FROM . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: MyRecordsCollection\r\n";

    try {
        return @mail($to, $subject, $html, $headers);
    } catch (\Throwable $e) {
        error_log('[Auth] mail() failed: ' . $e->getMessage());
        return false;
    }
}

/**
 * Wrap body content in a simple branded HTML email shell.
 */
function mail_template(string $heading, string $bodyHtml): string {
    return "<!doctype html><html><body style='margin:0;background:#0d1117;padding:24px;font-family:Segoe UI,Arial,sans-serif;'>"
        . "<div style='max-width:520px;margin:0 auto;background:#161b22;border:1px solid #30363d;border-radius:14px;overflow:hidden;'>"
        . "<div style='padding:22px 26px;border-bottom:1px solid #30363d;'>"
        . "<span style='font-size:18px;font-weight:700;color:#58a6ff;'>&#127926; My Records Collection</span></div>"
        . "<div style='padding:26px;color:#e6edf3;line-height:1.6;'>"
        . "<h2 style='margin:0 0 14px;font-size:19px;color:#e6edf3;'>" . htmlspecialchars($heading, ENT_QUOTES, 'UTF-8') . "</h2>"
        . $bodyHtml
        . "</div>"
        . "<div style='padding:16px 26px;border-top:1px solid #30363d;color:#6e7681;font-size:12px;'>"
        . "If you didn't request this, you can safely ignore this email.</div>"
        . "</div></body></html>";
}

function mail_button(string $label, string $url): string {
    $u = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    $l = htmlspecialchars($label, ENT_QUOTES, 'UTF-8');
    return "<p style='text-align:center;margin:24px 0;'>"
        . "<a href='$u' style='display:inline-block;background:#238636;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;'>$l</a></p>"
        . "<p style='font-size:12px;color:#6e7681;word-break:break-all;'>Or paste this link into your browser:<br>$u</p>";
}

/**
 * Create a random token; returns [rawToken, sha256Hash].
 */
function make_token(): array {
    $raw = bin2hex(random_bytes(32));
    return [$raw, hash('sha256', $raw)];
}

