# Papers with Code Database - Build Summary

## Database Overview

Successfully built a comprehensive SQLite database from Papers with Code JSON data files.

**Database File:** `papers_with_code.db` (2.9GB)

## Data Statistics

### Core Tables
- **Papers:** 576,261 records
- **Authors:** 596,336 records  
- **Tasks:** 4,796 records
- **Methods:** 1,478,787 records
- **Datasets:** 15,008 records
- **Evaluations:** 2,254 records
- **Code Links:** 300,161 records

### Relationship Tables
- **Paper-Author relationships:** 4,913,245 records
- **Paper-Task relationships:** 2,296,496 records
- **Paper-Method relationships:** 0 records (methods are stored separately)

## Database Schema

### Core Tables

#### papers
- `id` (PRIMARY KEY)
- `paper_url` (UNIQUE)
- `arxiv_id`, `nips_id`, `openreview_id`
- `title`, `abstract`, `short_abstract`
- `url_abs`, `url_pdf`
- `proceeding`, `date`
- `conference_url_abs`, `conference_url_pdf`, `conference`
- `reproduces_paper`

#### authors
- `id` (PRIMARY KEY)
- `name` (UNIQUE)

#### tasks
- `id` (PRIMARY KEY)
- `name` (UNIQUE)

#### methods
- `id` (PRIMARY KEY)
- `url` (UNIQUE)
- `name`, `full_name`, `description`
- `paper_title`, `paper_url`

#### datasets
- `id` (PRIMARY KEY)
- `url` (UNIQUE)
- `name`, `full_name`, `homepage`
- `description`, `short_description`
- `parent_dataset`, `image`

#### evaluations
- `id` (PRIMARY KEY)
- `task`, `description`

#### code_links
- `id` (PRIMARY KEY)
- `paper_url`, `paper_title`, `paper_arxiv_id`
- `paper_url_abs`, `paper_url_pdf`
- `repo_url`, `is_official`, `mentioned_in_paper`

### Relationship Tables

#### paper_authors
- `paper_id` (FOREIGN KEY)
- `author_id` (FOREIGN KEY)
- `author_order`

#### paper_tasks
- `paper_id` (FOREIGN KEY)
- `task_id` (FOREIGN KEY)

#### paper_methods
- `paper_id` (FOREIGN KEY)
- `method_id` (FOREIGN KEY)

#### evaluation_categories
- `id` (PRIMARY KEY)
- `name` (UNIQUE)

#### evaluation_categories_rel
- `evaluation_id` (FOREIGN KEY)
- `category_id` (FOREIGN KEY)

## Performance Features

### Indexes Created
- Papers: `arxiv_id`, `title`, `date`
- Authors: `name`
- Tasks: `name`
- Methods: `name`, `url`
- Datasets: `name`, `url`
- Code links: `paper_url`, `repo_url`

## Usage Examples

### Basic Queries

1. **Find papers by author:**
```sql
SELECT p.title, p.date 
FROM papers p 
JOIN paper_authors pa ON p.id = pa.paper_id 
JOIN authors a ON pa.author_id = a.id 
WHERE a.name = 'Yann LeCun';
```

2. **Find papers in a task:**
```sql
SELECT p.title, p.date 
FROM papers p 
JOIN paper_tasks pt ON p.id = pt.paper_id 
JOIN tasks t ON pt.task_id = t.id 
WHERE t.name = 'Image Classification';
```

3. **Find papers with code:**
```sql
SELECT p.title, cl.repo_url 
FROM papers p 
JOIN code_links cl ON p.paper_url = cl.paper_url 
WHERE cl.is_official = 1;
```

### Advanced Queries

4. **Most active authors:**
```sql
SELECT a.name, COUNT(pa.paper_id) as paper_count
FROM authors a
JOIN paper_authors pa ON a.id = pa.author_id
GROUP BY a.id, a.name
ORDER BY paper_count DESC
LIMIT 10;
```

5. **Papers by year:**
```sql
SELECT SUBSTR(date, 1, 4) as year, COUNT(*) as paper_count
FROM papers 
WHERE date IS NOT NULL
GROUP BY SUBSTR(date, 1, 4)
ORDER BY year DESC;
```

## Data Quality Notes

- **Anonymous authors:** There are 4,616 papers with "Anonymous" as the author
- **Date range:** Papers span from 2017 to 2025 (with one outlier from 2222)
- **Conference coverage:** Includes major conferences like NeurIPS, ICML, ICLR, etc.
- **Code availability:** 300,161 papers have associated code repositories

## File Structure

```
data/
├── papers.json (2.2GB) - Main papers data
├── methods.json (28MB) - Methods and algorithms
├── datasets.json (45MB) - Dataset information
├── evaluations.json (252MB) - Task evaluations
├── code-links.json (155MB) - Code repository links
├── build_database.py - Database builder script
├── query_examples.py - Example queries
├── requirements.txt - Dependencies
├── README.md - Usage instructions
├── papers_with_code.db - SQLite database (2.9GB)
└── DATABASE_SUMMARY.md - This file
```

## Next Steps

The database is ready for:
- Research analysis
- Literature reviews
- Author collaboration studies
- Task trend analysis
- Code availability studies
- Conference analysis

Use the provided `query_examples.py` script to get started with common queries. 