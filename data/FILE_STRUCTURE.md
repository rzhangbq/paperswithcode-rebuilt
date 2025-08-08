# File Structure - Papers with Code Database System

This document describes the cleaned and organized file structure of the Papers with Code database system.

## 📁 Directory Structure

```
data/
├── 📚 Documentation
│   ├── COMPREHENSIVE_README.md          # Complete system documentation
│   ├── ENHANCED_METHODS_README.md       # Methods-specific documentation
│   └── FILE_STRUCTURE.md                # This file
│
├── 🚀 Database Builders
│   ├── build_all_databases.py           # Unified database builder (RECOMMENDED)
│   ├── build_database.py                # Standard database builder (with enhanced methods)
│   ├── enhance_existing_database.py     # Enhance existing database with methods areas/categories
│   └── build_evaluation_database.py     # Evaluation database builder
│
├── 🎯 Quick Start & Examples
│   ├── quick_start.py                   # Interactive setup script (RECOMMENDED)
│   ├── query_examples.py                # Standard database query examples
│   └── methods_query_examples.py        # Enhanced methods query examples
│
├── 🗄️ Database Files
│   ├── papers_with_code.db              # Standard database with enhanced methods (6.6GB)
│   └── evaluation_database.db           # Evaluation database (72MB)
│
├── 🛠️ Utilities
│   ├── clean_database.py                # Database cleaning utility
│   └── requirements.txt                 # Python dependencies
│
└── 📊 Raw Data (../raw_data/)
    ├── papers-with-abstracts.json       # Research papers (2.2GB)
    ├── methods.json                     # Machine learning methods (28MB)
    ├── datasets.json                    # Datasets (45MB)
    ├── evaluation-tables.json           # Task evaluations (252MB)
    └── links-between-papers-and-code.json # Code repository links (155MB)
```

## 🗑️ Deleted Redundant Files

The following files were removed to eliminate redundancy:

- `README.md` → Replaced by `COMPREHENSIVE_README.md`
- `DATABASE_SUMMARY.md` → Information merged into `COMPREHENSIVE_README.md`
- `README_DB_CLEANING.md` → Information merged into `COMPREHENSIVE_README.md`
- `leaderboards?dataset=MNIST&task=Clustering Algorithms Evaluation` → Malformed filename
- `*.db-wal` and `*.db-shm` → Temporary SQLite files (auto-regenerated)
- `papers_with_code_enhanced.db` → Merged into main `papers_with_code.db`
- `rebuild_methods_database.py` → Functionality integrated into `build_database.py`

## 🎯 Recommended Usage

### For New Users
```bash
cd paperswithcode-rebuilt/data
python quick_start.py
```

### For Advanced Users
```bash
# Build all databases
python build_all_databases.py --all

# Build specific databases
python build_all_databases.py --standard
python build_all_databases.py --enhanced
python build_all_databases.py --evaluation
```

### For Testing
```bash
# Test standard database
python query_examples.py

# Test enhanced methods
python methods_query_examples.py
```

## 📊 File Sizes

| File | Size | Description |
|------|------|-------------|
| `papers_with_code.db` | 6.6GB | Standard database |
| `papers_with_code_enhanced.db` | 29MB | Enhanced methods database |
| `evaluation_database.db` | 72MB | Evaluation database |
| `COMPREHENSIVE_README.md` | 12KB | Complete documentation |
| `build_all_databases.py` | 12KB | Unified builder |
| `quick_start.py` | 6.8KB | Interactive setup |

## 🔧 Database Options

1. **Standard Database** - Complete papers, authors, tasks, methods (with enhanced hierarchical organization), datasets, code links
2. **Evaluation Database** - Detailed evaluation data with performance metrics

## 📖 Documentation

- **`COMPREHENSIVE_README.md`** - Complete system guide with all features
- **`ENHANCED_METHODS_README.md`** - Detailed methods functionality
- **`FILE_STRUCTURE.md`** - This file structure overview

## 🚀 Next Steps

1. **Read Documentation** - Start with `COMPREHENSIVE_README.md`
2. **Run Quick Start** - Use `python quick_start.py`
3. **Test Databases** - Run query examples
4. **Integrate** - Use databases in your web application

## ✅ Benefits of Cleaned Structure

- **No Redundancy** - Eliminated duplicate documentation
- **Clear Organization** - Logical grouping of files
- **Easy Navigation** - Intuitive file structure
- **Professional** - Clean, maintainable codebase
- **Comprehensive** - All functionality preserved 