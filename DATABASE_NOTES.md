# Database Notes

## Current State

The application is now running successfully with the SQLite database, but there are some limitations:

### ✅ Working Features
- **Papers browsing and search** - Fully functional
- **Code links** - Working correctly
- **Datasets** - Working correctly  
- **Methods** - Working correctly
- **Basic evaluations** - Shows task descriptions only

### ⚠️ Limitations

#### Leaderboard Functionality
The leaderboard feature is currently limited because the database schema doesn't include the actual evaluation data with metrics. The current `evaluations` table only contains:
- Task descriptions
- Task names
- Categories

**Missing data:**
- Dataset names
- Performance metrics
- Method names
- Evaluation results

#### Database Schema Issue
The original `evaluations.json` file contained evaluation data with:
- `dataset`: Dataset name
- `task`: Task name  
- `metrics`: Performance metrics object
- `method`: Method name
- `paper_url`: Link to paper

But the current database only stores task descriptions.

## Solutions

### Option 1: Rebuild Database with Full Evaluation Data
1. Modify `build_database.py` to create a proper evaluations table
2. Include all the missing fields (dataset, metrics, method, etc.)
3. Rebuild the database from the original JSON files

### Option 2: Create a Separate Evaluations Table
1. Create a new table for actual evaluation data
2. Keep the current `evaluations` table for task descriptions
3. Add proper relationships between tables

### Option 3: Use Placeholder Data
1. Keep current structure
2. Add placeholder evaluation data for demonstration
3. Document that real evaluation data requires database rebuild

## Current Workaround
The leaderboard API now returns an empty array `[]` instead of crashing, and the frontend handles this gracefully.

## Recommendation
For a production system, **Option 1** (rebuild database with full evaluation data) would be the best approach to restore full leaderboard functionality. 