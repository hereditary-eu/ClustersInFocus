// Basic data types
export interface DataRow {
  [key: string]: string | number | null; // Each row is an object with string keys and string/number/null values
}

export interface DataState {
  fileId?: string;
  fileName?: string;
  csvData: DataRow[];
  columns: string[];
}

// Shapley values
export interface ShapleyValueItem {
  feature: string;
  "SHAP Value": number;
}

// Clustering types
export type ClusteringAlgorithm = "kmeans" | "dbscan";

export interface ClusteringParams {
  kmeans: {
    k: number;
    maxIterations: number;
  };
  dbscan: {
    eps: number;
    minSamples: number;
  };
}

export interface ClusterSimilarityResponse {
  feature1: string;
  feature2: string;
  cluster_id: number;
  similarity: number;
}

export interface ClusteringResult {
  feature1: string;
  feature2: string;
  clusters: Record<number, number[]>;
}

// Dataset related types
export interface DatasetInfo {
  name: string;
  hash?: string; // Optional as hash is added after backend computation
}

export interface ServerDataset {
  id: string;
  filename: string;
}

// API Client types
export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiClientError extends Error {
  statusCode?: number;
  response?: Response;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface HyperparamModalProps {
  algorithm: ClusteringAlgorithm;
  params: ClusteringParams[ClusteringAlgorithm];
  onClose: () => void;
  onSave: (params: ClusteringParams[ClusteringAlgorithm]) => void;
}
