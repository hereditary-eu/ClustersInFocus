import { create } from 'zustand';
import { DataState, DataRow, ShapleyValueItem } from '../types';

interface AppState {
  // Data state
  selectedColumns: string[];
  data: DataState;
  hiddenColumns: string[];
  shapleyValues: ShapleyValueItem[] | null;
  
  // UI state
  isDataTableExpanded: boolean;
  expandedPanel: string | null;
  dataViewMode: "numerical" | "heatmap";
  selectedCluster: number | null;
}

interface AppActions {
  // Data actions
  setSelectedColumns: (columns: string[]) => void;
  setData: (data: DataState) => void;
  setHiddenColumns: (columns: string[]) => void;
  addHiddenColumn: (column: string) => void;
  removeHiddenColumn: (column: string) => void;
  setShapleyValues: (values: ShapleyValueItem[] | null) => void;
  
  // UI actions
  setIsDataTableExpanded: (expanded: boolean) => void;
  setExpandedPanel: (panel: string | null) => void;
  setDataViewMode: (mode: "numerical" | "heatmap") => void;
  setSelectedCluster: (cluster: number | null) => void;
  
  // Composite actions
  handleFileUpload: (fileName: string, csvData: DataRow[], headers: string[], fileId?: string) => void;
  resetState: () => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  selectedColumns: [],
  data: {
    fileName: "",
    csvData: [],
    columns: [],
    fileId: "",
  },
  hiddenColumns: [],
  shapleyValues: null,
  isDataTableExpanded: true,
  expandedPanel: null,
  dataViewMode: "numerical",
  selectedCluster: null,
};

export const useAppStore = create<AppStore>()((set) => ({
  ...initialState,
  
  // Data actions
  setSelectedColumns: (columns) => set({ selectedColumns: columns.slice().sort() }),
  setData: (data) => set({ data }),
  setHiddenColumns: (columns) => set({ hiddenColumns: columns }),
  addHiddenColumn: (column) => set((state) => ({ 
    hiddenColumns: [...state.hiddenColumns, column] 
  })),
  removeHiddenColumn: (column) => set((state) => ({ 
    hiddenColumns: state.hiddenColumns.filter((col) => col !== column) 
  })),
  setShapleyValues: (values) => set({ shapleyValues: values }),
  
  // UI actions
  setIsDataTableExpanded: (expanded) => set({ isDataTableExpanded: expanded }),
  setExpandedPanel: (panel) => set({ expandedPanel: panel }),
  setDataViewMode: (mode) => set({ dataViewMode: mode }),
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  
  // Composite actions
  handleFileUpload: (fileName, csvData, headers, fileId) => set(() => ({
    // Reset UI state when loading a new dataset
    expandedPanel: null,
    selectedColumns: [],
    selectedCluster: null,
    shapleyValues: null,
    
    // Update data state
    data: {
      fileId: fileId,
      fileName: fileName,
      csvData: csvData,
      columns: headers,
    }
  })),
  
  resetState: () => set(initialState),
}));

// Optimized selectors
export const useDataState = () => useAppStore((state) => ({
  data: state.data,
  selectedColumns: state.selectedColumns,
  selectedCluster: state.selectedCluster,
  shapleyValues: state.shapleyValues,
}));

export const useUIState = () => useAppStore((state) => ({
  expandedPanel: state.expandedPanel,
  isDataTableExpanded: state.isDataTableExpanded,
  dataViewMode: state.dataViewMode,
  hiddenColumns: state.hiddenColumns,
}));

export const useDataActions = () => useAppStore((state) => ({
  setSelectedColumns: state.setSelectedColumns,
  setData: state.setData,
  setShapleyValues: state.setShapleyValues,
  handleFileUpload: state.handleFileUpload,
}));

export const useUIActions = () => useAppStore((state) => ({
  setExpandedPanel: state.setExpandedPanel,
  setIsDataTableExpanded: state.setIsDataTableExpanded,
  setDataViewMode: state.setDataViewMode,
  setSelectedCluster: state.setSelectedCluster,
  addHiddenColumn: state.addHiddenColumn,
  removeHiddenColumn: state.removeHiddenColumn,
}));