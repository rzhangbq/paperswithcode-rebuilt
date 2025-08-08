#!/usr/bin/env python3
"""
Script to enhance the existing papers_with_code.db with methods areas and categories.
This adds the hierarchical methods organization directly to the original database.
"""

import sqlite3
import json
import os
import logging
from typing import Dict, List, Any

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseEnhancer:
    def __init__(self, db_path: str = "papers_with_code.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Connect to the existing database"""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        logger.info(f"Connected to existing database: {self.db_path}")
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
            
    def check_existing_tables(self):
        """Check if enhanced tables already exist"""
        self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('method_areas', 'method_categories', 'method_categories_rel')
        """)
        existing_tables = [row[0] for row in self.cursor.fetchall()]
        
        if existing_tables:
            logger.warning(f"Enhanced tables already exist: {existing_tables}")
            logger.warning("Skipping table creation. Use --force to recreate.")
            return True
        return False
        
    def create_enhanced_tables(self):
        """Create the enhanced methods tables"""
        logger.info("Creating enhanced methods tables...")
        
        # Method areas table (e.g., "Computer Vision", "Natural Language Processing")
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS method_areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                area_id TEXT UNIQUE,
                area_name TEXT UNIQUE
            )
        ''')
        
        # Method categories table (e.g., "Convolutional Neural Networks", "Transformers")
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS method_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                area_id INTEGER,
                FOREIGN KEY (area_id) REFERENCES method_areas (id)
            )
        ''')
        
        # Method-Categories relationship table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS method_categories_rel (
                method_id INTEGER,
                category_id INTEGER,
                FOREIGN KEY (method_id) REFERENCES methods (id),
                FOREIGN KEY (category_id) REFERENCES method_categories (id),
                PRIMARY KEY (method_id, category_id)
            )
        ''')
        
        # Add new columns to existing methods table if they don't exist
        self.cursor.execute("PRAGMA table_info(methods)")
        existing_columns = [row[1] for row in self.cursor.fetchall()]
        
        new_columns = [
            ('introduced_year', 'INTEGER'),
            ('source_url', 'TEXT'),
            ('source_title', 'TEXT'),
            ('code_snippet_url', 'TEXT'),
            ('num_papers', 'INTEGER')
        ]
        
        for column_name, column_type in new_columns:
            if column_name not in existing_columns:
                logger.info(f"Adding column {column_name} to methods table")
                self.cursor.execute(f'ALTER TABLE methods ADD COLUMN {column_name} {column_type}')
        
        self.conn.commit()
        logger.info("Enhanced tables created successfully")
        
    def update_methods_with_enhanced_data(self, methods_file: str):
        """Update existing methods with enhanced data from JSON file"""
        logger.info(f"Loading enhanced methods data from {methods_file}...")
        
        with open(methods_file, 'r', encoding='utf-8') as f:
            methods = json.load(f)
            
        logger.info(f"Found {len(methods)} methods to enhance")
        
        for i, method in enumerate(methods):
            if i % 1000 == 0:
                logger.info(f"Processing method {i+1}/{len(methods)}")
                
            # Update method with enhanced fields
            self.cursor.execute('''
                UPDATE methods SET 
                    introduced_year = ?,
                    source_url = ?,
                    source_title = ?,
                    code_snippet_url = ?,
                    num_papers = ?
                WHERE url = ?
            ''', (
                method.get('introduced_year'),
                method.get('source_url'),
                method.get('source_title'),
                method.get('code_snippet_url'),
                method.get('num_papers'),
                method.get('url')
            ))
            
            # Get method ID for linking to categories
            self.cursor.execute('SELECT id FROM methods WHERE url = ?', (method.get('url'),))
            result = self.cursor.fetchone()
            if not result:
                continue
                
            method_id = result[0]
            
            # Process collections (categories and areas)
            if method.get('collections') and method_id:
                for collection in method['collections']:
                    area_id = collection.get('area_id')
                    area_name = collection.get('area')
                    category_name = collection.get('collection')
                    
                    if area_id and area_name:
                        # Insert area if not exists
                        self.cursor.execute('''
                            INSERT OR IGNORE INTO method_areas (area_id, area_name) VALUES (?, ?)
                        ''', (area_id, area_name))
                        
                        # Get area ID
                        self.cursor.execute('SELECT id FROM method_areas WHERE area_id = ?', (area_id,))
                        area_db_id = self.cursor.fetchone()[0]
                        
                        if category_name:
                            # Insert category if not exists
                            self.cursor.execute('''
                                INSERT OR IGNORE INTO method_categories (name, area_id) VALUES (?, ?)
                            ''', (category_name, area_db_id))
                            
                            # Get category ID
                            self.cursor.execute('SELECT id FROM method_categories WHERE name = ? AND area_id = ?', 
                                              (category_name, area_db_id))
                            category_id = self.cursor.fetchone()[0]
                            
                            # Link method to category
                            self.cursor.execute('''
                                INSERT OR IGNORE INTO method_categories_rel (method_id, category_id)
                                VALUES (?, ?)
                            ''', (method_id, category_id))
            
            if i % 1000 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info("Methods enhancement completed")
        
    def create_enhanced_indexes(self):
        """Create indexes for the enhanced tables"""
        logger.info("Creating enhanced indexes...")
        
        # Enhanced Methods indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_methods_introduced_year ON methods(introduced_year)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_methods_num_papers ON methods(num_papers)')
        
        # Method areas indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_method_areas_area_id ON method_areas(area_id)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_method_areas_area_name ON method_areas(area_name)')
        
        # Method categories indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_method_categories_name ON method_categories(name)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_method_categories_area_id ON method_categories(area_id)')
        
        # Method categories relationship indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_method_categories_rel_method_id ON method_categories_rel(method_id)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_method_categories_rel_category_id ON method_categories_rel(category_id)')
        
        self.conn.commit()
        logger.info("Enhanced indexes created successfully")
        
    def get_enhanced_stats(self):
        """Get statistics about the enhanced database"""
        logger.info("Getting enhanced database statistics...")
        
        # Check if enhanced tables exist
        self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('method_areas', 'method_categories', 'method_categories_rel')
        """)
        enhanced_tables = [row[0] for row in self.cursor.fetchall()]
        
        if not enhanced_tables:
            logger.warning("Enhanced tables not found. Run enhancement first.")
            return
            
        # Get enhanced table counts
        for table in enhanced_tables:
            self.cursor.execute(f'SELECT COUNT(*) FROM {table}')
            count = self.cursor.fetchone()[0]
            logger.info(f"{table.capitalize()}: {count:,} records")
            
        # Get methods hierarchy
        self.cursor.execute('''
            SELECT 
                ma.area_name,
                COUNT(DISTINCT mc.id) as category_count,
                COUNT(DISTINCT m.id) as method_count
            FROM method_areas ma
            LEFT JOIN method_categories mc ON ma.id = mc.area_id
            LEFT JOIN method_categories_rel mcr ON mc.id = mcr.category_id
            LEFT JOIN methods m ON mcr.method_id = m.id
            GROUP BY ma.id, ma.area_name
            ORDER BY method_count DESC
        ''')
        
        area_stats = self.cursor.fetchall()
        logger.info("Methods hierarchy:")
        for area_name, category_count, method_count in area_stats:
            logger.info(f"  {area_name}: {category_count} categories, {method_count} methods")
            
        # Get top methods by papers
        self.cursor.execute('''
            SELECT name, full_name, num_papers, introduced_year
            FROM methods 
            WHERE num_papers > 0
            ORDER BY num_papers DESC 
            LIMIT 10
        ''')
        
        top_methods = self.cursor.fetchall()
        logger.info("Top methods by papers:")
        for i, (name, full_name, num_papers, year) in enumerate(top_methods, 1):
            logger.info(f"  {i}. {name}: {num_papers:,} papers ({year})")

