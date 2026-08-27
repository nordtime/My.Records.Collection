-- Migration script for Priority 2 features
-- Run this against your record_collection database

-- Add new columns to records table for Priority 2 features
ALTER TABLE records
ADD COLUMN rating TINYINT UNSIGNED DEFAULT 0 COMMENT '1-5 star rating',
ADD COLUMN play_count INT UNSIGNED DEFAULT 0 COMMENT 'Number of times played',
ADD COLUMN discogs_value DECIMAL(10,2) COMMENT 'Current Discogs marketplace value',
ADD COLUMN purchase_date DATE COMMENT 'Date record was purchased',
ADD COLUMN purchase_price DECIMAL(10,2) COMMENT 'Purchase price in USD',
ADD COLUMN purchase_location VARCHAR(255) COMMENT 'Where the record was purchased',
ADD COLUMN condition_grade VARCHAR(20) COMMENT 'Record condition grade',
ADD COLUMN cover_url VARCHAR(500) COMMENT 'URL to cover art';

-- Create listening_sessions table for play tracking
CREATE TABLE IF NOT EXISTS listening_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    record_id INT UNSIGNED NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    INDEX idx_record (record_id),
    INDEX idx_played (played_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255) NOT NULL,
    format VARCHAR(50) DEFAULT 'Vinyl',
    target_price DECIMAL(10,2),
    discogs_url VARCHAR(500),
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- All done!
-- Your database is now ready for Priority 2 features.
