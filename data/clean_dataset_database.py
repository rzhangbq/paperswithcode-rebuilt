#!/usr/bin/env python3
"""
Script to remove database entries that are likely spam.
Detects various spam patterns including:
- Empty homepage + no dataset mention
- Airline/flight booking spam
- Customer service/support spam
- Date patterns indicating spam
- Other commercial spam patterns
"""

import sqlite3
import logging
import re
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define spam patterns
SPAM_PATTERNS = {
    'airline_spam': [
        'can-you-change%flight', 'how-to-cancel%flight', 'airline%cancellation%policy',
        'american%airlines%change', 'british%airway%customer', 'lufthansa%customer%service',
        'delta%airlines%refund', '%flight%without%fee%', '%cancel%flight%same%day%',
        '%change%flight%without%penalty%', '%airline%helpline%', '%flight%booking%customer%'
    ],
    'customer_service': [
        '%customer%service%hotline%', '%support%line%for%', '%helpline%for%',
        '%toll%free%customer%', '%call%center%support%', '%24%7%customer%',
        '%contact%us%support%'
    ],
    'date_patterns': [
        '%27%6%2025%', '%2024%', '%2025%', '%support%line%for%british%',
        '%changes%and%delta%airlines%', '%support%line%for%lufthansa%'
    ],
    'question_spam': [
        'can-you-change%', 'how-do-i%', 'what-if-i%', 'how-much-does%',
        'how-to-cancel%', 'what-are%policies%', 'can-i-cancel%',
        'what-is-the%cancellation%', 'how-can-i-change%', 'whats-the%'
    ]
}

def has_invalid_homepage(homepage: str) -> bool:
    """Check if homepage is invalid (empty, null, or malformed)."""
    if not homepage or homepage.strip() == '':
        return True
    if homepage.startswith('/') or homepage.startswith('http://paperswithcode.com'):
        return True
    return False

def check_spam_patterns(name: str, description: str = None, homepage: str = None) -> tuple:
    """
    Check if a dataset name or description matches spam patterns.
    Focus on question-based spam with invalid homepages.
    Returns (is_spam, spam_type, matched_pattern)
    """
    if not name:
        return False, None, None
        
    name_lower = name.lower()
    
    # Question-based spam patterns (must have invalid homepage)
    question_patterns = [
        'can-you-change', 'how-do-i', 'what-if-i', 'how-much-does',
        'how-to-cancel', 'what-are', 'can-i-cancel', 'what-is-the',
        'how-can-i-change', 'whats-the', 'support-line-for'
    ]
    
    # Airline/service specific spam
    service_patterns = [
        'lufthansa-airlines', 'british-airlines', 'american-airlines',
        'delta-airlines', 'customer-service-hotline', 'support-line-for'
    ]
    
    # Specific spam date patterns
    spam_date_patterns = ['27-6-2025', 'support-line-for-british-airlines-27-6-2025']
    
    # Check question patterns with invalid homepage
    for pattern in question_patterns:
        if pattern in name_lower and has_invalid_homepage(homepage):
            return True, 'question_spam', pattern
    
    # Check service patterns with invalid homepage  
    for pattern in service_patterns:
        if pattern in name_lower and has_invalid_homepage(homepage):
            return True, 'service_spam', pattern
    
    # Check specific spam date patterns
    for pattern in spam_date_patterns:
        if pattern in name_lower:
            return True, 'date_spam', pattern
    
    return False, None, None

