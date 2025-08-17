#!/usr/bin/env python3
"""
Script to rebuild paper_methods relationships for legitimate methods.
This script restores the connections between papers and methods by
extracting method information from the papers data.
"""

import json
import sqlite3
import logging
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Set up logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('rebuild_relationships.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MethodRelationshipRebuilder:
    def __init__(self, db_path: str = "papers_with_code.db", papers_file: str = "../raw_data/papers-with-abstracts.json"):
        self.db_path = db_path
        self.papers_file = papers_file
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Connect to SQLite database"""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        logger.info(f"Connected to database: {self.db_path}")
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
            
    def get_legitimate_methods(self) -> Dict[str, int]:
        """Get the mapping of legitimate method names to their IDs"""
        logger.info("Getting legitimate method names from database...")
        
        self.cursor.execute("SELECT id, name, full_name FROM methods WHERE name IS NOT NULL")
        method_mapping = {}
        
        for method_id, name, full_name in self.cursor.fetchall():
            # Use both name and full_name for matching
            if name:
                method_mapping[name.lower().strip()] = method_id
            if full_name:
                method_mapping[full_name.lower().strip()] = method_id
        
        logger.info(f"Found {len(method_mapping)} legitimate method name mappings")
        return method_mapping
    
    def load_papers_data(self) -> List[Dict]:
        """Load the papers data from JSON file"""
        logger.info(f"Loading papers data from {self.papers_file}...")
        
        if not Path(self.papers_file).exists():
            raise FileNotFoundError(f"Papers file not found: {self.papers_file}")
        
        with open(self.papers_file, 'r', encoding='utf-8') as f:
            papers_data = json.load(f)
            
        logger.info(f"Loaded {len(papers_data)} papers from file")
        return papers_data
    
    def extract_paper_method_relationships(self, method_mapping: Dict[str, int]) -> List[Tuple[int, int]]:
        """Extract paper-method relationships from papers data"""
        logger.info("Extracting paper-method relationships from papers data...")
        
        papers_data = self.load_papers_data()
        relationships = set()  # Use set to automatically deduplicate
        papers_processed = 0
        relationships_found = 0
        
        for paper in papers_data:
            papers_processed += 1
            
            if papers_processed % 10000 == 0:
                logger.info(f"Processed {papers_processed} papers, found {len(relationships)} unique relationships...")
            
            paper_url = paper.get('paper_url')
            if not paper_url:
                continue
                
            # Get paper ID from database
            self.cursor.execute("SELECT id FROM papers WHERE paper_url = ?", (paper_url,))
            paper_result = self.cursor.fetchone()
            
            if not paper_result:
                continue
                
            paper_id = paper_result[0]
            methods = paper.get('methods', [])
            
            for method_info in methods:
                method_name = method_info.get('name')
                method_full_name = method_info.get('full_name')
                
                # Clean and validate method names
                method_name = method_name.strip() if method_name else ''
                method_full_name = method_full_name.strip() if method_full_name else ''
                
                # Try to match by name or full_name
                method_id = None
                if method_name:
                    method_id = method_mapping.get(method_name.lower())
                if not method_id and method_full_name:
                    method_id = method_mapping.get(method_full_name.lower())
                
                if method_id:
                    relationships.add((paper_id, method_id))
                    relationships_found += 1
        
        logger.info(f"Processed {papers_processed} papers, found {relationships_found} total relationships, {len(relationships)} unique relationships")
        return list(relationships)
    
    def rebuild_paper_methods_table(self, relationships: List[Tuple[int, int]]):
        """Rebuild the paper_methods table with the extracted relationships"""
        if not relationships:
            logger.warning("No relationships to insert")
            return
            
        logger.info(f"Rebuilding paper_methods table with {len(relationships)} relationships...")
        
        # Clear existing table
        self.cursor.execute("DELETE FROM paper_methods")
        logger.info("Cleared existing paper_methods table")
        
        # Insert new relationships
        self.cursor.executemany(
            "INSERT INTO paper_methods (paper_id, method_id) VALUES (?, ?)",
            relationships
        )
        
        # Commit changes
        self.conn.commit()
        logger.info(f"Successfully inserted {len(relationships)} relationships")
    
    def verify_relationships(self):
        """Verify that relationships were properly restored"""
        logger.info("Verifying restored relationships...")
        
        # Check total relationships
        self.cursor.execute("SELECT COUNT(*) FROM paper_methods")
        total_relationships = self.cursor.fetchone()[0]
        logger.info(f"Total paper-method relationships: {total_relationships}")
        
        # Check methods with relationships
        self.cursor.execute("""
            SELECT COUNT(DISTINCT method_id) FROM paper_methods
        """)
        methods_with_papers = self.cursor.fetchone()[0]
        logger.info(f"Methods with paper relationships: {methods_with_papers}")
        
        # Check papers with relationships
        self.cursor.execute("""
            SELECT COUNT(DISTINCT paper_id) FROM paper_methods
        """)
        papers_with_methods = self.cursor.fetchone()[0]
        logger.info(f"Papers with method relationships: {papers_with_methods}")
        
        # Sample some relationships
        self.cursor.execute("""
            SELECT pm.paper_id, pm.method_id, p.title, m.name
            FROM paper_methods pm
            JOIN papers p ON pm.paper_id = p.id
            JOIN methods m ON pm.method_id = m.id
            LIMIT 5
        """)
        
        sample_relationships = self.cursor.fetchall()
        logger.info("Sample relationships:")
        for paper_id, method_id, paper_title, method_name in sample_relationships:
            logger.info(f"  Paper {paper_id}: {paper_title[:50]}... -> Method {method_id}: {method_name[:50]}...")
    
    def rebuild_relationships(self):
        """Main method to rebuild all method relationships"""
        try:
            self.connect()
            
            # Get legitimate methods mapping
            method_mapping = self.get_legitimate_methods()
            
            # Extract relationships from papers data
            relationships = self.extract_paper_method_relationships(method_mapping)
            
            # Rebuild the table
            self.rebuild_paper_methods_table(relationships)
            
            # Verify the results
            self.verify_relationships()
            
            logger.info("Relationship rebuilding completed successfully!")
            
        except Exception as e:
            logger.error(f"Error during relationship rebuilding: {e}")
            raise
        finally:
            self.close()

def main():
    """Main execution function"""
    logger.info("Starting method relationship rebuilding process...")
    
    # Check if database exists
    db_path = "papers_with_code.db"
    if not Path(db_path).exists():
        logger.error(f"Database not found: {db_path}")
        return
    
    # Check if papers file exists
    papers_file = "../raw_data/papers-with-abstracts.json"
    if not Path(papers_file).exists():
        logger.error(f"Papers file not found: {papers_file}")
        return
    
    # Create rebuilder instance and run
    rebuilder = MethodRelationshipRebuilder(db_path, papers_file)
    rebuilder.rebuild_relationships()
    
    logger.info("=== RELATIONSHIP REBUILDING COMPLETE ===")

if __name__ == "__main__":
    main() 