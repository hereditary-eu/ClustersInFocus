import { kmeans } from 'ml-kmeans';
import { LocalStorageService } from './LocalStorageService';

interface DataRow {
  [key: string]: string | number;
}

export type ClusteringAlgorithm = 'kmeans';

export interface ClusteringParams {
  kmeans: {
    k: number;
    maxIterations: number;
  };
  // Add more algorithm params here later
}

export const DEFAULT_PARAMS: ClusteringParams = {
  kmeans: {
    k: 3,
    maxIterations: 1000
  }
};

export class ClusteringService {
  static async computeFeaturePairsClusters(
    csvData: DataRow[],
    columns: string[],
    algorithm: ClusteringAlgorithm,
    params: ClusteringParams[typeof algorithm],
    onProgress: (progress: number) => void
  ): Promise<void> {
    const dataset = csvData.map(row => 
      columns.map(col => Number(row[col]))
    );
    
    const totalPairs = (columns.length * (columns.length - 1)) / 2;
    let completedPairs = 0;
    
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const featurePairData = dataset.map(row => [row[i], row[j]]);
        
        const { clusters } = kmeans(featurePairData, params.k, { 
          maxIterations: params.maxIterations 
        });

        const clusterGroups: { [key: number]: number[] } = {};
        clusters.forEach((cluster, dataPointIndex) => {
          if (!clusterGroups[cluster]) {
            clusterGroups[cluster] = [];
          }
          clusterGroups[cluster].push(dataPointIndex);
        });

        LocalStorageService.saveClusters(columns[i], columns[j], clusterGroups);
        
        completedPairs++;
        onProgress((completedPairs / totalPairs) * 100);
        
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
} 