def find_original_spam_entries(db_path: str = "papers_with_code.db"):
    """
    Find entries that are likely spam: empty homepage AND description doesn't contain 'dataset' or 'Dataset'.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    logger.info("Searching for original spam entries (empty homepage + no dataset mention)...")
    
    # Find entries with empty homepage AND description doesn't contain 'dataset' or 'Dataset'
    cursor.execute("""
        SELECT id, name, description, homepage 
        FROM datasets 
        WHERE (homepage IS NULL OR homepage = '' OR homepage = ' ')
          AND (description IS NULL 
               OR description = '' 
               OR (description NOT LIKE '%dataset%' AND description NOT LIKE '%Dataset%'))
    """)
    
    spam_entries = cursor.fetchall()
    
    logger.info(f"Found {len(spam_entries)} original spam entries")
    conn.close()
    return spam_entries

def find_pattern_spam_entries(db_path: str = "papers_with_code.db"):
    """
    Find entries that match known spam patterns.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    logger.info("Searching for pattern-based spam entries...")
    
    # Get all datasets to check patterns
    cursor.execute("SELECT id, name, description, homepage FROM datasets")
    all_entries = cursor.fetchall()
    
    pattern_spam = []
    spam_by_type = {}
    
    for entry_id, name, description, homepage in all_entries:
        is_spam, spam_type, matched_pattern = check_spam_patterns(name, description, homepage)
        
        if is_spam:
            pattern_spam.append((entry_id, name, description, homepage, spam_type, matched_pattern))
            
            if spam_type not in spam_by_type:
                spam_by_type[spam_type] = []
            spam_by_type[spam_type].append((entry_id, name))
    
    logger.info(f"Found {len(pattern_spam)} pattern-based spam entries")
    
    # Show breakdown by spam type
    for spam_type, entries in spam_by_type.items():
        logger.info(f"  {spam_type}: {len(entries)} entries")
        # Show examples
        for i, (entry_id, name) in enumerate(entries[:3]):
            logger.info(f"    Example: ID {entry_id} - {name[:60]}...")
        if len(entries) > 3:
            logger.info(f"    ... and {len(entries) - 3} more")
    
    conn.close()
    return pattern_spam, spam_by_type

