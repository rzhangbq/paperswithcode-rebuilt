#!/usr/bin/env python3
"""
Script to build a SQLite database from Papers with Code JSON files.
"""

import json
import sqlite3
import os
from typing import Dict, List, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PapersWithCodeDB:
    def __init__(self, db_path: str = "papers_with_code.db"):
        self.db_path = db_path
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
            
    def create_tables(self):
        """Create all necessary tables"""
        logger.info("Creating database tables...")
        
        # Papers table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_url TEXT UNIQUE,
                arxiv_id TEXT,
                nips_id TEXT,
                openreview_id TEXT,
                title TEXT,
                abstract TEXT,
                short_abstract TEXT,
                url_abs TEXT,
                url_pdf TEXT,
                proceeding TEXT,
                date TEXT,
                conference_url_abs TEXT,
                conference_url_pdf TEXT,
                conference TEXT,
                reproduces_paper TEXT
            )
        ''')
        
        # Authors table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS authors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )
        ''')
        
        # Paper-Authors relationship table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS paper_authors (
                paper_id INTEGER,
                author_id INTEGER,
                author_order INTEGER,
                FOREIGN KEY (paper_id) REFERENCES papers (id),
                FOREIGN KEY (author_id) REFERENCES authors (id),
                PRIMARY KEY (paper_id, author_id)
            )
        ''')
        
        # Tasks table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )
        ''')
        
        # Paper-Tasks relationship table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS paper_tasks (
                paper_id INTEGER,
                task_id INTEGER,
                FOREIGN KEY (paper_id) REFERENCES papers (id),
                FOREIGN KEY (task_id) REFERENCES tasks (id),
                PRIMARY KEY (paper_id, task_id)
            )
        ''')
        
        # Methods table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                name TEXT,
                full_name TEXT,
                description TEXT,
                paper_title TEXT,
                paper_url TEXT
            )
        ''')
        
        # Paper-Methods relationship table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS paper_methods (
                paper_id INTEGER,
                method_id INTEGER,
                FOREIGN KEY (paper_id) REFERENCES papers (id),
                FOREIGN KEY (method_id) REFERENCES methods (id),
                PRIMARY KEY (paper_id, method_id)
            )
        ''')
        
        # Datasets table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                name TEXT,
                full_name TEXT,
                homepage TEXT,
                description TEXT,
                short_description TEXT,
                parent_dataset TEXT,
                image TEXT
            )
        ''')
        
        # Evaluations table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS evaluations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task TEXT,
                description TEXT
            )
        ''')
        
        # Evaluation categories table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS evaluation_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )
        ''')
        
        # Evaluation-Categories relationship table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS evaluation_categories_rel (
                evaluation_id INTEGER,
                category_id INTEGER,
                FOREIGN KEY (evaluation_id) REFERENCES evaluations (id),
                FOREIGN KEY (category_id) REFERENCES evaluation_categories (id),
                PRIMARY KEY (evaluation_id, category_id)
            )
        ''')
        
        # Code links table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS code_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_url TEXT,
                paper_title TEXT,
                paper_arxiv_id TEXT,
                paper_url_abs TEXT,
                paper_url_pdf TEXT,
                repo_url TEXT,
                is_official BOOLEAN,
                mentioned_in_paper BOOLEAN
            )
        ''')
        
        self.conn.commit()
        logger.info("All tables created successfully")
        
    def insert_papers(self, papers_file: str):
        """Insert papers data from JSON file"""
        logger.info(f"Loading papers from {papers_file}...")
        
        with open(papers_file, 'r', encoding='utf-8') as f:
            papers = json.load(f)
            
        logger.info(f"Found {len(papers)} papers to insert")
        
        for i, paper in enumerate(papers):
            if i % 1000 == 0:
                logger.info(f"Processing paper {i+1}/{len(papers)}")
                
            # Insert paper
            self.cursor.execute('''
                INSERT OR IGNORE INTO papers (
                    paper_url, arxiv_id, nips_id, openreview_id, title, abstract,
                    short_abstract, url_abs, url_pdf, proceeding, date,
                    conference_url_abs, conference_url_pdf, conference, reproduces_paper
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                paper.get('paper_url'),
                paper.get('arxiv_id'),
                paper.get('nips_id'),
                paper.get('openreview_id'),
                paper.get('title'),
                paper.get('abstract'),
                paper.get('short_abstract'),
                paper.get('url_abs'),
                paper.get('url_pdf'),
                paper.get('proceeding'),
                paper.get('date'),
                paper.get('conference_url_abs'),
                paper.get('conference_url_pdf'),
                paper.get('conference'),
                paper.get('reproduces_paper')
            ))
            
            paper_id = self.cursor.lastrowid
            
            # Insert authors
            if paper.get('authors'):
                for order, author_name in enumerate(paper['authors']):
                    # Insert author if not exists
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO authors (name) VALUES (?)
                    ''', (author_name,))
                    
                    # Get author id
                    self.cursor.execute('SELECT id FROM authors WHERE name = ?', (author_name,))
                    author_id = self.cursor.fetchone()[0]
                    
                    # Link paper to author
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO paper_authors (paper_id, author_id, author_order)
                        VALUES (?, ?, ?)
                    ''', (paper_id, author_id, order))
            
            # Insert tasks
            if paper.get('tasks'):
                for task_name in paper['tasks']:
                    # Insert task if not exists
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO tasks (name) VALUES (?)
                    ''', (task_name,))
                    
                    # Get task id
                    self.cursor.execute('SELECT id FROM tasks WHERE name = ?', (task_name,))
                    task_id = self.cursor.fetchone()[0]
                    
                    # Link paper to task
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO paper_tasks (paper_id, task_id)
                        VALUES (?, ?)
                    ''', (paper_id, task_id))
            
            # Insert methods
            if paper.get('methods'):
                for method in paper['methods']:
                    # Insert method if not exists
                    # Handle case where paper field might be None
                    paper_data = method.get('paper') or {}
                    
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO methods (url, name, full_name, description, paper_title, paper_url)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        method.get('url'),
                        method.get('name'),
                        method.get('full_name'),
                        method.get('description'),
                        paper_data.get('title'),
                        paper_data.get('url')
                    ))
                    
                    # Get method id
                    self.cursor.execute('SELECT id FROM methods WHERE url = ?', (method.get('url'),))
                    result = self.cursor.fetchone()
                    if result:
                        method_id = result[0]
                        
                        # Link paper to method
                        self.cursor.execute('''
                            INSERT OR IGNORE INTO paper_methods (paper_id, method_id)
                            VALUES (?, ?)
                        ''', (paper_id, method_id))
            
            if i % 1000 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info("Papers insertion completed")
        
    def insert_methods(self, methods_file: str):
        """Insert methods data from JSON file"""
        logger.info(f"Loading methods from {methods_file}...")
        
        with open(methods_file, 'r', encoding='utf-8') as f:
            methods = json.load(f)
            
        logger.info(f"Found {len(methods)} methods to insert")
        
        for i, method in enumerate(methods):
            if i % 1000 == 0:
                logger.info(f"Processing method {i+1}/{len(methods)}")
                
            # Handle case where paper field might be None
            paper_data = method.get('paper') or {}
            
            self.cursor.execute('''
                INSERT OR IGNORE INTO methods (url, name, full_name, description, paper_title, paper_url)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                method.get('url'),
                method.get('name'),
                method.get('full_name'),
                method.get('description'),
                paper_data.get('title'),
                paper_data.get('url')
            ))
            
            if i % 1000 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info("Methods insertion completed")
        
    def insert_datasets(self, datasets_file: str):
        """Insert datasets data from JSON file"""
        logger.info(f"Loading datasets from {datasets_file}...")
        
        with open(datasets_file, 'r', encoding='utf-8') as f:
            datasets = json.load(f)
            
        logger.info(f"Found {len(datasets)} datasets to insert")
        
        for i, dataset in enumerate(datasets):
            if i % 1000 == 0:
                logger.info(f"Processing dataset {i+1}/{len(datasets)}")
                
            self.cursor.execute('''
                INSERT OR IGNORE INTO datasets (
                    url, name, full_name, homepage, description, short_description,
                    parent_dataset, image
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                dataset.get('url'),
                dataset.get('name'),
                dataset.get('full_name'),
                dataset.get('homepage'),
                dataset.get('description'),
                dataset.get('short_description'),
                dataset.get('parent_dataset'),
                dataset.get('image')
            ))
            
            if i % 1000 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info("Datasets insertion completed")
        
    def insert_evaluations(self, evaluations_file: str):
        """Insert evaluations data from JSON file"""
        logger.info(f"Loading evaluations from {evaluations_file}...")
        
        with open(evaluations_file, 'r', encoding='utf-8') as f:
            evaluations = json.load(f)
            
        logger.info(f"Found {len(evaluations)} evaluations to insert")
        
        for i, evaluation in enumerate(evaluations):
            if i % 1000 == 0:
                logger.info(f"Processing evaluation {i+1}/{len(evaluations)}")
                
            # Insert evaluation
            self.cursor.execute('''
                INSERT OR IGNORE INTO evaluations (task, description)
                VALUES (?, ?)
            ''', (
                evaluation.get('task'),
                evaluation.get('description')
            ))
            
            evaluation_id = self.cursor.lastrowid
            
            # Insert categories
            if evaluation.get('categories'):
                for category_name in evaluation['categories']:
                    # Insert category if not exists
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO evaluation_categories (name) VALUES (?)
                    ''', (category_name,))
                    
                    # Get category id
                    self.cursor.execute('SELECT id FROM evaluation_categories WHERE name = ?', (category_name,))
                    category_id = self.cursor.fetchone()[0]
                    
                    # Link evaluation to category
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO evaluation_categories_rel (evaluation_id, category_id)
                        VALUES (?, ?)
                    ''', (evaluation_id, category_id))
            
            if i % 1000 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info("Evaluations insertion completed")
        
    def insert_code_links(self, code_links_file: str):
        """Insert code links data from JSON file"""
        logger.info(f"Loading code links from {code_links_file}...")
        
        with open(code_links_file, 'r', encoding='utf-8') as f:
            code_links = json.load(f)
            
        logger.info(f"Found {len(code_links)} code links to insert")
        
        for i, code_link in enumerate(code_links):
            if i % 1000 == 0:
                logger.info(f"Processing code link {i+1}/{len(code_links)}")
                
            self.cursor.execute('''
                INSERT OR IGNORE INTO code_links (
                    paper_url, paper_title, paper_arxiv_id, paper_url_abs,
                    paper_url_pdf, repo_url, is_official, mentioned_in_paper
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                code_link.get('paper_url'),
                code_link.get('paper_title'),
                code_link.get('paper_arxiv_id'),
                code_link.get('paper_url_abs'),
                code_link.get('paper_url_pdf'),
                code_link.get('repo_url'),
                code_link.get('is_official'),
                code_link.get('mentioned_in_paper')
            ))
            
            if i % 1000 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info("Code links insertion completed")
        
    def create_indexes(self):
        """Create indexes for better query performance"""
        logger.info("Creating database indexes...")
        
        # Papers indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON papers(arxiv_id)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_papers_date ON papers(date)')
        
        # Authors indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name)')
        
        # Tasks indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name)')
        
        # Methods indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_methods_name ON methods(name)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_methods_url ON methods(url)')
        
        # Datasets indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets(name)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_datasets_url ON datasets(url)')
        
        # Code links indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_code_links_paper_url ON code_links(paper_url)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_code_links_repo_url ON code_links(repo_url)')
        
        self.conn.commit()
        logger.info("Database indexes created successfully")
        
    def get_database_stats(self):
        """Get statistics about the database"""
        logger.info("Getting database statistics...")
        
        tables = ['papers', 'authors', 'tasks', 'methods', 'datasets', 'evaluations', 'code_links']
        
        for table in tables:
            self.cursor.execute(f'SELECT COUNT(*) FROM {table}')
            count = self.cursor.fetchone()[0]
            logger.info(f"{table.capitalize()}: {count:,} records")
            
        # Get some relationship counts
        self.cursor.execute('SELECT COUNT(*) FROM paper_authors')
        paper_authors_count = self.cursor.fetchone()[0]
        logger.info(f"Paper-Author relationships: {paper_authors_count:,}")
        
        self.cursor.execute('SELECT COUNT(*) FROM paper_tasks')
        paper_tasks_count = self.cursor.fetchone()[0]
        logger.info(f"Paper-Task relationships: {paper_tasks_count:,}")
        
        self.cursor.execute('SELECT COUNT(*) FROM paper_methods')
        paper_methods_count = self.cursor.fetchone()[0]
        logger.info(f"Paper-Method relationships: {paper_methods_count:,}")

def main():
    """Main function to build the database"""
    db = PapersWithCodeDB()
    
    try:
        db.connect()
        db.create_tables()
        
        # Insert data from JSON files
        if os.path.exists('papers.json'):
            db.insert_papers('papers.json')
        
        if os.path.exists('methods.json'):
            db.insert_methods('methods.json')
            
        if os.path.exists('datasets.json'):
            db.insert_datasets('datasets.json')
            
        if os.path.exists('evaluations.json'):
            db.insert_evaluations('evaluations.json')
            
        if os.path.exists('code-links.json'):
            db.insert_code_links('code-links.json')
        
        # Create indexes for better performance
        db.create_indexes()
        
        # Get database statistics
        db.get_database_stats()
        
        logger.info("Database build completed successfully!")
        
    except Exception as e:
        logger.error(f"Error building database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main() 