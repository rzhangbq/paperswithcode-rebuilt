# Papers with Code Database - Comprehensive Guide

This project provides a complete SQLite database system for Papers with Code data, including enhanced methods functionality with hierarchical organization.

## Table of Contents

1. [Overview](#overview)
2. [Database Options](#database-options)
3. [Installation & Setup](#installation--setup)
4. [Database Schemas](#database-schemas)
5. [Usage Examples](#usage-examples)
6. [API Integration](#api-integration)
7. [Performance & Statistics](#performance--statistics)
8. [Troubleshooting](#troubleshooting)

## Overview

The Papers with Code database system provides two main database options:

1. **Standard Database** (`papers_with_code.db`) - Complete papers, authors, tasks, methods (with enhanced hierarchical organization), datasets, and code links
2. **Evaluation Database** (`evaluation_database.db`) - Detailed evaluation data with metrics

## Database Options

### 1. Standard Database
- **File**: `papers_with_code.db` (6.6GB)
- **Content**: Papers, authors, tasks, methods, datasets, evaluations, code links
- **Builder**: `build_database.py`

### 2. Evaluation Database
- **File**: `evaluation_database.db` (72MB)
- **Content**: Detailed evaluation data with performance metrics
- **Builder**: `build_evaluation_database.py`

## Installation & Setup

### Prerequisites
```bash
# Python 3.6 or higher
python --version

# Install dependencies
pip install -r requirements.txt
```

### Required Files
Place these JSON files in the `raw_data/` directory:
- `papers-with-abstracts.json` (2.2GB) - Research papers
- `methods.json` (28MB) - Machine learning methods
- `datasets.json` (45MB) - Datasets
- `evaluation-tables.json` (252MB) - Task evaluations
- `links-between-papers-and-code.json` (155MB) - Code repository links

### Building Databases

#### Option 1: Standard Database
```bash
cd paperswithcode-rebuilt/data
python build_database.py
```

#### Option 2: Evaluation Database
```bash
cd paperswithcode-rebuilt/data
python build_evaluation_database.py
```

#### Option 3: All Databases
```bash
cd paperswithcode-rebuilt/data
python build_database.py
python build_evaluation_database.py
```

## Database Schemas

### Standard Database Schema

#### Core Tables
- **papers** - Research papers with metadata
- **authors** - Paper authors
- **tasks** - Research tasks
- **methods** - Machine learning methods
- **datasets** - Datasets used in research
- **evaluations** - Task evaluations
- **code_links** - Links to code repositories

#### Relationship Tables
- **paper_authors** - Many-to-many relationship between papers and authors
- **paper_tasks** - Many-to-many relationship between papers and tasks
- **paper_methods** - Many-to-many relationship between papers and methods
- **evaluation_categories** - Categories for evaluations
- **evaluation_categories_rel** - Many-to-many relationship between evaluations and categories

### Enhanced Methods Database Schema

#### Additional Tables
- **method_areas** - Top-level areas (e.g., "Computer Vision", "Natural Language Processing")
- **method_categories** - Categories within areas (e.g., "Convolutional Neural Networks", "Transformers")
- **method_categories_rel** - Many-to-many relationship between methods and categories

#### Enhanced Methods Table
```sql
CREATE TABLE methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    name TEXT,
    full_name TEXT,
    description TEXT,
    paper_title TEXT,
    paper_url TEXT,
    introduced_year INTEGER,       -- NEW
    source_url TEXT,              -- NEW
    source_title TEXT,            -- NEW
    code_snippet_url TEXT,        -- NEW
    num_papers INTEGER            -- NEW
);
```

### Methods Hierarchy

The enhanced system organizes methods into 7 areas:

1. **General** (5,648 methods)
   - Attention Mechanisms (64 methods)
   - Activation Functions (78 methods)
   - Stochastic Optimization (54 methods)
   - Regularization (49 methods)

2. **Computer Vision** (2,936 methods)
   - Convolutional Neural Networks (91 methods)
   - 3D Face Mesh Models (1,079 methods)
   - 3D Object Detection Models (731 methods)
   - Vision Transformers (various methods)

3. **Natural Language Processing** (231 methods)
   - Transformers (66 methods)
   - Language Models (40 methods)
   - Autoencoding Transformers (19 methods)
   - Word Embeddings (13 methods)

4. **Reinforcement Learning** (110 methods)
   - Policy Gradient Methods (21 methods)
   - Reinforcement Learning Frameworks (10 methods)
   - Heuristic Search Algorithms (9 methods)

5. **Sequential** (75 methods)
   - Recurrent Neural Networks (29 methods)
   - Sequence To Sequence Models (15 methods)
   - Time Series Analysis (11 methods)

6. **Graphs** (112 methods)
   - Graph Models (52 methods)
   - Graph Embeddings (42 methods)
   - Graph Representation Learning (16 methods)

7. **Audio** (42 methods)
   - Generative Audio Models (13 methods)
   - Text-to-Speech Models (9 methods)
   - Audio Model Blocks (7 methods)

## Usage Examples

### Standard Database Queries

#### Find Papers by Author
```sql
SELECT p.title, p.date 
FROM papers p 
JOIN paper_authors pa ON p.id = pa.paper_id 
JOIN authors a ON pa.author_id = a.id 
WHERE a.name = 'Yann LeCun';
```

#### Find Papers in Task
```sql
SELECT p.title, p.date 
FROM papers p 
JOIN paper_tasks pt ON p.id = pt.paper_id 
JOIN tasks t ON pt.task_id = t.id 
WHERE t.name = 'Image Classification';
```

#### Find Papers with Code
```sql
SELECT p.title, cl.repo_url 
FROM papers p 
JOIN code_links cl ON p.paper_url = cl.paper_url 
WHERE cl.is_official = 1;
```

### Enhanced Methods Queries

#### Get Methods Hierarchy
```python
# Use methods_query_examples.py
python methods_query_examples.py
```

#### Get Methods by Area
```sql
SELECT 
    m.name,
    m.full_name,
    m.num_papers,
    m.introduced_year,
    GROUP_CONCAT(DISTINCT mc.name) as categories
FROM methods m
JOIN method_categories_rel mcr ON m.id = mcr.method_id
JOIN method_categories mc ON mcr.category_id = mc.id
JOIN method_areas ma ON mc.area_id = ma.id
WHERE ma.area_name = 'Computer Vision'
GROUP BY m.id, m.name, m.full_name, m.num_papers, m.introduced_year
ORDER BY m.num_papers DESC;
```

#### Get Top Methods by Papers
```sql
SELECT 
    m.name,
    m.full_name,
    m.num_papers,
    m.introduced_year,
    GROUP_CONCAT(DISTINCT ma.area_name) as areas
FROM methods m
LEFT JOIN method_categories_rel mcr ON m.id = mcr.method_id
LEFT JOIN method_categories mc ON mcr.category_id = mc.id
LEFT JOIN method_areas ma ON mc.area_id = ma.id
WHERE m.num_papers > 0
GROUP BY m.id, m.name, m.full_name, m.num_papers, m.introduced_year
ORDER BY m.num_papers DESC
LIMIT 20;
```

### Python Query Examples

#### Run Standard Examples
```bash
python query_examples.py
```

#### Run Methods Examples
```bash
python methods_query_examples.py
```

## API Integration

### Web Application Integration

The databases can be integrated into web applications:

1. **Update server.js** to use the enhanced database
2. **Add methods endpoints** for browsing by area/category
3. **Implement search** across methods with filtering
4. **Add method detail pages** with full information

### Example API Endpoints

```javascript
// Get methods hierarchy
GET /api/methods/hierarchy

// Get methods by area
GET /api/methods/area/:areaName

// Get methods by category
GET /api/methods/category/:categoryName

// Search methods
GET /api/methods/search?q=:searchTerm

// Get method details
GET /api/methods/:methodName
```

## Performance & Statistics

### Database Statistics

#### Standard Database
- **Papers**: 576,261 records
- **Authors**: 596,336 records
- **Tasks**: 4,796 records
- **Methods**: 1,478,787 records
- **Datasets**: 15,008 records
- **Code Links**: 300,161 records

#### Enhanced Methods Database
- **Methods**: 8,725 records
- **Areas**: 7
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

### Performance Features

#### Indexes
- Papers: `arxiv_id`, `title`, `date`
- Authors: `name`
- Tasks: `name`
- Methods: `name`, `url`, `introduced_year`, `num_papers`
- Method areas: `area_id`, `area_name`
- Method categories: `name`, `area_id`

#### Optimization
- WAL mode for better concurrent access
- Optimized cache settings
- Memory-based temporary storage

## File Structure

```
data/
├── raw_data/                          # JSON source files
│   ├── papers-with-abstracts.json     # 2.2GB
│   ├── methods.json                   # 28MB
│   ├── datasets.json                  # 45MB
│   ├── evaluation-tables.json         # 252MB
│   └── links-between-papers-and-code.json # 155MB
├── build_database.py                  # Standard database builder
├── rebuild_methods_database.py        # Enhanced methods database builder
├── build_evaluation_database.py       # Evaluation database builder
├── methods_query_examples.py          # Methods query examples
├── query_examples.py                  # Standard query examples
├── clean_database.py                  # Database cleaning utility
├── requirements.txt                   # Python dependencies
├── papers_with_code.db               # Standard database (6.6GB)
├── papers_with_code_enhanced.db      # Enhanced methods database (29MB)
├── evaluation_database.db            # Evaluation database (72MB)
├── COMPREHENSIVE_README.md           # This file
├── ENHANCED_METHODS_README.md        # Methods-specific documentation
├── DATABASE_SUMMARY.md               # Database statistics
├── README_DB_CLEANING.md             # Cleaning documentation
└── README.md                         # Basic usage guide
```

## Troubleshooting

### Common Issues

#### 1. Memory Issues
- **Problem**: Large JSON files cause memory errors
- **Solution**: Process files in chunks or increase system memory

#### 2. Disk Space
- **Problem**: Insufficient disk space for database files
- **Solution**: Ensure at least 10GB free space for all databases

#### 3. File Permissions
- **Problem**: Cannot write database files
- **Solution**: Check directory permissions and write access

#### 4. Missing JSON Files
- **Problem**: Database builder fails due to missing source files
- **Solution**: Download all required JSON files to `raw_data/` directory

### Performance Tips

1. **Use SSDs** for better I/O performance
2. **Increase memory** for faster processing
3. **Use WAL mode** for concurrent access
4. **Create indexes** after data insertion
5. **Use transactions** for bulk operations

### Data Quality

- **Date validation**: Some papers have invalid dates (e.g., 2222)
- **Anonymous authors**: 4,616 papers have "Anonymous" as author
- **Missing relationships**: Some methods may not be linked to papers
- **Duplicate entries**: Use `INSERT OR IGNORE` to handle duplicates

## Next Steps

1. **Web Application**: Integrate databases into React/Node.js application
2. **API Development**: Create RESTful API endpoints
3. **Search Functionality**: Implement full-text search
4. **Visualization**: Add charts and graphs
5. **Real-time Updates**: Set up automated data updates
6. **User Interface**: Build intuitive browsing interface

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the example scripts
3. Examine the database schemas
4. Test with smaller datasets first

## License

This project is for educational and research purposes. Please respect the original Papers with Code data usage terms. 