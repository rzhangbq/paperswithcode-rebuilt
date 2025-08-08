# Enhanced Methods Functionality

This document describes the enhanced methods functionality that has been added to the Papers with Code database, supporting the hierarchical organization of machine learning methods as shown on the Papers with Code website.

## Overview

The enhanced methods system organizes machine learning methods into a hierarchical structure:

- **Areas**: Top-level categories (e.g., "Computer Vision", "Natural Language Processing")
- **Categories**: Sub-categories within areas (e.g., "Convolutional Neural Networks", "Transformers")
- **Methods**: Individual machine learning methods and algorithms

## Database Schema

### New Tables

#### `method_areas`
Stores the top-level areas for organizing methods.

```sql
CREATE TABLE method_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id TEXT UNIQUE,           -- e.g., "computer-vision"
    area_name TEXT UNIQUE          -- e.g., "Computer Vision"
);
```

#### `method_categories`
Stores categories within each area.

```sql
CREATE TABLE method_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,              -- e.g., "Convolutional Neural Networks"
    area_id INTEGER,               -- Foreign key to method_areas
    FOREIGN KEY (area_id) REFERENCES method_areas (id)
);
```

#### `method_categories_rel`
Many-to-many relationship between methods and categories.

```sql
CREATE TABLE method_categories_rel (
    method_id INTEGER,             -- Foreign key to methods
    category_id INTEGER,           -- Foreign key to method_categories
    FOREIGN KEY (method_id) REFERENCES methods (id),
    FOREIGN KEY (category_id) REFERENCES method_categories (id),
    PRIMARY KEY (method_id, category_id)
);
```

### Enhanced `methods` Table

The methods table has been enhanced with additional fields:

```sql
CREATE TABLE methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    name TEXT,
    full_name TEXT,
    description TEXT,
    paper_title TEXT,
    paper_url TEXT,
    introduced_year INTEGER,       -- NEW: Year the method was introduced
    source_url TEXT,              -- NEW: Source URL (e.g., arXiv)
    source_title TEXT,            -- NEW: Source title
    code_snippet_url TEXT,        -- NEW: URL to code snippet
    num_papers INTEGER            -- NEW: Number of papers using this method
);
```

## Methods Hierarchy

The system organizes methods into the following areas (similar to Papers with Code):

### 1. General
- **Attention Mechanisms** (64 methods)
- **Activation Functions** (78 methods)
- **Stochastic Optimization** (54 methods)
- **Regularization** (49 methods)
- **Feedforward Networks** (various methods)
- **Normalization** (various methods)

### 2. Computer Vision
- **Convolutional Neural Networks** (91 methods)
- **3D Face Mesh Models** (1,079 methods)
- **3D Object Detection Models** (731 methods)
- **3D Reconstruction** (160 methods)
- **Vision Transformers** (various methods)
- **Image Generation Models** (various methods)

### 3. Natural Language Processing
- **Transformers** (66 methods)
- **Language Models** (40 methods)
- **Autoencoding Transformers** (19 methods)
- **Autoregressive Transformers** (13 methods)
- **Word Embeddings** (13 methods)
- **Sentence Embeddings** (various methods)

### 4. Reinforcement Learning
- **Policy Gradient Methods** (21 methods)
- **Reinforcement Learning Frameworks** (10 methods)
- **Heuristic Search Algorithms** (9 methods)
- **Q-Learning Networks** (8 methods)
- **Distributed Reinforcement Learning** (6 methods)

### 5. Sequential
- **Recurrent Neural Networks** (29 methods)
- **Sequence To Sequence Models** (15 methods)
- **Time Series Analysis** (11 methods)
- **Temporal Convolutions** (5 methods)
- **Bidirectional Recurrent Neural Networks** (4 methods)

### 6. Graphs
- **Graph Models** (52 methods)
- **Graph Embeddings** (42 methods)
- **Graph Representation Learning** (16 methods)
- **Graph Data Augmentation** (2 methods)

### 7. Audio
- **Generative Audio Models** (13 methods)
- **Text-to-Speech Models** (9 methods)
- **Audio Model Blocks** (7 methods)
- **Speech Separation Models** (4 methods)
- **Phase Reconstruction** (2 methods)

## Usage Examples

### 1. Get Complete Methods Hierarchy

```python
def get_methods_hierarchy():
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
```

### 2. Get Methods by Area

```python
def get_methods_by_area(area_name):
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
    '''
```

### 3. Get Methods by Category

```python
def get_methods_by_category(category_name):
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
    '''
```

### 4. Search Methods

```python
def search_methods(search_term):
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
    '''
```

### 5. Get Top Methods by Papers

```python
def get_top_methods_by_papers(limit=20):
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
```

## Database Statistics

Based on the current database:

- **Total Methods**: 8,725
- **Areas**: 7 (General, Computer Vision, NLP, RL, Sequential, Graphs, Audio)
- **Categories**: 332
- **Method-Category Relationships**: 9,154

### Top Methods by Papers

1. **Softmax** - 37,448 papers
2. **Dense Connections** - 29,235 papers
3. **Dropout** - 27,477 papers
4. **Linear Layer** - 25,425 papers
5. **Layer Normalization** - 24,985 papers
6. **Convolution** - 19,588 papers
7. **BPE (Byte Pair Encoding)** - 18,980 papers
8. **Focus** - 15,341 papers
9. **Label Smoothing** - 14,332 papers
10. **Transformer** - 14,004 papers

## Files

### Database Builder
- `rebuild_methods_database.py` - Enhanced database builder with methods hierarchy support

### Query Examples
- `methods_query_examples.py` - Comprehensive examples of how to query the methods hierarchy

### Original Files (Updated)
- `build_database.py` - Updated with enhanced methods support

## Running the Enhanced System

### 1. Build the Enhanced Database

```bash
cd paperswithcode-rebuilt/data
python rebuild_methods_database.py
```

### 2. Run Query Examples

```bash
python methods_query_examples.py
```

### 3. Integration with Web Application

The enhanced methods functionality can be integrated into the web application by:

1. Updating the API endpoints to use the new database schema
2. Adding methods browsing pages with area/category navigation
3. Implementing search functionality across methods
4. Adding method detail pages with full information

## Benefits

1. **Organized Navigation**: Users can browse methods by area and category
2. **Better Search**: Search functionality can filter by area/category
3. **Comprehensive Information**: Each method includes introduction year, paper count, and detailed descriptions
4. **Scalable Structure**: Easy to add new areas and categories
5. **Performance**: Optimized indexes for fast queries

## Future Enhancements

1. **Method Relationships**: Track which methods are related or derived from others
2. **Performance Metrics**: Add performance comparisons between methods
3. **Code Examples**: Link to actual code implementations
4. **User Contributions**: Allow users to suggest new methods or categories
5. **Visualization**: Add charts and graphs showing method popularity over time 