#!/usr/bin/env python3
"""
Example queries for the Papers with Code SQLite database.
"""

import sqlite3
import pandas as pd

def connect_db():
    """Connect to the database"""
    return sqlite3.connect('papers_with_code.db')

def example_queries():
    """Run example queries to demonstrate database usage"""
    conn = connect_db()
    
    print("=== Papers with Code Database Query Examples ===\n")
    
    # Example 1: Find papers by a specific author
    print("1. Papers by Yann LeCun:")
    query1 = """
    SELECT p.title, p.date, p.url_abs
    FROM papers p 
    JOIN paper_authors pa ON p.id = pa.paper_id 
    JOIN authors a ON pa.author_id = a.id 
    WHERE a.name = 'Yann LeCun'
    ORDER BY p.date DESC
    LIMIT 5;
    """
    
    df1 = pd.read_sql_query(query1, conn)
    print(df1.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 2: Find papers in a specific task
    print("2. Recent papers in Image Classification:")
    query2 = """
    SELECT p.title, p.date, p.url_abs
    FROM papers p 
    JOIN paper_tasks pt ON p.id = pt.paper_id 
    JOIN tasks t ON pt.task_id = t.id 
    WHERE t.name = 'Image Classification'
    ORDER BY p.date DESC
    LIMIT 5;
    """
    
    df2 = pd.read_sql_query(query2, conn)
    print(df2.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 3: Find papers with code repositories
    print("3. Papers with official code repositories:")
    query3 = """
    SELECT p.title, cl.repo_url, cl.is_official
    FROM papers p 
    JOIN code_links cl ON p.paper_url = cl.paper_url 
    WHERE cl.is_official = 1
    ORDER BY p.date DESC
    LIMIT 5;
    """
    
    df3 = pd.read_sql_query(query3, conn)
    print(df3.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 4: Most active authors
    print("4. Most active authors (by number of papers):")
    query4 = """
    SELECT a.name, COUNT(pa.paper_id) as paper_count
    FROM authors a
    JOIN paper_authors pa ON a.id = pa.author_id
    GROUP BY a.id, a.name
    ORDER BY paper_count DESC
    LIMIT 10;
    """
    
    df4 = pd.read_sql_query(query4, conn)
    print(df4.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 5: Popular tasks
    print("5. Most popular research tasks:")
    query5 = """
    SELECT t.name, COUNT(pt.paper_id) as paper_count
    FROM tasks t
    JOIN paper_tasks pt ON t.id = pt.task_id
    GROUP BY t.id, t.name
    ORDER BY paper_count DESC
    LIMIT 10;
    """
    
    df5 = pd.read_sql_query(query5, conn)
    print(df5.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 6: Papers from specific conferences
    print("6. Recent NeurIPS papers:")
    query6 = """
    SELECT title, date, url_abs
    FROM papers 
    WHERE proceeding LIKE '%NeurIPS%'
    ORDER BY date DESC
    LIMIT 5;
    """
    
    df6 = pd.read_sql_query(query6, conn)
    print(df6.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 7: Papers with specific keywords in title
    print("7. Papers with 'transformer' in the title:")
    query7 = """
    SELECT title, date, url_abs
    FROM papers 
    WHERE LOWER(title) LIKE '%transformer%'
    ORDER BY date DESC
    LIMIT 5;
    """
    
    df7 = pd.read_sql_query(query7, conn)
    print(df7.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 8: Papers with arXiv IDs
    print("8. Recent papers with arXiv IDs:")
    query8 = """
    SELECT title, arxiv_id, date, url_abs
    FROM papers 
    WHERE arxiv_id IS NOT NULL
    ORDER BY date DESC
    LIMIT 5;
    """
    
    df8 = pd.read_sql_query(query8, conn)
    print(df8.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 9: Papers by year
    print("9. Number of papers published by year:")
    query9 = """
    SELECT 
        SUBSTR(date, 1, 4) as year,
        COUNT(*) as paper_count
    FROM papers 
    WHERE date IS NOT NULL
    GROUP BY SUBSTR(date, 1, 4)
    ORDER BY year DESC
    LIMIT 10;
    """
    
    df9 = pd.read_sql_query(query9, conn)
    print(df9.to_string(index=False))
    print("\n" + "="*80 + "\n")
    
    # Example 10: Papers with multiple authors
    print("10. Papers with the most authors:")
    query10 = """
    SELECT p.title, COUNT(pa.author_id) as author_count
    FROM papers p
    JOIN paper_authors pa ON p.id = pa.paper_id
    GROUP BY p.id, p.title
    ORDER BY author_count DESC
    LIMIT 5;
    """
    
    df10 = pd.read_sql_query(query10, conn)
    print(df10.to_string(index=False))
    
    conn.close()

def search_papers(keyword, limit=10):
    """Search papers by keyword in title or abstract"""
    conn = connect_db()
    
    query = """
    SELECT title, date, url_abs, abstract
    FROM papers 
    WHERE LOWER(title) LIKE ? OR LOWER(abstract) LIKE ?
    ORDER BY date DESC
    LIMIT ?;
    """
    
    search_term = f'%{keyword.lower()}%'
    df = pd.read_sql_query(query, conn, params=(search_term, search_term, limit))
    
    print(f"\n=== Search results for '{keyword}' ===")
    print(df.to_string(index=False))
    
    conn.close()
    return df

def get_paper_details(paper_title):
    """Get detailed information about a specific paper"""
    conn = connect_db()
    
    # Get paper info
    paper_query = """
    SELECT title, abstract, date, url_abs, url_pdf, proceeding
    FROM papers 
    WHERE LOWER(title) LIKE ?
    LIMIT 1;
    """
    
    paper_df = pd.read_sql_query(paper_query, conn, params=(f'%{paper_title.lower()}%',))
    
    if not paper_df.empty:
        paper = paper_df.iloc[0]
        print(f"\n=== Paper Details ===")
        print(f"Title: {paper['title']}")
        print(f"Date: {paper['date']}")
        print(f"Conference: {paper['proceeding']}")
        print(f"Abstract: {paper['abstract'][:200]}...")
        print(f"URL: {paper['url_abs']}")
        
        # Get authors
        authors_query = """
        SELECT a.name
        FROM authors a
        JOIN paper_authors pa ON a.id = pa.author_id
        JOIN papers p ON pa.paper_id = p.id
        WHERE LOWER(p.title) LIKE ?
        ORDER BY pa.author_order;
        """
        
        authors_df = pd.read_sql_query(authors_query, conn, params=(f'%{paper_title.lower()}%',))
        if not authors_df.empty:
            authors = ', '.join(authors_df['name'].tolist())
            print(f"Authors: {authors}")
        
        # Get tasks
        tasks_query = """
        SELECT t.name
        FROM tasks t
        JOIN paper_tasks pt ON t.id = pt.task_id
        JOIN papers p ON pt.paper_id = p.id
        WHERE LOWER(p.title) LIKE ?;
        """
        
        tasks_df = pd.read_sql_query(tasks_query, conn, params=(f'%{paper_title.lower()}%',))
        if not tasks_df.empty:
            tasks = ', '.join(tasks_df['name'].tolist())
            print(f"Tasks: {tasks}")
    
    conn.close()

if __name__ == "__main__":
    # Run example queries
    example_queries()
    
    # Example search
    print("\n" + "="*80)
    search_papers("transformer", 3)
    
    # Example paper details
    print("\n" + "="*80)
    get_paper_details("Attention is all you need") 