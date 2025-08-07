import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Paper, CodeLink, EvaluationTable, Method, Dataset } from '../types';

export const usePapers = (searchQuery?: string, page = 1, limit = 20) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = searchQuery 
          ? await api.searchPapers(searchQuery, page, limit)
          : await api.getPapers(page, limit);
        setPapers(result.papers);
        setPagination(result.pagination);
      } catch (err) {
        setError('Failed to fetch papers');
        console.error('Error fetching papers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [searchQuery, page, limit]);

  return { papers, pagination, loading, error };
};

export const useCodeLinks = (page = 1, limit = 20) => {
  const [codeLinks, setCodeLinks] = useState<CodeLink[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCodeLinks = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await api.getCodeLinks(page, limit);
        setCodeLinks(result.codeLinks);
        setPagination(result.pagination);
      } catch (err) {
        setError('Failed to fetch code links');
        console.error('Error fetching code links:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCodeLinks();
  }, [page, limit]);

  return { codeLinks, pagination, loading, error };
};

export const useLeaderboard = (dataset: string, task: string) => {
  const [evaluations, setEvaluations] = useState<EvaluationTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!dataset || !task) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await api.getLeaderboard(dataset, task);
        setEvaluations(data);
      } catch (err) {
        setError('Failed to fetch leaderboard');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [dataset, task]);

  return { evaluations, loading, error };
};

export const useDatasets = (page = 1, limit = 20) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await api.getDatasets(page, limit);
        setDatasets(result.datasets);
        setPagination(result.pagination);
      } catch (err) {
        setError('Failed to fetch datasets');
        console.error('Error fetching datasets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [page, limit]);

  return { datasets, pagination, loading, error };
};

export const useMethods = (page = 1, limit = 20) => {
  const [methods, setMethods] = useState<Method[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await api.getMethods(page, limit);
        setMethods(result.methods);
        setPagination(result.pagination);
      } catch (err) {
        setError('Failed to fetch methods');
        console.error('Error fetching methods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, [page, limit]);

  return { methods, pagination, loading, error };
};