def delete_original_spam_entries(db_path: str = "papers_with_code.db", dry_run: bool = True):
    """
    Delete entries that are likely spam: empty homepage AND description doesn't contain 'dataset' or 'Dataset'.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    if dry_run:
        logger.info("DRY RUN: Would delete original spam entries")
        
        # Count entries to be deleted
        cursor.execute("""
            SELECT COUNT(*) FROM datasets 
            WHERE (homepage IS NULL OR homepage = '' OR homepage = ' ')
              AND (description IS NULL 
                   OR description = '' 
                   OR (description NOT LIKE '%dataset%' AND description NOT LIKE '%Dataset%'))
        """)
        count = cursor.fetchone()[0]
        
        logger.info(f"Would delete {count} original spam entries")
    else:
        # Actually delete the entries
        cursor.execute("""
            DELETE FROM datasets 
            WHERE (homepage IS NULL OR homepage = '' OR homepage = ' ')
              AND (description IS NULL 
                   OR description = '' 
                   OR (description NOT LIKE '%dataset%' AND description NOT LIKE '%Dataset%'))
        """)
        deleted_count = cursor.rowcount
        
        # Commit the changes
        conn.commit()
        
        logger.info(f"Deleted {deleted_count} original spam entries")
        
        conn.close()
        return deleted_count
    
    conn.close()
    return 0

def delete_pattern_spam_entries(db_path: str = "papers_with_code.db", dry_run: bool = True):
    """
    Delete entries that match known spam patterns.
    """
    pattern_spam, spam_by_type = find_pattern_spam_entries(db_path)
    
    if not pattern_spam:
        logger.info("No pattern-based spam entries found")
        return 0
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    if dry_run:
        logger.info(f"DRY RUN: Would delete {len(pattern_spam)} pattern-based spam entries")
        for spam_type, entries in spam_by_type.items():
            logger.info(f"  Would delete {len(entries)} {spam_type} entries")
    else:
        # Delete entries by ID
        spam_ids = [entry[0] for entry in pattern_spam]
        placeholders = ','.join(['?'] * len(spam_ids))
        
        cursor.execute(f"DELETE FROM datasets WHERE id IN ({placeholders})", spam_ids)
        deleted_count = cursor.rowcount
        
        # Commit the changes
        conn.commit()
        
        logger.info(f"Deleted {deleted_count} pattern-based spam entries")
        for spam_type, entries in spam_by_type.items():
            logger.info(f"  Deleted {len(entries)} {spam_type} entries")
        
        conn.close()
        return deleted_count
    
    conn.close()
    return 0

def get_database_stats(db_path: str = "papers_with_code.db"):
    """
    Get current database statistics.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM datasets")
    total_datasets = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM datasets 
        WHERE (homepage IS NULL OR homepage = '' OR homepage = ' ')
          AND (description IS NULL 
               OR description = '' 
               OR (description NOT LIKE '%dataset%' AND description NOT LIKE '%Dataset%'))
    """)
    likely_spam_datasets = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM datasets 
        WHERE homepage IS NULL OR homepage = '' OR homepage = ' '
    """)
    empty_homepage_datasets = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM datasets 
        WHERE description IS NULL 
           OR description = '' 
           OR (description NOT LIKE '%dataset%' AND description NOT LIKE '%Dataset%')
    """)
    no_dataset_mention_datasets = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'total_datasets': total_datasets,
        'likely_spam_datasets': likely_spam_datasets,
        'empty_homepage_datasets': empty_homepage_datasets,
        'no_dataset_mention_datasets': no_dataset_mention_datasets
    }

def main():
    """
    Main function to remove spam entries.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Remove database entries that are likely spam')
    parser.add_argument('--db', default='papers_with_code.db', help='Database file path')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be deleted without actually deleting')
    parser.add_argument('--show-only', action='store_true', help='Only show entries, don\'t delete')
    parser.add_argument('--pattern-only', action='store_true', help='Only remove pattern-based spam (airlines, customer service, etc.)')
    parser.add_argument('--original-only', action='store_true', help='Only remove original spam (empty homepage + no dataset mention)')
    
    args = parser.parse_args()
    
    # Check if database exists
    if not Path(args.db).exists():
        print(f"Error: Database file '{args.db}' not found!")
        return
    
    # Show initial stats
    print("\nInitial database statistics:")
    stats = get_database_stats(args.db)
    print(f"  Total datasets: {stats['total_datasets']:,}")
    print(f"  Datasets with empty homepage: {stats['empty_homepage_datasets']:,}")
    print(f"  Datasets with no 'dataset' mention: {stats['no_dataset_mention_datasets']:,}")
    print(f"  Likely spam datasets (empty homepage + no dataset mention): {stats['likely_spam_datasets']:,}")
    
    if args.show_only:
        # Just show the entries
        print(f"\nShowing original spam entries:")
        find_original_spam_entries(args.db)
        
        print(f"\nShowing pattern-based spam entries:")
        find_pattern_spam_entries(args.db)
    else:
        total_deleted = 0
        
        # Remove pattern-based spam unless --original-only is specified
        if not args.original_only:
            print(f"\n{'DRY RUN: ' if args.dry_run else ''}Removing pattern-based spam entries...")
            deleted = delete_pattern_spam_entries(args.db, dry_run=args.dry_run)
            total_deleted += deleted
        
        # Remove original spam unless --pattern-only is specified
        if not args.pattern_only:
            print(f"\n{'DRY RUN: ' if args.dry_run else ''}Removing original spam entries...")
            deleted = delete_original_spam_entries(args.db, dry_run=args.dry_run)
            total_deleted += deleted
        
        if not args.dry_run and total_deleted > 0:
            print(f"\nTotal entries deleted: {total_deleted}")
        
        # Show final stats
        print("\nFinal database statistics:")
        stats = get_database_stats(args.db)
        print(f"  Total datasets: {stats['total_datasets']:,}")
        print(f"  Datasets with empty homepage: {stats['empty_homepage_datasets']:,}")
        print(f"  Datasets with no 'dataset' mention: {stats['no_dataset_mention_datasets']:,}")
        print(f"  Likely spam datasets (empty homepage + no dataset mention): {stats['likely_spam_datasets']:,}")

if __name__ == "__main__":
    main() 