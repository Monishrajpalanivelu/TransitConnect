-- TransitConnect DB Migration v2
-- Run this in MySQL Workbench or via the PowerShell command below.

USE TransitConnect;

-- ============================================================
-- 1. hops table: add is_one_way flag (safe — checks before adding)
-- ============================================================
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'hops' AND column_name = 'is_one_way'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE hops ADD COLUMN is_one_way TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT ''is_one_way already exists, skipping.'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. Normalize mode values to uppercase enum names
-- ============================================================
UPDATE hops SET mode = 'BUS'   WHERE LOWER(TRIM(mode)) IN ('bus');
UPDATE hops SET mode = 'METRO' WHERE LOWER(TRIM(mode)) IN ('metro');
UPDATE hops SET mode = 'WALK'  WHERE LOWER(TRIM(mode)) IN ('walk');
UPDATE hops SET mode = 'AUTO'  WHERE LOWER(TRIM(mode)) IN ('auto','bike');
UPDATE hops SET mode = 'BUS'   WHERE mode NOT IN ('BUS','METRO','WALK','AUTO');

-- ============================================================
-- 3. stops table: add canonical_name column (safe)
-- ============================================================
SET @col_exists2 = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'stops' AND column_name = 'canonical_name'
);
SET @sql2 = IF(@col_exists2 = 0,
    'ALTER TABLE stops ADD COLUMN canonical_name VARCHAR(255)',
    'SELECT ''canonical_name already exists, skipping.'''
);
PREPARE stmt FROM @sql2; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Populate from existing location values
UPDATE stops
SET canonical_name = LOWER(REGEXP_REPLACE(location, '[^a-zA-Z0-9 ]', ''))
WHERE canonical_name IS NULL OR canonical_name = '';

-- Make NOT NULL
ALTER TABLE stops MODIFY COLUMN canonical_name VARCHAR(255) NOT NULL;

-- Add unique index (safe)
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'stops' AND index_name = 'idx_stop_canonical_name'
);
SET @sql3 = IF(@idx_exists = 0,
    'ALTER TABLE stops ADD UNIQUE INDEX idx_stop_canonical_name (canonical_name)',
    'SELECT ''Index already exists, skipping.'''
);
PREPARE stmt FROM @sql3; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- Verify:
--   SELECT id, location, canonical_name FROM stops;
--   SELECT id, mode, is_one_way FROM hops LIMIT 20;
-- ============================================================
