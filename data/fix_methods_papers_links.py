#!/usr/bin/env python3
"""
Script to fix the paper-method relationships by properly linking papers to methods.
This extracts methods data from papers and creates the proper paper_methods relationships.
"""

import sqlite3
import json
import logging
from typing import Dict, List, Any

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MethodsPapersLinker:
    def __init__(self, db_path: str = "papers_with_code.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Connect to the database"""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        logger.info(f"Connected to database: {self.db_path}")
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
            
    def get_papers_with_methods(self):
        """Get papers that have methods data"""
        logger.info("Getting papers with methods data...")
        
        # Get papers that have methods in their JSON data
        self.cursor.execute('''
            SELECT id, paper_url, methods 
            FROM papers 
            WHERE methods IS NOT NULL AND methods != ''
        ''')
        
        papers = self.cursor.fetchall()
        logger.info(f"Found {len(papers)} papers with methods data")
        return papers
        
    def link_papers_to_methods(self):
        """Link papers to methods based on the methods data in papers"""
        logger.info("Linking papers to methods...")
        
        papers = self.get_papers_with_methods()
        
        linked_count = 0
        total_relationships = 0
        
        for i, (paper_id, paper_url, methods_json) in enumerate(papers):
            if i % 1000 == 0:
                logger.info(f"Processing paper {i+1}/{len(papers)}")
                
            try:
                # Parse the methods JSON
                methods_data = json.loads(methods_json)
                
                for method in methods_data:
                    method_url = method.get('url')
                    if method_url:
                        # Find the method in the methods table
                        self.cursor.execute('SELECT id FROM methods WHERE url = ?', (method_url,))
                        method_result = self.cursor.fetchone()
                        
                        if method_result:
                            method_id = method_result[0]
                            
                            # Create the relationship
                            self.cursor.execute('''
                                INSERT OR IGNORE INTO paper_methods (paper_id, method_id)
                                VALUES (?, ?)
                            ''', (paper_id, method_id))
                            
                            total_relationships += 1
                
                linked_count += 1
                
                if i % 1000 == 0:
                    self.conn.commit()
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse methods JSON for paper {paper_id}: {e}")
                continue
            except Exception as e:
                logger.error(f"Error processing paper {paper_id}: {e}")
                continue
                
        self.conn.commit()
        logger.info(f"Linked {linked_count} papers to methods")
        logger.info(f"Created {total_relationships} paper-method relationships")
        
    def update_method_paper_counts(self):
        """Update the num_papers field in methods table based on actual relationships"""
        logger.info("Updating method paper counts...")
        
        self.cursor.execute('''
            UPDATE methods 
            SET num_papers = (
                SELECT COUNT(DISTINCT pm.paper_id)
                FROM paper_methods pm
                WHERE pm.method_id = methods.id
            )
        ''')
        
        self.conn.commit()
        logger.info("Updated method paper counts")
        
    def get_methods_statistics(self):
        """Get statistics about methods and their paper relationships"""
        logger.info("Getting methods statistics...")
        
        # Get total methods with papers
        self.cursor.execute('''
            SELECT COUNT(*) FROM methods WHERE num_papers > 0
        ''')
        methods_with_papers = self.cursor.fetchone()[0]
        
        # Get total paper-method relationships
        self.cursor.execute('SELECT COUNT(*) FROM paper_methods')
        total_relationships = self.cursor.fetchone()[0]
        
        # Get top methods by papers
        self.cursor.execute('''
            SELECT name, full_name, num_papers, introduced_year
            FROM methods 
            WHERE num_papers > 0
            ORDER BY num_papers DESC 
            LIMIT 10
        ''')
        
        top_methods = self.cursor.fetchone()
        
        logger.info(f"Methods with papers: {methods_with_papers:,}")
        logger.info(f"Total paper-method relationships: {total_relationships:,}")
        
        logger.info("Top methods by papers:")
        for i, (name, full_name, num_papers, year) in enumerate(top_methods, 1):
            logger.info(f"  {i}. {name}: {num_papers:,} papers ({year})")
            
    def get_methods_hierarchy_with_papers(self):
        """Get the methods hierarchy with accurate paper counts"""
        logger.info("Getting methods hierarchy with paper counts...")
        
        self.cursor.execute('''
            SELECT 
                ma.area_name,
                mc.name as category_name,
                COUNT(DISTINCT m.id) as method_count,
                SUM(m.num_papers) as total_papers
            FROM method_areas ma
            LEFT JOIN method_categories mc ON ma.id = mc.area_id
            LEFT JOIN method_categories_rel mcr ON mc.id = mcr.category_id
            LEFT JOIN methods m ON mcr.method_id = m.id
            GROUP BY ma.id, ma.area_name, mc.id, mc.name
            ORDER BY ma.area_name, total_papers DESC, method_count DESC, mc.name
        ''')
        
        results = self.cursor.fetchall()
        
        hierarchy = {}
        for row in results:
            area_name, category_name, method_count, total_papers = row
            
            if area_name not in hierarchy:
                hierarchy[area_name] = []
            
            if category_name:
                hierarchy[area_name].append({
                    'category': category_name,
                    'method_count': method_count,
                    'total_papers': total_papers or 0
                })
        
        # Display hierarchy
        for area_name, categories in hierarchy.items():
            total_methods = sum(cat['method_count'] for cat in categories)
            total_papers = sum(cat['total_papers'] for cat in categories)
            logger.info(f"\n{area_name}")
            logger.info(f"  {len(categories)} categories, {total_methods} methods, {total_papers:,} papers")
            
            # Show top categories
            for category in categories[:5]:
                logger.info(f"    {category['category']}: {category['method_count']} methods, {category['total_papers']:,} papers")
        
        return hierarchy

def main():
    """Main function to fix paper-method relationships"""
    linker = MethodsPapersLinker()
    
    try:
        linker.connect()
        
        # Link papers to methods
        linker.link_papers_to_methods()
        
        # Update method paper counts
        linker.update_method_paper_counts()
        
        # Get statistics
        linker.get_methods_statistics()
        
        # Get methods hierarchy with paper counts
        linker.get_methods_hierarchy_with_papers()
        
        logger.info("Paper-method linking completed successfully!")
        
    except Exception as e:
        logger.error(f"Error fixing paper-method relationships: {e}")
        raise
    finally:
        linker.close()

if __name__ == "__main__":
    main() 