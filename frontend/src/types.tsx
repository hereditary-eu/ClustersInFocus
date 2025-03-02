
export interface DataRow {
    [key: string]: string | number;  // Each row is an object with string keys and string/number values
  }
  
export interface DataState {
csvData: DataRow[];
columns: string[];
}

export type ColumnType = 'number' | 'string' | 'mixed';

export type PanelId = 'left' | 'middle' | 'right';



export interface ShapleyValueItem {
    feature: string;
    'SHAP Value': number;
}