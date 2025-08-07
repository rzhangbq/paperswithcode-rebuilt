#!/usr/bin/env python3
"""
Build evaluation database from evaluation-tables.json
This script creates a proper evaluation database structure with:
- Tasks and subtasks
- Datasets
- Papers with real evaluation metrics
- Code links
"""

import json
import sqlite3
import os
from typing import Dict, List, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
                metric_name TEXT NOT NULL,
                metric_value TEXT NOT NULL,  -- Store as string to handle various formats
                FOREIGN KEY (paper_id) REFERENCES papers (id),
                UNIQUE(paper_id, metric_name)
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
        
        task_count = 0
        dataset_count = 0
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
                
                dataset_count += 1
            
            task_count += 1
            
            if i % 100 == 0:
                self.conn.commit()
                
        self.conn.commit()
        logger.info(f"Evaluation data insertion completed:")
        logger.info(f"  Tasks: {task_count}")
        logger.info(f"  Datasets: {dataset_count}")
        logger.info(f"  Papers: {paper_count}")
        logger.info(f"  Metrics: {metric_count}")
        
    def create_indexes(self):
        """Create indexes for better query performance"""
        logger.info("Creating database indexes...")
        
        # Tasks indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name)')
        
        # Subtasks indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)')
        
        # Datasets indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_datasets_task_id ON datasets(task_id)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets(name)')
        
        # Papers indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_papers_task_id ON papers(task_id)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_papers_dataset_id ON papers(dataset_id)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_papers_model_name ON papers(model_name)')
        
        # Metrics indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_paper_id ON metrics(paper_id)')
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name)')
        
        # Code links indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_code_links_paper_id ON code_links(paper_id)')
        
        # Model links indexes
        self.cursor.execute('CREATE INDEX IF NOT EXISTS idx_model_links_paper_id ON model_links(paper_id)')
        
        self.conn.commit()
        logger.info("Database indexes created successfully")
        
    def get_database_stats(self):
        """Get statistics about the database"""
        logger.info("Getting database statistics...")
        
        tables = ['tasks', 'subtasks', 'datasets', 'papers', 'metrics', 'code_links', 'model_links']
        
        for table in tables:
            self.cursor.execute(f'SELECT COUNT(*) FROM {table}')
            count = self.cursor.fetchone()[0]
            logger.info(f"{table.capitalize()}: {count:,} records")
            
        # Get some sample data
        logger.info("\nSample tasks:")
        self.cursor.execute('SELECT name FROM tasks LIMIT 5')
        tasks = self.cursor.fetchall()
        for task in tasks:
            logger.info(f"  - {task[0]}")
            
        logger.info("\nSample datasets:")
        self.cursor.execute('SELECT name FROM datasets LIMIT 5')
        datasets = self.cursor.fetchall()
        for dataset in datasets:
            logger.info(f"  - {dataset[0]}")
            
        logger.info("\nSample metrics:")
        self.cursor.execute('SELECT DISTINCT metric_name FROM metrics LIMIT 10')
        metrics = self.cursor.fetchall()
        for metric in metrics:
            logger.info(f"  - {metric[0]}")

def main():
    """Main function to build the evaluation database"""
    builder = EvaluationDatabaseBuilder()
    
    try:
        builder.connect()
        builder.create_tables()
        
        # Insert evaluation data
        evaluation_file = "../raw_data/evaluation-tables.json"
        if os.path.exists(evaluation_file):
            builder.insert_evaluation_data(evaluation_file)
        else:
            logger.error(f"Evaluation file not found: {evaluation_file}")
            return
        
        # Create indexes for better performance
        builder.create_indexes()
        
        # Get database statistics
        builder.get_database_stats()
        
        logger.info("Evaluation database build completed successfully!")
        
    except Exception as e:
        logger.error(f"Error building evaluation database: {e}")
        raise
    finally:
        builder.close()

if __name__ == "__main__":
    main() 