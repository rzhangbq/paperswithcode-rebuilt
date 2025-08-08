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
  id: number;
  url?: string;
  name: string;
  full_name: string;
  description: string;
  paper_title?: string;
  paper_url?: string;
  introduced_year?: number;
  source_url?: string;
  source_title?: string;
  code_snippet_url?: string;
  num_papers?: number;
  categories: string[];
  areas: string[];
}

export interface MethodCategory {
  name: string;
  method_count: number;
  paper_count: number;
}

export interface MethodArea {
  name: string;
  categories: MethodCategory[];
}

export interface MethodsHierarchy {
  [areaName: string]: MethodCategory[];
}

export interface Dataset {
  id: number;
  name: string;
  full_name: string;
  description: string;
  short_description: string;
  url: string;
  homepage: string;
  image: string;
  parent_dataset?: string;
}

export interface SearchFilters {
  query: string;
  task?: string;
  dataset?: string;
  method?: string;
  year?: number;
  conference?: string;
}