import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Paper, CodeLink, EvaluationTable, Method, Dataset } from '../types';

export const usePapers = (searchQuery?: string) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = searchQuery 
          ? await api.searchPapers(searchQuery)
          : await api.getPapers();
        setPapers(data);
      } catch (err) {
        setError('Failed to fetch papers');
        console.error('Error fetching papers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [searchQuery]);

  return { papers, loading, error };
};

export const useCodeLinks = () => {
  const [codeLinks, setCodeLinks] = useState<CodeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCodeLinks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCodeLinks();
        setCodeLinks(data);
      } catch (err) {
        setError('Failed to fetch code links');
        console.error('Error fetching code links:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCodeLinks();
  }, []);

  return { codeLinks, loading, error };
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

export const useDatasets = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getDatasets();
        setDatasets(data);
      } catch (err) {
        setError('Failed to fetch datasets');
        console.error('Error fetching datasets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  return { datasets, loading, error };
};

export const useMethods = () => {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getMethods();
        setMethods(data);
      } catch (err) {
        setError('Failed to fetch methods');
        console.error('Error fetching methods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, []);

  return { methods, loading, error };
};