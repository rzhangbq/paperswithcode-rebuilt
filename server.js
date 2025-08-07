import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Database path
const dbPath = path.join(__dirname, 'data', 'papers_with_code.db');

// Database connection
let db;

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Clean up cache every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

// Initialize database connection
async function initializeDatabase() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable WAL mode for better concurrent access
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    await db.exec('PRAGMA cache_size = 10000;');
    await db.exec('PRAGMA temp_store = MEMORY;');
    
    console.log('Connected to SQLite database:', dbPath);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

// Get papers with pagination and search
async function getPapers(page = 1, limit = 20, searchTerm = '') {
  const offset = (page - 1) * limit;
  
  // Create cache key
  const cacheKey = `papers_${page}_${limit}_${searchTerm}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  try {
    // Simple base query
    let query = `
      SELECT 
        p.id,
        p.paper_url,
        p.arxiv_id,
        p.nips_id,
        p.openreview_id,
        p.title,
        p.abstract,
        p.short_abstract,
        p.url_abs,
        p.url_pdf,
        p.proceeding,
        p.date,
        p.conference_url_abs,
        p.conference_url_pdf,
        p.conference,
        p.reproduces_paper
      FROM papers p
      WHERE p.date IS NOT NULL 
        AND p.date != '' 
        AND p.date != '2222-12-22' 
        AND p.date >= '1900-01-01' 
        AND p.date <= '2030-12-31'
    `;
    
    const params = [];
    
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      query += ` AND (p.title LIKE ? OR p.abstract LIKE ?)`;
      params.push(searchPattern, searchPattern);
    }
    
    // Get total count first
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.get(countQuery, params);
    const totalItems = countResult ? countResult.total : 0;
    
    // Get papers with pagination
    query += ` ORDER BY p.date DESC, p.id DESC LIMIT ? OFFSET ?`;
    const papersParams = [...params, limit, offset];
    const papers = await db.all(query, papersParams);
    
    // Get authors for these papers
    if (papers.length > 0) {
      const paperIds = papers.map(p => p.id);
      const authorsQuery = `
        SELECT pa.paper_id, GROUP_CONCAT(DISTINCT a.name) as authors
        FROM paper_authors pa
        JOIN authors a ON pa.author_id = a.id
        WHERE pa.paper_id IN (${paperIds.map(() => '?').join(',')})
        GROUP BY pa.paper_id
      `;
      
      const authorsResult = await db.all(authorsQuery, paperIds);
      const authorsMap = new Map(authorsResult.map(r => [r.paper_id, r.authors]));
      
      // Combine papers with authors
      papers.forEach(paper => {
        paper.authors = authorsMap.get(paper.id) ? authorsMap.get(paper.id).split(',') : [];
      });
    }
    
    // Process papers to map date to published
    const processedPapers = papers.map(paper => ({
      ...paper,
      published: paper.date
    }));
    
    const result = {
      data: processedPapers,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
    
    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: now });
    
    return result;
  } catch (error) {
    console.error('Error in getPapers:', error);
    throw error;
  }
}

// Get code links with pagination
async function getCodeLinks(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  // Create cache key
  const cacheKey = `code_links_${page}_${limit}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  // Use a single query with window function for better performance
  const query = `
    SELECT 
      cl.*,
      COUNT(*) OVER() as total_count
    FROM code_links cl
    ORDER BY cl.id
    LIMIT ? OFFSET ?
  `;
  
  const codeLinks = await db.all(query, [limit, offset]);
  const totalItems = codeLinks.length > 0 ? codeLinks[0].total_count : 0;
  
  // Remove the total_count from each row
  const cleanCodeLinks = codeLinks.map(link => {
    const { total_count, ...cleanLink } = link;
    return cleanLink;
  });
  
  const result = {
    data: cleanCodeLinks,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
  
  // Cache the result
  cache.set(cacheKey, { data: result, timestamp: now });
  
  return result;
}

// Get evaluations with pagination
async function getEvaluations(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const countQuery = 'SELECT COUNT(*) as total FROM evaluations';
  const countResult = await db.get(countQuery);
  const totalItems = countResult.total;
  
  const query = `
    SELECT 
      e.id,
      e.task,
      e.description,
      GROUP_CONCAT(DISTINCT ec.name) as categories
    FROM evaluations e
    LEFT JOIN evaluation_categories_rel ecr ON e.id = ecr.evaluation_id
    LEFT JOIN evaluation_categories ec ON ecr.category_id = ec.id
    GROUP BY e.id
    ORDER BY e.id
    LIMIT ? OFFSET ?
  `;
  
  const evaluations = await db.all(query, [limit, offset]);
  
  // Process evaluations to format categories as array and add placeholder fields
  const processedEvaluations = evaluations.map(evaluation => ({
    id: evaluation.id,
    task: evaluation.task,
    description: evaluation.description,
    dataset: 'N/A', // Placeholder since this is task description, not evaluation data
    metrics: {}, // Placeholder
    categories: evaluation.categories ? evaluation.categories.split(',') : []
  }));
  
  return {
    data: processedEvaluations,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

// Get methods with pagination
async function getMethods(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const countQuery = 'SELECT COUNT(*) as total FROM methods';
  const countResult = await db.get(countQuery);
  const totalItems = countResult.total;
  
  const query = `
    SELECT * FROM methods
    ORDER BY id
    LIMIT ? OFFSET ?
  `;
  
  const methods = await db.all(query, [limit, offset]);
  
  return {
    data: methods,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

// Get datasets with pagination
async function getDatasets(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const countQuery = 'SELECT COUNT(*) as total FROM datasets';
  const countResult = await db.get(countQuery);
  const totalItems = countResult.total;
  
  const query = `
    SELECT * FROM datasets
    ORDER BY id
    LIMIT ? OFFSET ?
  `;
  
  const datasets = await db.all(query, [limit, offset]);
  
  return {
    data: datasets,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

// Get leaderboard data
async function getLeaderboard(dataset, task) {
  // Since the evaluations table only contains task descriptions, not actual evaluation data,
  // we'll return a placeholder response for now
  // TODO: Rebuild database with proper evaluation data structure
  return [];
}

// Get code links for specific papers
async function getCodeLinksForPapers(paperUrls) {
  if (!paperUrls || paperUrls.length === 0) {
    return [];
  }
  
  // Create placeholders for the IN clause
  const placeholders = paperUrls.map(() => '?').join(',');
  
  const query = `
    SELECT 
      cl.*
    FROM code_links cl
    WHERE cl.paper_url IN (${placeholders})
    ORDER BY cl.paper_url, cl.id
  `;
  
  const codeLinks = await db.all(query, paperUrls);
  return codeLinks;
}

// API Endpoints

// Get papers with pagination
app.get('/api/papers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getPapers(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error serving papers data:', error);
    res.status(500).json({ error: 'Failed to fetch papers data' });
  }
});

// Search papers
app.get('/api/papers/search', async (req, res) => {
  try {
    const query = req.query.q?.toString() || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getPapers(page, limit, query);
    res.json(result);
  } catch (error) {
    console.error('Error searching papers data:', error);
    res.status(500).json({ error: 'Failed to search papers data' });
  }
});

// Get code links
app.get('/api/code-links', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getCodeLinks(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error serving code links data:', error);
    res.status(500).json({ error: 'Failed to fetch code links data' });
  }
});

// Get code links for specific papers
app.post('/api/code-links/for-papers', async (req, res) => {
  try {
    const { paperUrls } = req.body;
    
    if (!paperUrls || !Array.isArray(paperUrls)) {
      return res.status(400).json({ error: 'paperUrls array is required' });
    }
    
    const codeLinks = await getCodeLinksForPapers(paperUrls);
    res.json(codeLinks);
  } catch (error) {
    console.error('Error serving code links for papers:', error);
    res.status(500).json({ error: 'Failed to fetch code links for papers' });
  }
});

// Get evaluations
app.get('/api/evaluations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getEvaluations(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error serving evaluations data:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations data' });
  }
});

