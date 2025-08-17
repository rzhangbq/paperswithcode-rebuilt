#!/usr/bin/env python3
"""
Consolidated script to build Papers with Code databases.
This script builds both required databases:
1. papers_with_code.db - Main database with papers, methods, datasets, etc.
2. evaluation_database.db - Evaluation database with detailed metrics

Usage:
    python build_databases.py
"""

import json
import sqlite3
import os
from typing import Dict, List, Any
import logging
import time

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('database_build.log'),
        logging.StreamHandler()
    ]
)
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
        
        # Enhanced Methods structure
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS method_areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                area_name TEXT UNIQUE
            )
        ''')
        
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS method_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                area_id INTEGER,
                category_name TEXT,
                FOREIGN KEY (area_id) REFERENCES method_areas (id),
                UNIQUE(area_id, category_name)
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
                introduced_year INTEGER,
                num_papers INTEGER,
                paper_title TEXT,
                paper_arxiv_id TEXT,
                paper_url_abs TEXT,
                paper_url_pdf TEXT,
                paper_url TEXT
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
                    self.cursor.execute('INSERT OR IGNORE INTO authors (name) VALUES (?)', (author_name,))
                    self.cursor.execute('SELECT id FROM authors WHERE name = ?', (author_name,))
                    author_id = self.cursor.fetchone()[0]
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO paper_authors (paper_id, author_id, author_order)
                        VALUES (?, ?, ?)
                    ''', (paper_id, author_id, order))
            
            # Insert tasks
            if paper.get('tasks'):
                for task_name in paper['tasks']:
                    self.cursor.execute('INSERT OR IGNORE INTO tasks (name) VALUES (?)', (task_name,))
                    self.cursor.execute('SELECT id FROM tasks WHERE name = ?', (task_name,))
                    task_id = self.cursor.fetchone()[0]
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO paper_tasks (paper_id, task_id)
                        VALUES (?, ?)
                    ''', (paper_id, task_id))
            
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
        
        # First pass: create areas and categories
        areas_map = {}
        categories_map = {}
        
        for method in methods:
            if method.get('categories'):
                for area_name, categories in method['categories'].items():
                    # Insert area
                    self.cursor.execute('INSERT OR IGNORE INTO method_areas (area_name) VALUES (?)', (area_name,))
                    self.cursor.execute('SELECT id FROM method_areas WHERE area_name = ?', (area_name,))
                    area_id = self.cursor.fetchone()[0]
                    areas_map[area_name] = area_id
                    
                    # Insert categories
                    for category_name in categories:
                        self.cursor.execute('''
                            INSERT OR IGNORE INTO method_categories (area_id, category_name) 
                            VALUES (?, ?)
                        ''', (area_id, category_name))
                        self.cursor.execute('''
                            SELECT id FROM method_categories 
                            WHERE area_id = ? AND category_name = ?
                        ''', (area_id, category_name))
                        category_id = self.cursor.fetchone()[0]
                        categories_map[(area_name, category_name)] = category_id
        
        self.conn.commit()
        
        # Second pass: insert methods
        for i, method in enumerate(methods):
            if i % 1000 == 0:
                logger.info(f"Processing method {i+1}/{len(methods)}")
                
            # Extract paper data
            paper_data = method.get('paper') or {}
            
            # Insert method
            self.cursor.execute('''
                INSERT OR IGNORE INTO methods (
                    url, name, full_name, description, introduced_year, num_papers,
                    paper_title, paper_arxiv_id, paper_url_abs, paper_url_pdf, paper_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                method.get('url'),
                method.get('name'),
                method.get('full_name'),
                method.get('description'),
                method.get('introduced_year'),
                method.get('num_papers', 0),
                paper_data.get('title'),
                paper_data.get('arxiv_id'),
                paper_data.get('url_abs'),
                paper_data.get('url_pdf'),
                paper_data.get('url')
            ))
            
            # Get method ID
            self.cursor.execute('SELECT id FROM methods WHERE url = ?', (method.get('url'),))
            result = self.cursor.fetchone()
            if result:
                method_id = result[0]
                
                # Link method to categories
                if method.get('categories'):
                    for area_name, categories in method['categories'].items():
                        for category_name in categories:
                            category_id = categories_map.get((area_name, category_name))
                            if category_id:
                                self.cursor.execute('''
                                    INSERT OR IGNORE INTO method_categories_rel (method_id, category_id)
                                    VALUES (?, ?)
                                ''', (method_id, category_id))
            
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
                    url, name, full_name, homepage, description, 
                    short_description, parent_dataset, image
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
                
            self.cursor.execute('''
                INSERT OR IGNORE INTO evaluations (task, description)
                VALUES (?, ?)
            ''', (
                evaluation.get('task'),
                evaluation.get('description')
            ))
            
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
        
        for i, link in enumerate(code_links):
            if i % 1000 == 0:
                logger.info(f"Processing code link {i+1}/{len(code_links)}")
                
            self.cursor.execute('''
                INSERT OR IGNORE INTO code_links (
                    paper_url, paper_title, paper_arxiv_id, paper_url_abs,
                    paper_url_pdf, repo_url, is_official, mentioned_in_paper
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                link.get('paper_url'),
                link.get('paper_title'),
                link.get('paper_arxiv_id'),
                link.get('paper_url_abs'),
                link.get('paper_url_pdf'),
                link.get('repo_url'),
                link.get('is_official'),
                link.get('mentioned_in_paper')
            ))
            
            if i % 1000 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info("Code links insertion completed")

    def create_indexes(self):
        """Create indexes for better query performance"""
        logger.info("Creating database indexes...")
        
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title)',
            'CREATE INDEX IF NOT EXISTS idx_papers_date ON papers(date)',
            'CREATE INDEX IF NOT EXISTS idx_papers_arxiv ON papers(arxiv_id)',
            'CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name)',
            'CREATE INDEX IF NOT EXISTS idx_methods_name ON methods(name)',
            'CREATE INDEX IF NOT EXISTS idx_methods_year ON methods(introduced_year)',
            'CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets(name)',
            'CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name)',
        ]
        
        for index_sql in indexes:
            self.cursor.execute(index_sql)
            
        self.conn.commit()
        logger.info("Indexes created successfully")

    def get_database_stats(self):
        """Print database statistics"""
        logger.info("Getting database statistics...")
        
        tables = ['papers', 'authors', 'methods', 'datasets', 'tasks', 'evaluations', 'code_links']
        
        for table in tables:
            self.cursor.execute(f'SELECT COUNT(*) FROM {table}')
            count = self.cursor.fetchone()[0]
            logger.info(f"{table.capitalize()}: {count:,} records")


class EvaluationDatabaseBuilder:
    def __init__(self, db_path: str = "evaluation_database.db"):
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
        """Create all necessary tables for evaluation data"""
        logger.info("Creating evaluation database tables...")
        
        # Tasks table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                categories TEXT,  -- JSON array of categories
                source_link TEXT
            )
        ''')
        
        # Subtasks table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS subtasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks (id),
                UNIQUE(task_id, name)
            )
        ''')
        
        # Datasets table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                dataset_links TEXT,  -- JSON array of links
                subdatasets TEXT,    -- JSON array of subdatasets
                dataset_citations TEXT,  -- JSON array of citations
                FOREIGN KEY (task_id) REFERENCES tasks (id),
                UNIQUE(task_id, name)
            )
        ''')
        
        # Papers table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                dataset_id INTEGER,
                paper_url TEXT,
                paper_title TEXT,
                paper_date TEXT,
                model_name TEXT,
                uses_additional_data BOOLEAN,
                FOREIGN KEY (task_id) REFERENCES tasks (id),
                FOREIGN KEY (dataset_id) REFERENCES datasets (id)
            )
        ''')
        
        # Metrics table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_id INTEGER,
                metric_name TEXT,
                metric_value TEXT,
                FOREIGN KEY (paper_id) REFERENCES papers (id)
            )
        ''')
        
        # Code links table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS code_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_id INTEGER,
                url TEXT,
                title TEXT,
                FOREIGN KEY (paper_id) REFERENCES papers (id)
            )
        ''')
        
        # Model links table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_id INTEGER,
                url TEXT,
                title TEXT,
                FOREIGN KEY (paper_id) REFERENCES papers (id)
            )
        ''')
        
        self.conn.commit()
        logger.info("All evaluation tables created successfully")

    def insert_evaluation_data(self, evaluation_file: str):
        """Insert evaluation data from JSON file"""
        logger.info(f"Loading evaluation data from {evaluation_file}...")
        
        with open(evaluation_file, 'r', encoding='utf-8') as f:
            evaluations = json.load(f)
            
        logger.info(f"Found {len(evaluations)} evaluation entries to process")
        
        paper_count = 0
        metric_count = 0
        
        for i, evaluation in enumerate(evaluations):
            if i % 100 == 0:
                logger.info(f"Processing evaluation {i+1}/{len(evaluations)}")
                
            # Insert task
            task_name = evaluation.get('task', '')
            if not task_name:
                continue
                
            self.cursor.execute('''
                INSERT OR IGNORE INTO tasks (name, description, categories, source_link)
                VALUES (?, ?, ?, ?)
            ''', (
                task_name,
                evaluation.get('description', ''),
                json.dumps(evaluation.get('categories', [])),
                evaluation.get('source_link')
            ))
            
            # Get task ID
            self.cursor.execute('SELECT id FROM tasks WHERE name = ?', (task_name,))
            task_id = self.cursor.fetchone()[0]
            
            # Insert subtasks
            for subtask in evaluation.get('subtasks', []):
                self.cursor.execute('''
                    INSERT OR IGNORE INTO subtasks (task_id, name, description)
                    VALUES (?, ?, ?)
                ''', (task_id, subtask.get('name', ''), subtask.get('description', '')))
            
            # Insert datasets
            for dataset_data in evaluation.get('datasets', []):
                dataset_name = dataset_data.get('dataset', '')
                if not dataset_name:
                    continue
                    
                self.cursor.execute('''
                    INSERT OR IGNORE INTO datasets (task_id, name, description, dataset_links, subdatasets, dataset_citations)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    task_id,
                    dataset_name,
                    dataset_data.get('description', ''),
                    json.dumps(dataset_data.get('dataset_links', [])),
                    json.dumps(dataset_data.get('subdatasets', [])),
                    json.dumps(dataset_data.get('dataset_citations', []))
                ))
                
                # Get dataset ID
                self.cursor.execute('SELECT id FROM datasets WHERE task_id = ? AND name = ?', (task_id, dataset_name))
                dataset_id = self.cursor.fetchone()[0]
                
                # Insert papers and their evaluations
                sota_data = dataset_data.get('sota', {})
                for row in sota_data.get('rows', []):
                    # Insert paper
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO papers (
                            task_id, dataset_id, paper_url, paper_title, paper_date,
                            model_name, uses_additional_data
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        task_id,
                        dataset_id,
                        row.get('paper_url', ''),
                        row.get('paper_title', ''),
                        row.get('paper_date', ''),
                        row.get('model_name', ''),
                        row.get('uses_additional_data', False)
                    ))
                    
                    # Get paper ID
                    self.cursor.execute('''
                        SELECT id FROM papers 
                        WHERE task_id = ? AND dataset_id = ? AND model_name = ?
                    ''', (task_id, dataset_id, row.get('model_name', '')))
                    result = self.cursor.fetchone()
                    if result:
                        paper_id = result[0]
                        
                        # Insert metrics
                        for metric_name, metric_value in row.get('metrics', {}).items():
                            self.cursor.execute('''
                                INSERT OR IGNORE INTO metrics (paper_id, metric_name, metric_value)
                                VALUES (?, ?, ?)
                            ''', (paper_id, metric_name, str(metric_value)))
                            metric_count += 1
                        
                        # Insert code links
                        for code_link in row.get('code_links', []):
                            self.cursor.execute('''
                                INSERT OR IGNORE INTO code_links (paper_id, url, title)
                                VALUES (?, ?, ?)
                            ''', (paper_id, code_link.get('url', ''), code_link.get('title', '')))
                        
                        # Insert model links
                        for model_link in row.get('model_links', []):
                            self.cursor.execute('''
                                INSERT OR IGNORE INTO model_links (paper_id, url, title)
                                VALUES (?, ?, ?)
                            ''', (paper_id, model_link.get('url', ''), model_link.get('title', '')))
                        
                        paper_count += 1
            
            if i % 100 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info(f"Evaluation data insertion completed: {paper_count} papers, {metric_count} metrics")

    def create_indexes(self):
        """Create indexes for better query performance"""
        logger.info("Creating evaluation database indexes...")
        
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_eval_tasks_name ON tasks(name)',
            'CREATE INDEX IF NOT EXISTS idx_eval_datasets_name ON datasets(name)',
            'CREATE INDEX IF NOT EXISTS idx_eval_papers_title ON papers(paper_title)',
            'CREATE INDEX IF NOT EXISTS idx_eval_papers_date ON papers(paper_date)',
            'CREATE INDEX IF NOT EXISTS idx_eval_metrics_name ON metrics(metric_name)',
        ]
        
        for index_sql in indexes:
            self.cursor.execute(index_sql)
            
        self.conn.commit()
        logger.info("Evaluation indexes created successfully")

    def get_database_stats(self):
        """Print database statistics"""
        logger.info("Getting evaluation database statistics...")
        
        tables = ['tasks', 'subtasks', 'datasets', 'papers', 'metrics', 'code_links', 'model_links']
        
        for table in tables:
            self.cursor.execute(f'SELECT COUNT(*) FROM {table}')
            count = self.cursor.fetchone()[0]
            logger.info(f"{table.capitalize()}: {count:,} records")


def check_required_files():
    """Check if all required JSON files exist"""
    required_files = [
        '../raw_data/papers-with-abstracts.json',
        '../raw_data/methods.json',
        '../raw_data/datasets.json',
        '../raw_data/evaluation-tables.json',
        '../raw_data/links-between-papers-and-code.json'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
            
    if missing_files:
        logger.error("❌ Missing required files:")
        for file_path in missing_files:
            logger.error(f"   {file_path}")
        logger.error("Please download the required JSON files to the raw_data/ directory.")
        return False
        
    logger.info("✅ All required files found")
    return True


def main():
    """Main function to build both databases"""
    start_time = time.time()
    
    logger.info("🔧 Papers with Code Database Builder")
    logger.info("="*60)
    
    # Check prerequisites
    if not check_required_files():
        return False
    
    success_count = 0
    
    # Build papers_with_code.db
    try:
        logger.info("\n🚀 Building papers_with_code.db...")
        db = PapersWithCodeDB()
        db.connect()
        db.create_tables()
        
        # Insert data from JSON files
        if os.path.exists('../raw_data/papers-with-abstracts.json'):
            db.insert_papers('../raw_data/papers-with-abstracts.json')
        
        if os.path.exists('../raw_data/methods.json'):
            db.insert_methods('../raw_data/methods.json')
            
        if os.path.exists('../raw_data/datasets.json'):
            db.insert_datasets('../raw_data/datasets.json')
            
        if os.path.exists('../raw_data/evaluation-tables.json'):
            db.insert_evaluations('../raw_data/evaluation-tables.json')
            
        if os.path.exists('../raw_data/links-between-papers-and-code.json'):
            db.insert_code_links('../raw_data/links-between-papers-and-code.json')
        
        # Create indexes and get statistics
        db.create_indexes()
        db.get_database_stats()
        
        db.close()
        logger.info("✅ papers_with_code.db build completed successfully!")
        success_count += 1
        
    except Exception as e:
        logger.error(f"❌ Error building papers_with_code.db: {e}")
    
    # Build evaluation_database.db
    try:
        logger.info("\n🚀 Building evaluation_database.db...")
        eval_db = EvaluationDatabaseBuilder()
        eval_db.connect()
        eval_db.create_tables()
        
        # Insert evaluation data
        if os.path.exists('../raw_data/evaluation-tables.json'):
            eval_db.insert_evaluation_data('../raw_data/evaluation-tables.json')
        
        # Create indexes and get statistics
        eval_db.create_indexes()
        eval_db.get_database_stats()
        
        eval_db.close()
        logger.info("✅ evaluation_database.db build completed successfully!")
        success_count += 1
        
    except Exception as e:
        logger.error(f"❌ Error building evaluation_database.db: {e}")
    
    # Print summary
    total_time = time.time() - start_time
    logger.info("\n" + "="*60)
    logger.info("📊 BUILD SUMMARY")
    logger.info("="*60)
    logger.info(f"Databases built successfully: {success_count}/2")
    logger.info(f"Total build time: {total_time/60:.1f} minutes")
    
    # Check database file sizes
    db_files = {
        'papers_with_code.db': 'papers_with_code.db',
        'evaluation_database.db': 'evaluation_database.db'
    }
    
    logger.info("\n📁 Database file sizes:")
    for db_name, filename in db_files.items():
        if os.path.exists(filename):
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            if size_mb > 1024:
                size_gb = size_mb / 1024
                logger.info(f"{db_name:<25} {size_gb:.1f} GB")
            else:
                logger.info(f"{db_name:<25} {size_mb:.1f} MB")
        else:
            logger.info(f"{db_name:<25} Not created")
    
    logger.info("="*60)
    
    if success_count == 2:
        logger.info("🎉 All databases built successfully!")
        logger.info("✅ Generated: papers_with_code.db")
        logger.info("✅ Generated: evaluation_database.db")
        return True
    else:
        logger.error("⚠️  Some database builds failed. Check the logs for details.")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 