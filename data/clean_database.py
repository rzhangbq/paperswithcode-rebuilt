#!/usr/bin/env python3
"""
Script to remove database entries that are likely spam (empty homepage + no dataset mention).
"""

import sqlite3
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def find_spam_entries(db_path: str = "papers_with_code.db"):
    """
    Find entries that are likely spam: empty homepage AND description doesn't contain 'dataset' or 'Dataset'.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    logger.info("Searching for likely spam entries...")
    
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
    
    logger.info(f"Found {len(spam_entries)} likely spam entries")
    
    # Show some examples
    logger.info("Examples of likely spam entries:")
    for i, (entry_id, name, description, homepage) in enumerate(spam_entries[:10]):
        logger.info(f"  ID {entry_id}: {name[:80]}...")
        if description:
            desc_preview = description[:100].replace('\ud83d\udcde', '📞')
            logger.info(f"    Description: {desc_preview}...")
        logger.info(f"    Homepage: '{homepage}'")
    
    if len(spam_entries) > 10:
        logger.info(f"  ... and {len(spam_entries) - 10} more")
    
    conn.close()
    return spam_entries

def delete_spam_entries(db_path: str = "papers_with_code.db", dry_run: bool = True):
    """
    Delete entries that are likely spam: empty homepage AND description doesn't contain 'dataset' or 'Dataset'.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    if dry_run:
        logger.info("DRY RUN: Would delete likely spam entries")
        
        # Count entries to be deleted
        cursor.execute("""
            SELECT COUNT(*) FROM datasets 
            WHERE (homepage IS NULL OR homepage = '' OR homepage = ' ')
              AND (description IS NULL 
                   OR description = '' 
                   OR (description NOT LIKE '%dataset%' AND description NOT LIKE '%Dataset%'))
        """)
        count = cursor.fetchone()[0]
        
        logger.info(f"Would delete {count} likely spam entries")
        
        # Show some examples
        cursor.execute("""
            SELECT id, name 
            FROM datasets 
            WHERE (homepage IS NULL OR homepage = '' OR homepage = ' ')
              AND (description IS NULL 
                   OR description = '' 
                   OR (description NOT LIKE '%dataset%' AND description NOT LIKE '%Dataset%'))
            LIMIT 10
        """)
        
        examples = cursor.fetchall()
        for entry_id, name in examples:
            logger.info(f"  Would delete: ID {entry_id} - {name[:80]}...")
            
        if count > 10:
            logger.info(f"  ... and {count - 10} more")
            
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
        
        logger.info(f"Deleted {deleted_count} likely spam entries")
    
    conn.close()

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
    
    parser = argparse.ArgumentParser(description='Remove database entries that are likely spam (empty homepage + no dataset mention)')
    parser.add_argument('--db', default='papers_with_code.db', help='Database file path')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be deleted without actually deleting')
    parser.add_argument('--show-only', action='store_true', help='Only show entries, don\'t delete')
    
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
        print(f"\nShowing spam entries:")
        find_spam_entries(args.db)
    else:
        # Delete the entries
        print(f"\n{'DRY RUN: ' if args.dry_run else ''}Removing spam entries...")
        delete_spam_entries(args.db, dry_run=args.dry_run)
        
        # Show final stats
        print("\nFinal database statistics:")
        stats = get_database_stats(args.db)
        print(f"  Total datasets: {stats['total_datasets']:,}")
        print(f"  Datasets with empty homepage: {stats['empty_homepage_datasets']:,}")
        print(f"  Datasets with no 'dataset' mention: {stats['no_dataset_mention_datasets']:,}")
        print(f"  Likely spam datasets (empty homepage + no dataset mention): {stats['likely_spam_datasets']:,}")

if __name__ == "__main__":
    main() 