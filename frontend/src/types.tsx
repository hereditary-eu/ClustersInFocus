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

export type ColumnType = "number" | "string" | "mixed";

export type PanelId = "left" | "middle" | "right";

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

// Component Props
export interface FileUploadButtonProps {
  onFileLoaded: (fileName: string, data: DataRow[], headers: string[], fileId?: string) => void;
  onClustersFound?: () => void; // Optional callback for when clusters are found
}

export interface ComputeClustersButtonProps {
  csvData: DataRow[];
  columns: string[];
  onClustersComputed: () => void;
  fileId?: string;
  fileName?: string;
}

export interface HyperparamModalProps {
  algorithm: ClusteringAlgorithm;
  params: ClusteringParams[ClusteringAlgorithm];
  onClose: () => void;
  onSave: (params: ClusteringParams[ClusteringAlgorithm]) => void;
}

export interface Panel1DataProps {
  data: DataRow[];
  columns: string[];
  expandedPanel: string | null;
  hiddenColumns: string[];
  isDataTableExpanded: boolean;
  dataViewMode: "numerical" | "heatmap";
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  onColumnHide: (column: string) => void;
  onColumnRestore: (column: string) => void;
  onColumnSelect: (selected: string[]) => void;
  setDataViewMode: (mode: "numerical" | "heatmap") => void;
  setIsDataTableExpanded: (expanded: boolean) => void;
  shapleyValues: ShapleyValueItem[] | null;
}

export interface Panel2ClusteringProps {
  data: DataRow[];
  selectedColumns: string[];
  expandedPanel: string | null;
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  onClusterSelect: (clusterId: number | null) => void;
  fileId?: string;
}

export interface Panel3AnalysisProps {
  expandedPanel: string | null;
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  selectedCluster: number | null;
  selectedColumns: string[];
  onClusterSelect: (clusterId: number | null) => void;
  fileId?: string;
}

export interface HeaderProps {
  onFileUpload: (fileName: string, data: DataRow[], headers: string[], fileId?: string) => void;
  onClustersComputed: () => void;
  onShapleyValuesComputed: (targetColumn: string, fileId: string) => void;
  data?: DataState;
}

export interface DataTableProps {
  data: DataRow[];
  columns: string[];
  hiddenColumns: string[];
  onColumnHide: (column: string) => void;
  onColumnRestore: (column: string) => void;
  onColumnSelect: (selectedColumns: string[]) => void;
  isExpanded: boolean;
  viewMode: "numerical" | "heatmap";
  menuOptions?: {
    canSort?: boolean;
    canHide?: boolean;
  };
  shapleyValues?: ShapleyValueItem[] | null;
}

export interface ColumnMenuProps {
  column: string;
  onSort?: (columnId: string) => void;
  onHide?: (columnId: string) => void;
  sortConfig?: { id: string; desc: boolean } | null;
  menuOptions?: {
    canSort?: boolean;
    canHide?: boolean;
  };
}

export interface HistogramProps {
  data: number[];
  onClose: () => void;
  title: string;
}

export interface ScatterplotClusteredProps {
  data: DataRow[];
  feature1: string;
  feature2: string;
  clusters: Record<number, number[]>;
  width?: number;
  height?: number;
  selectedCluster: number | null;
  onClusterClick: (clusterId: number) => void;
}

export interface SelectedRowDisplayProps {
  row: DataRow | null;
}

export interface ComputeShapleyValuesButtonProps {
  targetColumn: string;
  datasetId: string;
  onComputed: () => void;
}
