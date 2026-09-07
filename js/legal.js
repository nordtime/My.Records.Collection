/**
 * Shared legal text — data & usage disclaimer and license notice.
 * Referenced by login.js and auth-client.js.
 */
const RC_DISCLAIMER_EN = `
    <h3>What this app stores</h3>
    <p>My Records Collection stores the account details you provide (a username, an
    email address, and a securely hashed password) and the catalog data you enter
    (your records, ratings, tags, wishlist, and listening history). Your collection
    is private to your account and is not shown to other users.</p>

    <h3>How your data is used</h3>
    <ul>
        <li>Your data is used only to operate the app for you.</li>
        <li>Cover art, track lists, and market values may be fetched from third-party
            services (MusicBrainz, Cover Art Archive, Discogs) using the artist/album
            you enter. No account information is sent to them.</li>
        <li>A single essential cookie is used to keep you signed in. No advertising or
            third-party tracking cookies are used.</li>
    </ul>

    <h3>Your control</h3>
    <p>You can export a full JSON backup of your collection at any time, and you can
    permanently delete your account together with all of your data from the account
    menu. Deletion is immediate and irreversible.</p>

    <h3>License</h3>
    <p>The application source code is provided under the <strong>MIT License</strong>.
    Catalog data you choose to export or share is dedicated to the public domain under
    <strong>Creative Commons CC0 1.0</strong>. The software is provided
    &ldquo;as is&rdquo;, without warranty of any kind. You are responsible for keeping
    your own backups of data you care about.</p>

    <h3>No warranty</h3>
    <p>This is a personal, open-source project. It is provided without warranty and
    without any guarantee of availability, fitness for a particular purpose, or data
    retention.</p>
`;

const RC_DISCLAIMER_HE = `
    <h3>אילו נתונים היישום שומר</h3>
    <p>אוסף התקליטים שלי שומר את פרטי החשבון שסיפקת (שם משתמש, כתובת דוא״ל
    וסיסמה מוצפנת באופן מאובטח) ואת נתוני הקטלוג שהזנת (תקליטים, דירוגים,
    תגיות, רשימת משאלות והיסטוריית האזנה). האוסף פרטי לחשבון שלך ואינו מוצג
    למשתמשים אחרים.</p>

    <h3>כיצד נעשה שימוש בנתונים</h3>
    <ul>
        <li>הנתונים משמשים רק להפעלת היישום עבורך.</li>
        <li>עטיפות, רשימות רצועות ומחירי שוק עשויים להישלף משירותי צד שלישי
            (MusicBrainz, Cover Art Archive ו-Discogs) באמצעות שם האמן והאלבום
            שהזנת. פרטי החשבון אינם נשלחים אליהם.</li>
        <li>עוגייה חיונית אחת משמשת לשמירת החיבור לחשבון. אין שימוש בעוגיות
            פרסום או מעקב של צד שלישי.</li>
    </ul>

    <h3>השליטה שלך</h3>
    <p>אפשר לייצא גיבוי JSON מלא של האוסף בכל עת, ואפשר למחוק לצמיתות את
    החשבון ואת כל הנתונים דרך תפריט החשבון. המחיקה מיידית ואינה הפיכה.</p>

    <h3>רישיון</h3>
    <p>קוד המקור של היישום מסופק תחת <strong>רישיון MIT</strong>. נתוני קטלוג
    שבחרת לייצא או לשתף מוקדשים לנחלת הכלל תחת
    <strong>Creative Commons CC0 1.0</strong>. התוכנה מסופקת כפי שהיא, ללא
    אחריות מכל סוג. האחריות לשמירת גיבויים של נתונים חשובים מוטלת עליך.</p>

    <h3>ללא אחריות</h3>
    <p>זהו פרויקט אישי בקוד פתוח. הוא מסופק ללא אחריות וללא הבטחה לזמינות,
    להתאמה למטרה מסוימת או לשמירת נתונים.</p>
`;

const RC_COOKIE_NOTICE_EN = 'This site uses a single essential cookie to keep you signed in. ' +
    'No advertising or third-party tracking cookies are used.';

const RC_COOKIE_NOTICE_HE = 'אתר זה משתמש בעוגייה חיונית אחת כדי לשמור על החיבור לחשבון. ' +
    'אין שימוש בעוגיות פרסום או מעקב של צד שלישי.';

function applyLegalLanguage() {
    const isHebrew = window.I18n?.language === 'he';
    window.RC_DISCLAIMER_HTML = isHebrew ? RC_DISCLAIMER_HE : RC_DISCLAIMER_EN;
    window.RC_COOKIE_NOTICE = isHebrew ? RC_COOKIE_NOTICE_HE : RC_COOKIE_NOTICE_EN;

    document.querySelectorAll('#disclaimerBody, #appDisclaimerModal .modal-body').forEach(element => {
        element.innerHTML = window.RC_DISCLAIMER_HTML;
    });
    const cookieText = document.querySelector('#cookieNotice p');
    if (cookieText) cookieText.textContent = window.RC_COOKIE_NOTICE;
}

applyLegalLanguage();
document.addEventListener('rc:languagechange', applyLegalLanguage);
