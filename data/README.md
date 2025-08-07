# Papers with Code Database Builder

This project builds a SQLite database from Papers with Code JSON data files.

## Files

The database is built from the following JSON files:
- `papers.json` - Research papers with metadata, authors, tasks, and methods
- `methods.json` - Machine learning methods and algorithms
- `datasets.json` - Datasets used in research
- `evaluations.json` - Task evaluations and categories
- `code-links.json` - Links to code repositories for papers

## Database Schema

The SQLite database contains the following tables:

### Core Tables
- **papers** - Research papers with metadata (title, abstract, URLs, etc.)
- **authors** - Paper authors
- **tasks** - Research tasks (e.g., "Image Classification", "Natural Language Processing")
- **methods** - Machine learning methods and algorithms
- **datasets** - Datasets used in research
- **evaluations** - Task evaluations
- **code_links** - Links to code repositories

### Relationship Tables
- **paper_authors** - Many-to-many relationship between papers and authors
- **paper_tasks** - Many-to-many relationship between papers and tasks
- **paper_methods** - Many-to-many relationship between papers and methods
- **evaluation_categories** - Categories for evaluations
- **evaluation_categories_rel** - Many-to-many relationship between evaluations and categories

## Usage

### Prerequisites
- Python 3.6 or higher
- The JSON data files in the same directory as the script

### Building the Database

1. Make sure all JSON files are in the current directory
2. Run the database builder:

```bash
python build_database.py
```

The script will:
1. Create a new SQLite database file (`papers_with_code.db`)
2. Create all necessary tables
3. Import data from all JSON files
4. Create indexes for better query performance
5. Display statistics about the imported data

### Expected Output

The script provides detailed logging of the import process:

```
2024-01-XX XX:XX:XX,XXX - INFO - Connected to database: papers_with_code.db
2024-01-XX XX:XX:XX,XXX - INFO - Creating database tables...
2024-01-XX XX:XX:XX,XXX - INFO - All tables created successfully
2024-01-XX XX:XX:XX,XXX - INFO - Loading papers from papers.json...
2024-01-XX XX:XX:XX,XXX - INFO - Found X,XXX papers to insert
...
2024-01-XX XX:XX:XX,XXX - INFO - Database build completed successfully!
```

## Database Statistics

After building, you can see statistics like:
- Papers: ~XXX,XXX records
- Authors: ~XXX,XXX records
- Tasks: ~XXX records
- Methods: ~XXX,XXX records
- Datasets: ~XXX,XXX records
- Code links: ~XXX,XXX records

## Querying the Database

Once built, you can query the database using any SQLite client. Example queries:

```sql
-- Find papers by a specific author
SELECT p.title, p.date 
FROM papers p 
JOIN paper_authors pa ON p.id = pa.paper_id 
JOIN authors a ON pa.author_id = a.id 
WHERE a.name = 'Yann LeCun';

-- Find papers in a specific task
SELECT p.title, p.date 
FROM papers p 
JOIN paper_tasks pt ON p.id = pt.paper_id 
JOIN tasks t ON pt.task_id = t.id 
WHERE t.name = 'Image Classification';

-- Find papers with code repositories
SELECT p.title, cl.repo_url 
FROM papers p 
JOIN code_links cl ON p.paper_url = cl.paper_url 
WHERE cl.is_official = 1;
```

## Performance

The database includes indexes on commonly queried fields for better performance:
- Paper titles, dates, and arXiv IDs
- Author names
- Task names
- Method names and URLs
- Dataset names and URLs
- Code link URLs

## File Sizes

The JSON files are quite large:
- `papers.json`: ~2.2GB
- `code-links.json`: ~155MB
- `evaluations.json`: ~252MB
- `datasets.json`: ~45MB
- `methods.json`: ~28MB

The import process may take several minutes depending on your system performance. 