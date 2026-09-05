# My Records Collection

A personal music collection manager for Vinyl, CD, Cassette, and Digital records. Built with vanilla HTML/CSS/JavaScript on the front end and PHP 8 + MySQL on the back end, hosted on IIS via FastCGI.

---

## Features

- **Accounts & authentication** — self-service sign-up with email verification, sign-in, password reset, change-password and change-email (with re-verification), and per-user data ownership. The first account becomes the administrator.
- **Admin user management** — approve, disable, promote, delete users, resend verification, and toggle open registration.
- **Security** — hardened PHP sessions, CSRF protection on state-changing requests, a built-in math captcha, and login rate-limiting.
- **Browse & search** — filter by genre, year, and format; sort by artist, album, year, genre, or date added
- **CRUD** — add, edit, and delete records with a modal form
- **Multi-select delete** — bulk remove records from the grid
- **Ratings, tags & wishlist** — rate records, tag them, and track wanted releases
- **Inline tag picker** — assign tags/shelves right from a record card via a dropdown: pick a built-in shelf suggestion, an existing collection tag, or type a new one (saved instantly)
- **Listening sessions** — log plays and see listening history
- **Cover art** — fetched automatically from MusicBrainz / Cover Art Archive and cached locally in `/covers/`
- **Track lookup** — pull track listings from MusicBrainz
- **Discogs valuation** — look up or bulk-value records via the Discogs Marketplace API using a per-user token
- **Statistics & dashboard** — collection breakdown by genre, format, and decade
- **Backup & restore** — export/import your collection as JSON
- **Light / dark theme** — with a system-follow option
- **CSV import** — bulk-import records from a CSV file with a preview step
- **Inline lyrics** — view lyrics for any track directly in the track list (fetched from the web and saved automatically)

---

## Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (ES6+)  |
| Backend    | PHP 8.5 (FastCGI)                       |
| Database   | MySQL                                   |
| Web server | IIS (`web.config` included)             |
| Cover art  | MusicBrainz API + Cover Art Archive     |
| Valuation  | Discogs API                             |

---

## Project Structure

```
├── index.html          # Main SPA shell (gated behind sign-in)
├── login.html          # Sign in / create account
├── verify.html         # Email verification landing page
├── reset.html          # Password reset landing page
├── help.html           # Help & how-to
├── web.config          # IIS / FastCGI configuration
├── css/
│   └── style.css
├── js/
│   ├── app.js          # Collection UI & API client
│   ├── auth-client.js  # Session gating, CSRF, account menu & settings
│   ├── login.js        # Login / registration page logic
│   ├── admin.js        # Admin user-management panel
│   └── ...             # Feature modules (theme, dashboard, wishlist, etc.)
├── api/
│   ├── api.php         # REST CRUD + stats + Discogs endpoints
│   ├── auth.php        # Authentication & account endpoints
│   ├── auth_lib.php    # Auth/session/CSRF/captcha helpers & schema setup
│   ├── cover.php       # Cover art cache proxy
│   └── db.php          # PDO connection (singleton)
└── covers/             # Cached cover art (auto-created)
```

> **Note:** `api/discogs_token.txt` and `*.log` are intentionally **git-ignored** — never commit secrets.

---

## Prerequisites

- **PHP 8.1+** with PDO and PDO_MySQL extensions enabled
- **MySQL 5.7+ / MariaDB 10.4+**
- **IIS** with FastCGI, or any web server with PHP support (adjust `web.config` / `.htaccess` as needed)

---

## Setup

### 1. Database

Create the database and table:

```sql
CREATE DATABASE record_collection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE record_collection;

CREATE TABLE records (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    artist      VARCHAR(255) NOT NULL,
    album       VARCHAR(255) NOT NULL,
    year        VARCHAR(4),
    genre       VARCHAR(100),
    format      ENUM('Vinyl','CD','Cassette','Digital') DEFAULT 'Vinyl',
    notes       TEXT,
    date_added  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE track_cache (
    mbid        VARCHAR(36) PRIMARY KEY,
    artist      VARCHAR(255),
    album       VARCHAR(255),
    tracks_json MEDIUMTEXT,
    cached_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Environment Variables

The database connection is configured entirely through environment variables (set these in IIS FastCGI application settings, a `.env` loader, or your server config):

| Variable      | Description              | Default            |
|---------------|--------------------------|--------------------|
| `RC_DB_HOST`  | MySQL host               | `127.0.0.1`        |
| `RC_DB_NAME`  | Database name            | `record_collection`|
| `RC_DB_USER`  | Database user            | *(empty)*          |
| `RC_DB_PASS`  | Database password        | *(empty)*          |

### 3. Discogs Token

Each signed-in user can save their own [Discogs personal access token](https://www.discogs.com/settings/developers) from **Account → Settings** in the app; it is stored on their account.

For a server-wide fallback token, set the `DISCOGS_TOKEN` environment variable (preferred) or place a token in `api/discogs_token.txt`. **This file is git-ignored and must never be committed** — treat any token that lands in version control as compromised and regenerate it.

### 4. Covers Directory

The `/covers/` directory is created automatically on first use. Ensure the PHP process has **write permission** to the project root.

### 5. IIS

The included `web.config` configures:
- PHP 8.5 via FastCGI (`C:\Program Files\php\v8.5\php-cgi.exe`) — update the path if needed
- Static file serving
- Security headers
- Directory browsing disabled

---

## API Endpoints

All endpoints are served by `api/api.php`.

| Method | Query / Body              | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | *(none)*                  | List all records                   |
| GET    | `?search=&genre=&year=&format=&sort=` | Filtered & sorted list   |
| GET    | `?id=N`                   | Get single record                  |
| GET    | `?meta=1`                 | Distinct years & genres for filters|
| GET    | `?stats=1`                | Collection statistics              |
| GET    | `?lookup=1&artist=&album=`| Look up info via MusicBrainz       |
| GET    | `?tracks=1&mbid=`         | Fetch track list from MusicBrainz  |
| GET    | `?discogs=value&id=N`     | Fetch Discogs value for one record |
| GET    | `?discogs=valuate_all`    | Bulk-value all uncached records    |
| POST   | JSON body                 | Create a new record                |
| POST   | `?import=csv`             | Bulk import from CSV               |
| PUT    | `?id=N` + JSON body       | Update a record                    |
| DELETE | `?id=N`                   | Delete a record                    |

Cover art endpoint: `GET api/cover.php?artist=...&album=...`

Authentication & account actions are served by `api/auth.php` (e.g. `register`, `login`, `logout`, `verify_email`, `resend_verification`, `request_reset`, `reset_password`, `change_password`, `change_email`, plus admin user-management actions). State-changing requests require a CSRF token.

---

## License

Code is released under the MIT License; collection data is dedicated to the public domain under CC0 1.0. (Add a `LICENSE` file to formalize this.)
