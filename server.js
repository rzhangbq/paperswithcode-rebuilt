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

// Database paths
const papersDbPath = path.join(__dirname, 'data', 'papers_with_code.db');
const evaluationDbPath = path.join(__dirname, 'data', 'evaluation_database.db');

// Database connections
let papersDb;
let evaluationDb;

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

// Initialize database connections
async function initializeDatabase() {
  try {
    // Connect to papers database
    papersDb = await open({
      filename: papersDbPath,
      driver: sqlite3.Database
    });
    
    // Connect to evaluation database
    evaluationDb = await open({
      filename: evaluationDbPath,
      driver: sqlite3.Database
    });
    
    // Enable WAL mode for better concurrent access
    await papersDb.exec('PRAGMA journal_mode = WAL;');
    await papersDb.exec('PRAGMA synchronous = NORMAL;');
    await papersDb.exec('PRAGMA cache_size = 10000;');
    await papersDb.exec('PRAGMA temp_store = MEMORY;');
    
    await evaluationDb.exec('PRAGMA journal_mode = WAL;');
    await evaluationDb.exec('PRAGMA synchronous = NORMAL;');
    await evaluationDb.exec('PRAGMA cache_size = 10000;');
    await evaluationDb.exec('PRAGMA temp_store = MEMORY;');
    
    console.log('Connected to papers database:', papersDbPath);
    console.log('Connected to evaluation database:', evaluationDbPath);
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
    // Query for papers from papers database
    let query = `
      SELECT 
        p.id,
        p.paper_url,
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
    let countQuery = `
      SELECT COUNT(*) as total
      FROM papers p
      WHERE p.date IS NOT NULL 
        AND p.date != '' 
        AND p.date != '2222-12-22' 
        AND p.date >= '1900-01-01' 
        AND p.date <= '2030-12-31'
    `;
    
    const countParams = [];
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      countQuery += ` AND (p.title LIKE ? OR p.abstract LIKE ?)`;
      countParams.push(searchPattern, searchPattern);
    }
    
    const countResult = await papersDb.get(countQuery, countParams);
    const totalItems = countResult ? countResult.total : 0;
    
    // Get papers with pagination
    query += ` ORDER BY p.date DESC, p.id DESC LIMIT ? OFFSET ?`;
    const papersParams = [...params, limit, offset];
    const papers = await papersDb.all(query, papersParams);
    
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
      
      const authorsResult = await papersDb.all(authorsQuery, paperIds);
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
  
  const codeLinks = await papersDb.all(query, [limit, offset]);
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
  const countResult = await papersDb.get(countQuery);
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
  
  const evaluations = await papersDb.all(query, [limit, offset]);
  
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
  const countResult = await papersDb.get(countQuery);
  const totalItems = countResult.total;
  
  const query = `
    SELECT * FROM methods
    ORDER BY id
    LIMIT ? OFFSET ?
  `;
  
  const methods = await papersDb.all(query, [limit, offset]);
  
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
  const countResult = await papersDb.get(countQuery);
  const totalItems = countResult.total;
  
  const query = `
    SELECT * FROM datasets
    ORDER BY id
    LIMIT ? OFFSET ?
  `;
  
  const datasets = await papersDb.all(query, [limit, offset]);
  
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
  try {
    const results = await getEvaluationResults(dataset, task, 50);
    
    // Convert evaluation results to the format expected by the frontend
    const evaluations = results.map((result, index) => ({
      id: result.id,
      paper: result.paper_url,
      dataset: result.dataset,
      task: result.task,
      metrics: result.metrics,
      model_name: result.method,
      paper_title: result.paper_title,
      paper_url: result.paper_url,
      authors: [], // We don't have authors in evaluation_results table
      date: result.date,
      conference: result.conference
    }));
    
    // Sort by the first available metric in descending order
    if (evaluations.length > 0 && Object.keys(evaluations[0].metrics).length > 0) {
      const firstMetric = Object.keys(evaluations[0].metrics)[0];
      evaluations.sort((a, b) => (b.metrics[firstMetric] || 0) - (a.metrics[firstMetric] || 0));
    }
    
    return evaluations;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
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
  
  const codeLinks = await papersDb.all(query, paperUrls);
  return codeLinks;
}

// Get available datasets for leaderboards
async function getAvailableDatasets() {
  const query = `
    SELECT DISTINCT d.name, d.full_name, d.description
    FROM datasets d
    ORDER BY d.name
  `;
  
  const datasets = await papersDb.all(query);
  return datasets;
}

// Get available tasks for leaderboards with popularity ranking
async function getAvailableTasks(dataset = null) {
  let query;
  let params = [];
  
  if (dataset) {
    // Get tasks that have evaluations for this dataset, ranked by popularity
    query = `
      SELECT 
        t.name,
        COUNT(DISTINCT p.id) as paper_count,
        COUNT(DISTINCT d.id) as dataset_count,
        COUNT(DISTINCT m.id) as metric_count
      FROM tasks t
      JOIN datasets d ON t.id = d.task_id
      LEFT JOIN papers p ON d.id = p.dataset_id
      LEFT JOIN metrics m ON p.id = m.paper_id
      WHERE d.name = ?
      GROUP BY t.id, t.name
      ORDER BY paper_count DESC, dataset_count DESC, metric_count DESC, t.name
    `;
    params = [dataset];
  } else {
    // Get all tasks ranked by popularity (papers, datasets, metrics)
    query = `
      SELECT 
        t.name,
        COUNT(DISTINCT p.id) as paper_count,
        COUNT(DISTINCT d.id) as dataset_count,
        COUNT(DISTINCT m.id) as metric_count,
        COUNT(DISTINCT CASE WHEN p.paper_date >= date('now', '-2 years') THEN p.id END) as recent_papers
      FROM tasks t
      LEFT JOIN datasets d ON t.id = d.task_id
      LEFT JOIN papers p ON d.id = p.dataset_id
      LEFT JOIN metrics m ON p.id = m.paper_id
      GROUP BY t.id, t.name
      HAVING paper_count > 0
      ORDER BY paper_count DESC, recent_papers DESC, dataset_count DESC, metric_count DESC, t.name
    `;
  }
  
  const tasks = await evaluationDb.all(query, params);
  return tasks.map(task => task.name);
}

// Get available tasks with detailed statistics
async function getAvailableTasksWithStats(dataset = null, limit = 50) {
  let query;
  let params = [];
  
  if (dataset) {
    // Get tasks that have evaluations for this dataset, ranked by popularity
    query = `
      SELECT 
        t.name,
        COUNT(DISTINCT p.id) as paper_count,
        COUNT(DISTINCT d.id) as dataset_count,
        COUNT(DISTINCT m.id) as metric_count,
        MAX(p.paper_date) as latest_paper_date
      FROM tasks t
      JOIN datasets d ON t.id = d.task_id
      LEFT JOIN papers p ON d.id = p.dataset_id
      LEFT JOIN metrics m ON p.id = m.paper_id
      WHERE d.name = ?
      GROUP BY t.id, t.name
      ORDER BY paper_count DESC, dataset_count DESC, metric_count DESC, t.name
      LIMIT ?
    `;
    params = [dataset, limit];
  } else {
    // Get all tasks ranked by popularity (papers, datasets, metrics)
    query = `
      SELECT 
        t.name,
        COUNT(DISTINCT p.id) as paper_count,
        COUNT(DISTINCT d.id) as dataset_count,
        COUNT(DISTINCT m.id) as metric_count,
        COUNT(DISTINCT CASE WHEN p.paper_date >= date('now', '-2 years') THEN p.id END) as recent_papers,
        MAX(p.paper_date) as latest_paper_date
      FROM tasks t
      LEFT JOIN datasets d ON t.id = d.task_id
      LEFT JOIN papers p ON d.id = p.dataset_id
      LEFT JOIN metrics m ON p.id = m.paper_id
      GROUP BY t.id, t.name
      HAVING paper_count > 0
      ORDER BY paper_count DESC, recent_papers DESC, dataset_count DESC, metric_count DESC, t.name
      LIMIT ?
    `;
    params = [limit];
  }
  
  const tasks = await evaluationDb.all(query, params);
  return tasks;
}

// Get datasets for a specific task with popularity ranking
async function getDatasetsForTask(task) {
  const query = `
    SELECT 
      d.name,
      d.name as full_name,
      COUNT(DISTINCT p.id) as paper_count,
      COUNT(DISTINCT m.id) as metric_count,
      COUNT(DISTINCT CASE WHEN p.paper_date >= date('now', '-2 years') THEN p.id END) as recent_papers,
      MAX(p.paper_date) as latest_paper_date
    FROM datasets d
    JOIN tasks t ON d.task_id = t.id
    LEFT JOIN papers p ON d.id = p.dataset_id
    LEFT JOIN metrics m ON p.id = m.paper_id
    WHERE t.name = ?
    GROUP BY d.id, d.name
    HAVING paper_count > 0
    ORDER BY paper_count DESC, recent_papers DESC, metric_count DESC, latest_paper_date DESC, d.name
  `;
  
  const datasets = await evaluationDb.all(query, [task]);
  return datasets;
}

// Get tasks for a specific dataset with popularity ranking
async function getTasksForDataset(dataset) {
  const query = `
    SELECT 
      t.name,
      COUNT(DISTINCT p.id) as paper_count,
      COUNT(DISTINCT m.id) as metric_count,
      COUNT(DISTINCT CASE WHEN p.paper_date >= date('now', '-2 years') THEN p.id END) as recent_papers,
      MAX(p.paper_date) as latest_paper_date
    FROM tasks t
    JOIN datasets d ON t.id = d.task_id
    LEFT JOIN papers p ON d.id = p.dataset_id
    LEFT JOIN metrics m ON p.id = m.paper_id
    WHERE d.name = ?
    GROUP BY t.id, t.name
    HAVING paper_count > 0
    ORDER BY paper_count DESC, recent_papers DESC, metric_count DESC, latest_paper_date DESC, t.name
  `;
  
  const tasks = await evaluationDb.all(query, [dataset]);
  return tasks;
}

// Get evaluation results for leaderboard
async function getEvaluationResults(dataset, task, limit = 50) {
  const query = `
    SELECT 
      p.id,
      p.paper_url,
      p.paper_title,
      p.paper_date,
      p.model_name,
      p.uses_additional_data,
      t.name as task_name,
      d.name as dataset_name
    FROM papers p
    JOIN tasks t ON p.task_id = t.id
    JOIN datasets d ON p.dataset_id = d.id
    WHERE t.name = ? AND d.name = ?
    ORDER BY p.paper_date DESC
    LIMIT ?
  `;
  
  const results = await evaluationDb.all(query, [task, dataset, limit]);
  
  // Get metrics for each paper
  const formattedResults = [];
  for (const result of results) {
    const metricsQuery = `
      SELECT metric_name, metric_value
      FROM metrics
      WHERE paper_id = ?
    `;
    const metrics = await evaluationDb.all(metricsQuery, [result.id]);
    
    // Convert metrics to object
    const metricsObj = {};
    for (const metric of metrics) {
      metricsObj[metric.metric_name] = metric.metric_value;
    }
    
    formattedResults.push({
      id: result.id,
      task: result.task_name,
      dataset: result.dataset_name,
      method: result.model_name,
      paper_url: result.paper_url,
      paper_title: result.paper_title,
      metrics: metricsObj,
      date: result.paper_date,
      conference: '', // Not available in new schema
      evaluation_date: result.paper_date
    });
  }
  
  return formattedResults;
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

// Get available datasets for leaderboards
app.get('/api/leaderboard/datasets', async (req, res) => {
  try {
    const datasets = await getAvailableDatasets();
    res.json(datasets);
  } catch (error) {
    console.error('Error serving available datasets:', error);
    res.status(500).json({ error: 'Failed to fetch available datasets' });
  }
});

// Get available tasks for leaderboards
app.get('/api/leaderboard/tasks', async (req, res) => {
  try {
    const { dataset } = req.query;
    const tasks = await getAvailableTasks(dataset);
    res.json(tasks);
  } catch (error) {
    console.error('Error serving available tasks:', error);
    res.status(500).json({ error: 'Failed to fetch available tasks' });
  }
});

// Get available tasks with detailed statistics
app.get('/api/leaderboard/tasks/stats', async (req, res) => {
  try {
    const { dataset } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    const tasks = await getAvailableTasksWithStats(dataset, limit);
    res.json(tasks);
  } catch (error) {
    console.error('Error serving available tasks with stats:', error);
    res.status(500).json({ error: 'Failed to fetch available tasks with stats' });
  }
});

// Get tasks for a specific dataset
app.get('/api/leaderboard/datasets/:dataset/tasks', async (req, res) => {
  try {
    const { dataset } = req.params;
    const tasks = await getTasksForDataset(dataset);
    res.json(tasks);
  } catch (error) {
    console.error('Error serving tasks for dataset:', error);
    res.status(500).json({ error: 'Failed to fetch tasks for dataset' });
  }
});

// Get datasets for a specific task
app.get('/api/leaderboard/tasks/:task/datasets', async (req, res) => {
  try {
    const { task } = req.params;
    const datasets = await getDatasetsForTask(task);
    res.json(datasets);
  } catch (error) {
    console.error('Error serving datasets for task:', error);
    res.status(500).json({ error: 'Failed to fetch datasets for task' });
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
    
    const paper = await papersDb.get(query, [paperId]);
    
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
    const datasets = await papersDb.all(query);
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
    const tasks = await papersDb.all(query);
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
    const methods = await papersDb.all(query);
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
      const result = await papersDb.get(`SELECT COUNT(*) as count FROM ${table}`);
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
    console.log(`Papers Database: ${papersDbPath}`);
    console.log(`Evaluation Database: ${evaluationDbPath}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});