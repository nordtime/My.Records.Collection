/**
 * Shared legal text — data & usage disclaimer and license notice.
 * Referenced by login.js and auth-client.js.
 */
window.RC_DISCLAIMER_HTML = `
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

window.RC_COOKIE_NOTICE = 'This site uses a single essential cookie to keep you signed in. ' +
    'No advertising or third-party tracking cookies are used.';
