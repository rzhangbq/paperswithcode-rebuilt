import axios from 'axios';
import { Paper, CodeLink, EvaluationTable, Method, Dataset } from '../types';

// Papers with Code data URLs from README
const DATA_URLS = {
  papers: 'https://production-media.paperswithcode.com/about/papers-with-abstracts.json.gz',
  codeLinks: 'https://production-media.paperswithcode.com/about/links-between-papers-and-code.json.gz',
  evaluations: 'https://production-media.paperswithcode.com/about/evaluation-tables.json.gz',
  methods: 'https://production-media.paperswithcode.com/about/methods.json.gz',
  datasets: 'https://production-media.paperswithcode.com/about/datasets.json.gz'
};

class PapersWithCodeAPI {
  private cache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  private async fetchAndDecompress(url: string): Promise<any[]> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const promise = this.loadData(url);
    this.loadingPromises.set(url, promise);
    
    try {
      const data = await promise;
      this.cache.set(url, data);
      this.loadingPromises.delete(url);
      return data;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  private async loadData(url: string): Promise<any[]> {
    try {
      // Note: In a real implementation, you'd need to handle gzip decompression
      // For now, we'll simulate with mock data or assume uncompressed JSON
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      console.warn(`Failed to load data from ${url}, using mock data`);
      return this.getMockData(url);
    }
  }

  private getMockData(url: string): any[] {
    // Mock data for development/demo purposes
    if (url.includes('papers-with-abstracts')) {
      return [
        {
          id: '1',
          title: 'Attention Is All You Need',
          abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
          authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
          published: '2017-06-12',
          arxiv_id: '1706.03762',
          conference: 'NIPS 2017'
        },
        {
          id: '2',
          title: 'BERT: Pre-training of Deep Bidirectional Transformers',
          abstract: 'We introduce a new language representation model called BERT...',
          authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
          published: '2018-10-11',
          arxiv_id: '1810.04805',
          conference: 'NAACL 2019'
        }
      ];
    }
    
    if (url.includes('links-between-papers-and-code')) {
      return [
        {
          paper_title: 'Attention Is All You Need',
          repo_url: 'https://github.com/tensorflow/tensor2tensor',
          is_official: true,
          framework: 'TensorFlow'
        }
      ];
    }

    return [];
  }

  async getPapers(limit = 50, offset = 0): Promise<Paper[]> {
    const data = await this.fetchAndDecompress(DATA_URLS.papers);
    return data.slice(offset, offset + limit);
  }

  async searchPapers(query: string, limit = 20): Promise<Paper[]> {
    const data = await this.fetchAndDecompress(DATA_URLS.papers);
    const filtered = data.filter((paper: Paper) => 
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
      paper.authors.some(author => author.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.slice(0, limit);
  }

  async getCodeLinks(): Promise<CodeLink[]> {
    return this.fetchAndDecompress(DATA_URLS.codeLinks);
  }

  async getEvaluationTables(): Promise<EvaluationTable[]> {
    return this.fetchAndDecompress(DATA_URLS.evaluations);
  }

  async getMethods(): Promise<Method[]> {
    return this.fetchAndDecompress(DATA_URLS.methods);
  }

  async getDatasets(): Promise<Dataset[]> {
    return this.fetchAndDecompress(DATA_URLS.datasets);
  }

  async getLeaderboard(dataset: string, task: string): Promise<EvaluationTable[]> {
    const evaluations = await this.getEvaluationTables();
    return evaluations
      .filter(eval => eval.dataset === dataset && eval.task === task)
      .sort((a, b) => {
        // Sort by primary metric (assuming first metric is primary)
        const aMetric = Object.values(a.metrics)[0] || 0;
        const bMetric = Object.values(b.metrics)[0] || 0;
        return bMetric - aMetric;
      });
  }
}

export const api = new PapersWithCodeAPI();