// Get methods
app.get('/api/methods', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getMethods(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error serving methods data:', error);
    res.status(500).json({ error: 'Failed to fetch methods data' });
  }
});

// Get datasets
app.get('/api/datasets', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getDatasets(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error serving datasets data:', error);
    res.status(500).json({ error: 'Failed to fetch datasets data' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { dataset, task } = req.query;
    
    if (!dataset || !task) {
      return res.status(400).json({ error: 'Dataset and task parameters are required' });
    }
    
    const leaderboard = await getLeaderboard(dataset, task);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error serving leaderboard data:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

// Additional useful endpoints

// Get paper by ID
app.get('/api/papers/:id', async (req, res) => {
  try {
    const paperId = parseInt(req.params.id);
    
    const query = `
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT a.name) as authors,
        GROUP_CONCAT(DISTINCT t.name) as tasks,
        GROUP_CONCAT(DISTINCT m.name) as methods
      FROM papers p
      LEFT JOIN paper_authors pa ON p.id = pa.paper_id
      LEFT JOIN authors a ON pa.author_id = a.id
      LEFT JOIN paper_tasks pt ON p.id = pt.paper_id
      LEFT JOIN tasks t ON pt.task_id = t.id
      LEFT JOIN paper_methods pm ON p.id = pm.paper_id
      LEFT JOIN methods m ON pm.method_id = m.id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const paper = await db.get(query, [paperId]);
    
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    
    // Process paper to format arrays
    const processedPaper = {
      ...paper,
      authors: paper.authors ? paper.authors.split(',') : [],
      tasks: paper.tasks ? paper.tasks.split(',') : [],
      methods: paper.methods ? paper.methods.split(',') : []
    };
    
    res.json(processedPaper);
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

// Get available datasets
app.get('/api/datasets/list', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT name FROM datasets ORDER BY name';
    const datasets = await db.all(query);
    res.json(datasets.map(d => d.name));
  } catch (error) {
    console.error('Error fetching datasets list:', error);
    res.status(500).json({ error: 'Failed to fetch datasets list' });
  }
});

// Get available tasks
app.get('/api/tasks/list', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT name FROM tasks ORDER BY name';
    const tasks = await db.all(query);
    res.json(tasks.map(t => t.name));
  } catch (error) {
    console.error('Error fetching tasks list:', error);
    res.status(500).json({ error: 'Failed to fetch tasks list' });
  }
});

// Get available methods
app.get('/api/methods/list', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT name FROM methods ORDER BY name';
    const methods = await db.all(query);
    res.json(methods.map(m => m.name));
  } catch (error) {
    console.error('Error fetching methods list:', error);
    res.status(500).json({ error: 'Failed to fetch methods list' });
  }
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Get counts for each table
    const tables = ['papers', 'authors', 'tasks', 'methods', 'datasets', 'evaluations', 'code_links'];
    
    for (const table of tables) {
      const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result.count;
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database: ${dbPath}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});