# Papers with Code Database Builder

This directory contains a single consolidated script to build both required Papers with Code databases from the original JSON data files.

## Generated Databases

The script builds two SQLite databases:

1. **papers_with_code.db** - Main database containing:
   - Papers with abstracts, authors, and metadata
   - Methods with hierarchical organization
   - Datasets and their descriptions
   - Code links between papers and repositories
   - Tasks and evaluations

2. **evaluation_database.db** - Evaluation database containing:
   - Detailed evaluation data with performance metrics
   - Tasks and subtasks
   - Datasets with evaluation results
   - Papers with their evaluation scores
   - Code and model links

## Requirements

### Prerequisites
- Python 3.6 or higher
- SQLite3 (included with Python)

### Required JSON Files

Place these files in the `../raw_data/` directory:
- `papers-with-abstracts.json` (~2.2GB) - Research papers with abstracts
- `methods.json` (~28MB) - Machine learning methods
- `datasets.json` (~45MB) - Datasets information
- `evaluation-tables.json` (~145MB) - Evaluation data with metrics
- `links-between-papers-and-code.json` (~8MB) - Code repository links

## Usage

### Building Both Databases

Simply run the main script:

```bash
python build_databases.py
```

This will:
1. Check for all required JSON files
2. Build `papers_with_code.db` with complete papers data
3. Build `evaluation_database.db` with evaluation metrics
4. Create indexes for optimal query performance
5. Display statistics for both databases

### Expected Output

The script will generate detailed logs and create two database files:

```
papers_with_code.db      (~6.6GB) - Main database
evaluation_database.db   (~72MB)  - Evaluation database
```

### Build Time

Expect the build process to take 30-60 minutes depending on your system performance. The script provides progress updates every 1000 records processed.

## Database Schemas

### papers_with_code.db Tables
- `papers` - Research papers with metadata
- `authors` - Author information
- `paper_authors` - Paper-author relationships
- `methods` - ML methods with hierarchical categories
- `method_areas` - Top-level method areas
- `method_categories` - Method categories within areas
- `method_categories_rel` - Method-category relationships
- `paper_methods` - Paper-method relationships
- `datasets` - Dataset information
- `tasks` - Task definitions
- `paper_tasks` - Paper-task relationships
- `evaluations` - Evaluation information
- `code_links` - Code repository links

### evaluation_database.db Tables
- `tasks` - Evaluation tasks
- `subtasks` - Task subdivisions
- `datasets` - Evaluation datasets
- `papers` - Papers with evaluation results
- `metrics` - Performance metrics
- `code_links` - Code repository links
- `model_links` - Pre-trained model links

## Error Handling

The script includes comprehensive error handling and will:
- Check for missing JSON files before starting
- Log detailed progress and error messages
- Continue building other components if one fails
- Provide a summary of successful builds

## Verification

After successful completion, you can verify the databases by checking:
- File sizes match expected ranges
- Record counts in the final statistics
- Database files can be opened with SQLite tools

## Integration

These databases are designed to work with the Papers with Code web application. The main application can connect to both databases to provide:
- Paper search and browsing
- Method hierarchy exploration
- Evaluation result comparisons
- Code repository discovery

## Troubleshooting

### Common Issues

1. **Missing JSON files**: Ensure all required files are in `../raw_data/`
2. **Insufficient disk space**: Need at least 10GB free space
3. **Memory issues**: The script processes data in chunks but may require 4-8GB RAM
4. **Build failures**: Check the `database_build.log` file for detailed error messages

### Performance Tips

- Run on SSD storage for faster I/O
- Close other applications to free up memory
- Ensure stable system during the long build process

## File Cleanup

This directory has been cleaned up to contain only:
- `build_databases.py` - Main build script with consolidated functionality
- `README.md` - This documentation file
- `requirements.txt` - Python dependencies

All other scripts and documentation files have been removed to maintain simplicity and focus on the core functionality. 