# Database Cleaning Scripts

This directory contains scripts to clean spam and problematic data directly from the Papers with Code SQLite database.

## Files

- `clean_database.py` - Main database cleaning script
- `run_db_cleaning.py` - Interactive script to run cleaning operations
- `README_DB_CLEANING.md` - This file

## Quick Start

### Interactive Mode (Recommended)
```bash
cd data
python run_db_cleaning.py
```

This will show you a menu of options to:
1. Find and preview spam entries
2. Delete spam entries
3. Clean text fields
4. Find and preview duplicates
5. Remove duplicate entries
6. Show database statistics

### Command Line Mode

#### Find spam entries (dry run)
```bash
python clean_database.py --dry-run
```

#### Delete spam entries
```bash
python clean_database.py
```

#### Clean text fields (remove spam elements)
```bash
python clean_database.py --clean-text --dry-run  # Preview changes
python clean_database.py --clean-text            # Apply changes
```

#### Remove duplicates
```bash
python clean_database.py --remove-duplicates --dry-run  # Preview changes
python clean_database.py --remove-duplicates            # Apply changes
```

## What Gets Cleaned

### Spam Detection
The script identifies spam entries based on:

1. **Suspicious patterns in names:**
   - Triple hash marks (`###`)
   - Airline-related keywords (`cancel`, `refund`, `airline`)

2. **Phone number spam:**
   - Excessive phone numbers (more than 3)
   - Phone emojis (`📞`)
   - Specific spam phone patterns

3. **Spam keywords:**
   - Airline: `cancel`, `refund`, `airline`, `lufthansa`, `booking`, `ticket`, `travel`, `flight`
   - Phone spam: `call`, `phone`, `helpline`, `customer service`
   - Generic spam: `click here`, `buy now`, `limited time`, `act now`

4. **Repetitive content:**
   - Text with too many repeated words

### Text Cleaning
When cleaning text (instead of deleting), the script removes:
- Phone numbers
- Phone emojis
- Triple hash marks
- Excessive whitespace

### Duplicate Detection
Finds duplicates based on:
- Identical names
- Identical descriptions

## Safety Features

1. **Dry Run Mode**: Always preview changes before applying them
2. **Confirmation Prompts**: Interactive mode asks for confirmation before deleting
3. **Database Backup**: Consider backing up your database before cleaning
4. **Transaction Safety**: All changes are wrapped in database transactions

## Example Output

```
Papers with Code Database Cleaner
========================================
Found database: papers_with_code.db

Choose an operation:
1. Find and show spam entries (dry run)
2. Delete spam entries
3. Clean text fields (remove spam elements)
4. Find and show duplicates (dry run)
5. Remove duplicate entries
6. Show database statistics
0. Exit

Enter your choice (0-6): 1

Running: Find spam entries (dry run)
2024-01-XX XX:XX:XX,XXX - INFO - Connected to database: papers_with_code.db
2024-01-XX XX:XX:XX,XXX - INFO - Searching for spam entries in datasets table...
2024-01-XX XX:XX:XX,XXX - INFO - Found 15 potential spam entries
2024-01-XX XX:XX:XX,XXX - INFO - DRY RUN: Would delete 15 spam entries
2024-01-XX XX:XX:XX,XXX - INFO -   Would delete: ID 12345 - ###Can I Cancel Lufthansa Airlines and Get a...
2024-01-XX XX:XX:XX,XXX - INFO -   Would delete: ID 12346 - ###How to Get Refund from American Airlines...
2024-01-XX XX:XX:XX,XXX - INFO -   ... and 13 more
```

## Database Statistics

The script shows statistics for all tables:
- **papers**: Research papers
- **datasets**: Datasets used in research
- **methods**: Machine learning methods
- **evaluations**: Task evaluations
- **code_links**: Links to code repositories

## Troubleshooting

### Database not found
Make sure you're running the script from the `data` directory where `papers_with_code.db` is located.

### Permission errors
Ensure you have read/write permissions for the database file.

### Large database
For very large databases, the cleaning process may take several minutes. The script shows progress information.

## Backup Recommendations

Before running any cleaning operations, consider backing up your database:

```bash
cp papers_with_code.db papers_with_code_backup.db
```

## Advanced Usage

You can also use the `clean_database.py` script directly with custom options:

```bash
# Use a different database file
python clean_database.py --db /path/to/your/database.db

# Combine operations
python clean_database.py --clean-text --remove-duplicates --dry-run
```

## What the Script Does

1. **Connects to SQLite database**
2. **Scans datasets table** for problematic entries
3. **Applies cleaning rules** based on spam detection patterns
4. **Shows preview** of what would be changed (dry run mode)
5. **Applies changes** to database (when not in dry run mode)
6. **Reports statistics** before and after cleaning

The script is designed to be safe and reversible - always run with `--dry-run` first to see what would be changed! 