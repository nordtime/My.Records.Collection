# My Records Collection

A personal music collection manager for Vinyl, CD, Cassette, and Digital records. Built with vanilla HTML/CSS/JavaScript on the front end and PHP 8 + MySQL on the back end, hosted on IIS via FastCGI.

---

## Features

- **Browse & search** — filter by genre, year, and format; sort by artist, album, year, genre, or date added
- **CRUD** — add, edit, and delete records with a modal form
- **Multi-select delete** — bulk remove records from the grid
- **Cover art** — fetched automatically from MusicBrainz / Cover Art Archive and cached locally in `/covers/`
- **Track lookup** — pull track listings from MusicBrainz
- **Discogs valuation** — look up or bulk-value records via the Discogs Marketplace API
- **Statistics** — collection breakdown by genre, format, and decade
- **CSV import** — bulk-import records from a CSV file with a preview step
- **Lyrics viewer** — `lyrics.html` for looking up song lyrics

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
├── index.html          # Main SPA shell
├── lyrics.html         # Lyrics viewer
├── web.config          # IIS / FastCGI configuration
├── css/
│   └── style.css
├── js/
│   ├── app.js          # Collection UI & API client
│   └── lyrics.js       # Lyrics page logic
├── api/
│   ├── api.php         # REST CRUD + stats + Discogs endpoints
│   ├── cover.php       # Cover art cache proxy
│   ├── db.php          # PDO connection (singleton)
│   └── discogs_token.txt  # Your Discogs personal access token
└── covers/             # Cached cover art (auto-created)
```

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

Place your [Discogs personal access token](https://www.discogs.com/settings/developers) in:

```
api/discogs_token.txt
```

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

---

## License

Personal / private use. No license — all rights reserved.