def main():
    """Main function to enhance the existing database"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Enhance existing papers_with_code.db with methods areas and categories")
    parser.add_argument('--force', action='store_true', help='Force recreation of enhanced tables')
    parser.add_argument('--db', default='papers_with_code.db', help='Database file path')
    args = parser.parse_args()
    
    enhancer = DatabaseEnhancer(args.db)
    
    try:
        enhancer.connect()
        
        # Check if database exists and has methods table
        enhancer.cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='methods'")
        if not enhancer.cursor.fetchone():
            logger.error("Methods table not found. Please build the standard database first.")
            return
            
        # Check if enhanced tables already exist
        if enhancer.check_existing_tables() and not args.force:
            logger.info("Enhanced tables already exist. Use --force to recreate.")
            enhancer.get_enhanced_stats()
            return
            
        # Create enhanced tables
        enhancer.create_enhanced_tables()
        
        # Update methods with enhanced data
        if os.path.exists('../raw_data/methods.json'):
            enhancer.update_methods_with_enhanced_data('../raw_data/methods.json')
        
        # Create enhanced indexes
        enhancer.create_enhanced_indexes()
        
        # Get enhanced statistics
        enhancer.get_enhanced_stats()
        
        logger.info("Database enhancement completed successfully!")
        
    except Exception as e:
        logger.error(f"Error enhancing database: {e}")
        raise
    finally:
        enhancer.close()

if __name__ == "__main__":
    main() 