#!/usr/bin/env python3
"""
Example queries for the enhanced Papers with Code database with methods areas and categories.
This demonstrates how to query the hierarchical methods organization.
"""

import sqlite3
import json
from typing import Dict, List, Any

class MethodsQueryExamples:
    def __init__(self, db_path: str = "papers_with_code.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Connect to SQLite database"""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        print(f"Connected to database: {self.db_path}")
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("Database connection closed")
    
    def get_methods_hierarchy(self):
        """Get the complete methods hierarchy similar to Papers with Code website"""
        print("\n=== METHODS HIERARCHY ===")
        
        query = '''
            SELECT 
                ma.area_name,
                mc.name as category_name,
                COUNT(DISTINCT m.id) as method_count,
                COUNT(DISTINCT pm.paper_id) as paper_count
            FROM method_areas ma
            LEFT JOIN method_categories mc ON ma.id = mc.area_id
            LEFT JOIN method_categories_rel mcr ON mc.id = mcr.category_id
            LEFT JOIN methods m ON mcr.method_id = m.id
            LEFT JOIN paper_methods pm ON m.id = pm.method_id
            GROUP BY ma.id, ma.area_name, mc.id, mc.name
            ORDER BY ma.area_name, paper_count DESC, method_count DESC, mc.name
        '''
        
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        hierarchy = {}
        for row in results:
            area_name, category_name, method_count, paper_count = row
            
            if area_name not in hierarchy:
                hierarchy[area_name] = []
            
            if category_name:
                hierarchy[area_name].append({
                    'category': category_name,
                    'method_count': method_count,
                    'paper_count': paper_count
                })
        
        # Display hierarchy
        for area_name, categories in hierarchy.items():
            total_methods = sum(cat['method_count'] for cat in categories)
            total_papers = sum(cat['paper_count'] for cat in categories)
            print(f"\n{area_name}")
            print(f"  {len(categories)} categories, {total_methods} methods, {total_papers} papers")
            
            # Show top categories
            for category in categories[:5]:
                print(f"    {category['category']}: {category['method_count']} methods, {category['paper_count']} papers")
        
        return hierarchy
    
    def get_methods_by_area(self, area_name: str):
        """Get all methods in a specific area"""
        print(f"\n=== METHODS IN {area_name.upper()} ===")
        
        query = '''
            SELECT 
                m.name,
                m.full_name,
                m.description,
                m.num_papers,
                m.introduced_year,
                GROUP_CONCAT(DISTINCT mc.name) as categories
            FROM methods m
            JOIN method_categories_rel mcr ON m.id = mcr.method_id
            JOIN method_categories mc ON mcr.category_id = mc.id
            JOIN method_areas ma ON mc.area_id = ma.id
            WHERE ma.area_name = ?
            GROUP BY m.id, m.name, m.full_name, m.description, m.num_papers, m.introduced_year
            ORDER BY m.num_papers DESC, m.name
            LIMIT 20
        '''
        
        self.cursor.execute(query, (area_name,))
        results = self.cursor.fetchall()
        
        for row in results:
            name, full_name, description, num_papers, introduced_year, categories = row
            print(f"\n{name} ({full_name})")
            print(f"  Papers: {num_papers}, Year: {introduced_year}")
            print(f"  Categories: {categories}")
            if description:
                desc_preview = description[:100].replace('\n', ' ')
                print(f"  Description: {desc_preview}...")
        
        return results
    
    def get_methods_by_category(self, category_name: str):
        """Get all methods in a specific category"""
        print(f"\n=== METHODS IN CATEGORY: {category_name.upper()} ===")
        
        query = '''
            SELECT 
                m.name,
                m.full_name,
                m.description,
                m.num_papers,
                m.introduced_year,
                ma.area_name
            FROM methods m
            JOIN method_categories_rel mcr ON m.id = mcr.method_id
            JOIN method_categories mc ON mcr.category_id = mc.id
            JOIN method_areas ma ON mc.area_id = ma.id
            WHERE mc.name = ?
            ORDER BY m.num_papers DESC, m.name
            LIMIT 20
        '''
        
        self.cursor.execute(query, (category_name,))
        results = self.cursor.fetchall()
        
        for row in results:
            name, full_name, description, num_papers, introduced_year, area_name = row
            print(f"\n{name} ({full_name})")
            print(f"  Area: {area_name}")
            print(f"  Papers: {num_papers}, Year: {introduced_year}")
            if description:
                desc_preview = description[:100].replace('\n', ' ')
                print(f"  Description: {desc_preview}...")
        
        return results
    
    def get_top_methods_by_papers(self, limit: int = 20):
        """Get top methods by number of papers"""
        print(f"\n=== TOP {limit} METHODS BY PAPERS ===")
        
        query = '''
            SELECT 
                m.name,
                m.full_name,
                m.num_papers,
                m.introduced_year,
                GROUP_CONCAT(DISTINCT ma.area_name) as areas,
                GROUP_CONCAT(DISTINCT mc.name) as categories
            FROM methods m
            LEFT JOIN method_categories_rel mcr ON m.id = mcr.method_id
            LEFT JOIN method_categories mc ON mcr.category_id = mc.id
            LEFT JOIN method_areas ma ON mc.area_id = ma.id
            WHERE m.num_papers > 0
            GROUP BY m.id, m.name, m.full_name, m.num_papers, m.introduced_year
            ORDER BY m.num_papers DESC
            LIMIT ?
        '''
        
        self.cursor.execute(query, (limit,))
        results = self.cursor.fetchall()
        
        for i, row in enumerate(results, 1):
            name, full_name, num_papers, introduced_year, areas, categories = row
            print(f"\n{i}. {name} ({full_name})")
            print(f"   Papers: {num_papers}, Year: {introduced_year}")
            if areas:
                print(f"   Areas: {areas}")
            if categories:
                print(f"   Categories: {categories}")
        
        return results
    
    def get_methods_by_year_range(self, start_year: int, end_year: int):
        """Get methods introduced in a specific year range"""
        print(f"\n=== METHODS INTRODUCED {start_year}-{end_year} ===")
        
        query = '''
            SELECT 
                m.name,
                m.full_name,
                m.num_papers,
                m.introduced_year,
                GROUP_CONCAT(DISTINCT ma.area_name) as areas
            FROM methods m
            LEFT JOIN method_categories_rel mcr ON m.id = mcr.method_id
            LEFT JOIN method_categories mc ON mcr.category_id = mcr.category_id
            LEFT JOIN method_areas ma ON mc.area_id = ma.id
            WHERE m.introduced_year BETWEEN ? AND ?
            GROUP BY m.id, m.name, m.full_name, m.num_papers, m.introduced_year
            ORDER BY m.introduced_year DESC, m.num_papers DESC
            LIMIT 20
        '''
        
        self.cursor.execute(query, (start_year, end_year))
        results = self.cursor.fetchall()
        
        for row in results:
            name, full_name, num_papers, introduced_year, areas = row
            print(f"\n{name} ({full_name})")
            print(f"  Year: {introduced_year}, Papers: {num_papers}")
            if areas:
                print(f"  Areas: {areas}")
        
        return results
    
    def search_methods(self, search_term: str):
        """Search methods by name or description"""
        print(f"\n=== SEARCHING METHODS FOR: '{search_term}' ===")
        
        query = '''
            SELECT 
                m.name,
                m.full_name,
                m.description,
                m.num_papers,
                m.introduced_year,
                GROUP_CONCAT(DISTINCT ma.area_name) as areas,
                GROUP_CONCAT(DISTINCT mc.name) as categories
            FROM methods m
            LEFT JOIN method_categories_rel mcr ON m.id = mcr.method_id
            LEFT JOIN method_categories mc ON mcr.category_id = mc.id
            LEFT JOIN method_areas ma ON mc.area_id = ma.id
            WHERE m.name LIKE ? OR m.full_name LIKE ? OR m.description LIKE ?
            GROUP BY m.id, m.name, m.full_name, m.description, m.num_papers, m.introduced_year
            ORDER BY m.num_papers DESC
            LIMIT 15
        '''
        
        search_pattern = f'%{search_term}%'
        self.cursor.execute(query, (search_pattern, search_pattern, search_pattern))
        results = self.cursor.fetchall()
        
        for row in results:
            name, full_name, description, num_papers, introduced_year, areas, categories = row
            print(f"\n{name} ({full_name})")
            print(f"  Papers: {num_papers}, Year: {introduced_year}")
            if areas:
                print(f"  Areas: {areas}")
            if categories:
                print(f"  Categories: {categories}")
            if description:
                desc_preview = description[:150].replace('\n', ' ')
                print(f"  Description: {desc_preview}...")
        
        return results
    
    def get_method_details(self, method_name: str):
        """Get detailed information about a specific method"""
        print(f"\n=== METHOD DETAILS: {method_name.upper()} ===")
        
        query = '''
            SELECT 
                m.name,
                m.full_name,
                m.description,
                m.paper_title,
                m.paper_url,
                m.num_papers,
                m.introduced_year,
                m.source_url,
                m.source_title,
                m.code_snippet_url,
                GROUP_CONCAT(DISTINCT ma.area_name) as areas,
                GROUP_CONCAT(DISTINCT mc.name) as categories
            FROM methods m
            LEFT JOIN method_categories_rel mcr ON m.id = mcr.method_id
            LEFT JOIN method_categories mc ON mcr.category_id = mc.id
            LEFT JOIN method_areas ma ON mc.area_id = ma.id
            WHERE m.name = ? OR m.full_name = ?
            GROUP BY m.id, m.name, m.full_name, m.description, m.paper_title, m.paper_url, 
                     m.num_papers, m.introduced_year, m.source_url, m.source_title, m.code_snippet_url
        '''
        
        self.cursor.execute(query, (method_name, method_name))
        result = self.cursor.fetchone()
        
        if result:
            (name, full_name, description, paper_title, paper_url, num_papers, 
             introduced_year, source_url, source_title, code_snippet_url, areas, categories) = result
            
            print(f"Name: {name}")
            print(f"Full Name: {full_name}")
            print(f"Papers: {num_papers}")
            print(f"Introduced: {introduced_year}")
            
            if paper_title:
                print(f"Paper: {paper_title}")
            if paper_url:
                print(f"Paper URL: {paper_url}")
            if source_title:
                print(f"Source: {source_title}")
            if source_url:
                print(f"Source URL: {source_url}")
            if code_snippet_url:
                print(f"Code: {code_snippet_url}")
            
            if areas:
                print(f"Areas: {areas}")
            if categories:
                print(f"Categories: {categories}")
            
            if description:
                print(f"\nDescription:")
                print(description)
        else:
            print(f"Method '{method_name}' not found")
        
        return result

def main():
    """Run example queries"""
    examples = MethodsQueryExamples()
    
    try:
        examples.connect()
        
        # Get the complete methods hierarchy
        examples.get_methods_hierarchy()
        
        # Get methods in Computer Vision area
        examples.get_methods_by_area("Computer Vision")
        
        # Get methods in Transformers category
        examples.get_methods_by_category("Transformers")
        
        # Get top methods by papers
        examples.get_top_methods_by_papers(10)
        
        # Get methods from recent years
        examples.get_methods_by_year_range(2020, 2024)
        
        # Search for attention-related methods
        examples.search_methods("attention")
        
        # Get details for a specific method
        examples.get_method_details("LeVIT")
        
    except Exception as e:
        print(f"Error running examples: {e}")
    finally:
        examples.close()

if __name__ == "__main__":
    main() 