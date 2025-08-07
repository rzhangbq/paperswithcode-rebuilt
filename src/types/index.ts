// Core data types based on Papers with Code API structure
export interface Paper {
  id: string;
  paper_url?: string;
  arxiv_id?: string;
  nips_id?: string;
  openreview_id?: string;
  url_abs?: string;
  url_pdf?: string;
  title: string;
  abstract: string;
  short_abstract?: string;
  authors: string[];
  published: string;
  conference?: string;
  conference_url_abs?: string;
  conference_url_pdf?: string;
  proceeding?: string;
  reproduces_paper?: string;
}

export interface CodeLink {
  id?: string;
  paper_url?: string;
  paper_title: string;
  paper_arxiv_id?: string;
  paper_url_abs?: string;
  paper_url_pdf?: string;
  repo_url: string;
  mentioned_in_paper: boolean;
  mentioned_in_github?: boolean;
  is_official: boolean;
}

export interface EvaluationTable {
  id: string;
  paper: string;
  dataset: string;
  task: string;
  metrics: Record<string, number | string>;
  model_name: string;
  paper_title: string;
  paper_url: string;
  authors?: string[];
  date?: string;
  conference?: string;
}

export interface Method {
  name: string;
  full_name: string;
  description: string;
  paper: string;
  paper_title: string;
  categories: string[];
  introduced_year: number;
}

export interface Dataset {
  name: string;
  full_name: string;
  description: string;
  url: string;
  tasks: string[];
  languages: string[];
  modalities: string[];
  size: string;
  paper: string;
  paper_title: string;
  introduced_year: number;
}

export interface SearchFilters {
  query: string;
  task?: string;
  dataset?: string;
  method?: string;
  year?: number;
  conference?: string;
}