import { API_ROUTES } from './ApiRoutes';
import { ApiClient } from './ApiClient';

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

// export class ClusteringService {
//   static async computeFeaturePairsClusters(
//     csvData: DataRow[],
//     columns: string[],
//     algorithm: ClusteringAlgorithm,
//     params: ClusteringParams[typeof algorithm],
//     onProgress: (progress: number) => void
//   ): Promise<void> {
//     const dataset = csvData.map(row => 
//       columns.map(col => Number(row[col]))
//     );
    
//     const totalPairs = (columns.length * (columns.length - 1)) / 2;
//     let completedPairs = 0;
    
//     for (let i = 0; i < columns.length; i++) {
//       for (let j = i + 1; j < columns.length; j++) {
//         const featurePairData = dataset.map(row => [row[i], row[j]]);
        
//         const { clusters } = kmeans(featurePairData, params.k, { 
//           maxIterations: params.maxIterations 
//         });

//         const clusterGroups: { [key: number]: number[] } = {};
//         clusters.forEach((cluster, dataPointIndex) => {
//           if (!clusterGroups[cluster]) {
//             clusterGroups[cluster] = [];
//           }
//           clusterGroups[cluster].push(dataPointIndex);
//         });

//         LocalStorageService.saveClusters(columns[i], columns[j], clusterGroups);
        
//         completedPairs++;
//         onProgress((completedPairs / totalPairs) * 100);
        
//         await new Promise(resolve => setTimeout(resolve, 0));
//       }
//     }
//   }

//   static calculateJaccardIndex(set1: number[], set2: number[]): number {
//     const intersection = set1.filter(x => set2.includes(x));
//     const union = Array.from(new Set([...set1, ...set2]));
//     return intersection.length / union.length;
//   }

//   static getClusterSimilarities(
//     selectedFeature1: string,
//     selectedFeature2: string,
//     selectedClusterId: number
//   ): Array<{
//     feature1: string,
//     feature2: string,
//     clusterId: number,
//     similarity: number
//   }> {
//     // Get the selected cluster's data points
//     const selectedClusterGroups = LocalStorageService.getClusters(selectedFeature1, selectedFeature2) ?? {};
//     const selectedClusterPoints = selectedClusterGroups[selectedClusterId] || [];
    
//     const results: Array<{
//       feature1: string,
//       feature2: string,
//       clusterId: number,
//       similarity: number
//     }> = [];

//     // Get all stored feature pairs
//     const allFeaturePairs = LocalStorageService.getAllClusteredFeaturePairs();

//     // Compare with all other clusters
//     for (const pair of allFeaturePairs) {
//       const { feature1, feature2 } = pair;
//       const clusterGroups = LocalStorageService.getClusters(feature1, feature2);
      
//       // Skip comparing with itself
//       if (feature1 === selectedFeature1 && feature2 === selectedFeature2) continue;

//       // Skip if no clusters found
//       if (!clusterGroups) continue;
      
//       // Calculate Jaccard index for each cluster in this feature pair
//       Object.entries(clusterGroups).forEach(([clusterId, clusterPoints]) => {
//         const similarity = this.calculateJaccardIndex(selectedClusterPoints, clusterPoints);
//         results.push({
//           feature1,
//           feature2,
//           clusterId: Number(clusterId),
//           similarity
//         });
//       });
//     }

//     // Sort by similarity in descending order
//     return results.sort((a, b) => b.similarity - a.similarity);
//   }
// } 

interface ClusterSimilarityResponse {
  feature1: string;
  feature2: string;
  cluster_id: number;
  similarity: number;
}

export class ClusteringService {
  static async computeFeaturePairsClusters(
    csvData: DataRow[],
    columns: string[],
    algorithm: ClusteringAlgorithm,
    params: ClusteringParams[typeof algorithm],
    onProgress: (progress: number) => void
  ): Promise<void> {
    try {
      onProgress(10); // 10%, todo: add actual progress (websocket?)
      
      const requestData = {
        data: csvData,
        columns: columns,
        algorithm: algorithm,
        params: {
          k: params.k,
          max_iterations: params.maxIterations
        }
      };
      
      // Use the API client
      await ApiClient.post(API_ROUTES.clustering.compute, requestData);
      
      // Completed
      onProgress(100); // 100%, todo: add actual progress (websocket?)

    } catch (error) {
      console.error('Error computing clusters:', error);
      throw error;
    }
  }

  static async getClusterSimilarities(
    selectedFeature1: string,
    selectedFeature2: string,
    selectedClusterId: number
  ): Promise<Array<{
    feature1: string,
    feature2: string,
    cluster_id: number,
    similarity: number
  }>> {
    try {
      const requestData = {
        selected_feature1: selectedFeature1,
        selected_feature2: selectedFeature2,
        selected_cluster_id: selectedClusterId
      };
      
      const responseData = await ApiClient.post<ClusterSimilarityResponse[]>(
        API_ROUTES.clustering.similarities, 
        requestData
      );
      
      // Transform response to match frontend expected format
      return responseData.map((item: ClusterSimilarityResponse) => ({
        feature1: item.feature1,
        feature2: item.feature2,
        cluster_id: item.cluster_id,
        similarity: item.similarity
      }));
      
    } catch (error) {
      console.error('Error getting similarities:', error);
      throw error;
    }
  }
}