import axios from 'axios';
import { Paper, CodeLink, EvaluationTable, Method, Dataset } from '../types';

// Backend API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Pagination response interface
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

class PapersWithCodeAPI {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  private async fetchPaginatedData<T>(endpoint: string, page = 1, limit = 20): Promise<PaginatedResponse<T>> {
    const cacheKey = `${endpoint}_${page}_${limit}`;
    const now = Date.now();
    
    // Check cache with TTL
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }
    
    try {
      const response = await axios.get<PaginatedResponse<T>>(`${API_BASE_URL}/${endpoint}`, {
        params: { page, limit }
      });
      
      this.cache.set(cacheKey, { data: response.data, timestamp: now });
      return response.data;
    } catch (error) {
      console.error(`Failed to load data from ${endpoint}:`, error);
      throw error;
    }
  }

  async getPapers(page = 1, limit = 20): Promise<{ papers: Paper[], pagination: any }> {
    const response = await this.fetchPaginatedData<Paper>('papers', page, limit);
    return {
      papers: response.data,
      pagination: response.pagination
    };
  }

  async searchPapers(query: string, page = 1, limit = 20): Promise<{ papers: Paper[], pagination: any }> {
    const cacheKey = `search_${query}_${page}_${limit}`;
    const now = Date.now();
    
    // Check cache with TTL
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }
    
    try {
      const response = await axios.get<PaginatedResponse<Paper>>(`${API_BASE_URL}/papers/search`, {
        params: { q: query, page, limit }
      });
      
      const result = {
        papers: response.data.data,
        pagination: response.data.pagination
      };
      
      this.cache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch (error) {
      console.error('Error searching papers:', error);
      throw error;
    }
  }

  async getCodeLinks(page = 1, limit = 20): Promise<{ codeLinks: CodeLink[], pagination: any }> {
    const response = await this.fetchPaginatedData<CodeLink>('code-links', page, limit);
    return {
      codeLinks: response.data,
      pagination: response.pagination
    };
  }

  async getCodeLinksForPapers(paperUrls: string[]): Promise<CodeLink[]> {
    try {
      const response = await axios.post<CodeLink[]>(`${API_BASE_URL}/code-links/for-papers`, {
        paperUrls
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching code links for papers:', error);
      throw error;
    }
  }

  async getEvaluationTables(page = 1, limit = 20): Promise<{ evaluations: EvaluationTable[], pagination: any }> {
    const response = await this.fetchPaginatedData<EvaluationTable>('evaluations', page, limit);
    return {
      evaluations: response.data,
      pagination: response.pagination
    };
  }

  async getMethods(page = 1, limit = 20): Promise<{ methods: Method[], pagination: any }> {
    const response = await this.fetchPaginatedData<Method>('methods', page, limit);
    return {
      methods: response.data,
      pagination: response.pagination
    };
  }

  async getDatasets(page = 1, limit = 20): Promise<{ datasets: Dataset[], pagination: any }> {
    const response = await this.fetchPaginatedData<Dataset>('datasets', page, limit);
    return {
      datasets: response.data,
      pagination: response.pagination
    };
  }

  async getLeaderboard(dataset: string, task: string): Promise<EvaluationTable[]> {
    try {
      const response = await axios.get<EvaluationTable[]>(`${API_BASE_URL}/leaderboard`, {
        params: { dataset, task }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async getAvailableDatasets(): Promise<any[]> {
    try {
      const response = await axios.get<any[]>(`${API_BASE_URL}/leaderboard/datasets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available datasets:', error);
      throw error;
    }
  }

  async getAvailableTasks(dataset?: string): Promise<string[]> {
    try {
      const params = dataset ? { dataset } : {};
      const response = await axios.get<string[]>(`${API_BASE_URL}/leaderboard/tasks`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching available tasks:', error);
      throw error;
    }
  }

  async getTasksForDataset(dataset: string): Promise<Array<{ name: string; paper_count: number }>> {
    try {
      const response = await axios.get<Array<{ name: string; paper_count: number }>>(`${API_BASE_URL}/leaderboard/datasets/${encodeURIComponent(dataset)}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks for dataset:', error);
      throw error;
    }
  }

  async getDatasetsForTask(task: string): Promise<Array<{ name: string; full_name: string; paper_count: number }>> {
    try {
      const response = await axios.get<Array<{ name: string; full_name: string; paper_count: number }>>(`${API_BASE_URL}/leaderboard/tasks/${encodeURIComponent(task)}/datasets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching datasets for task:', error);
      throw error;
    }
  }
}

export const api = new PapersWithCodeAPI();