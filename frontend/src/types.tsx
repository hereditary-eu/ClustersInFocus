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

// Dataset related types
export interface DatasetInfo {
  id: number | "example"; // IndexedDB key, or the bundled example
  name: string;
}

export interface HyperparamModalProps {
  algorithm: ClusteringAlgorithm;
  params: ClusteringParams[ClusteringAlgorithm];
  onClose: () => void;
  onSave: (params: ClusteringParams[ClusteringAlgorithm]) => void;
}
