import { API_ROUTES } from './ApiRoutes';
import { ApiClient } from './ApiClient';
import { 
  ShapleyValueItem, 
  DataRow, 
  ClusteringAlgorithm, 
  ClusteringParams, 
  ClusterSimilarityResponse,
  ClusteringResult
} from '../types';

export const DEFAULT_PARAMS: ClusteringParams = {
  kmeans: {
    k: 3,
    maxIterations: 1000
  },
  dbscan: {
    eps: 0.5,
    minSamples: 2
  }
};

export class ClusteringService {
  static async computeFeaturePairsClusters(
    csvData: DataRow[],
    columns: string[],
    algorithm: ClusteringAlgorithm,
    params: ClusteringParams[typeof algorithm],
    onProgress: (progress: number) => void,
    fileId?: string,
    fileName?: string
  ): Promise<void> {
    try {
      onProgress(25); // 25%, todo: add actual progress (websocket?)
      
      const requestData = {
        data: csvData,
        columns: columns,
        algorithm: algorithm,
        params: algorithm === 'kmeans' ? {
          k: (params as ClusteringParams['kmeans']).k,
          max_iterations: (params as ClusteringParams['kmeans']).maxIterations
        } : {
          eps: (params as ClusteringParams['dbscan']).eps,
          min_samples: (params as ClusteringParams['dbscan']).minSamples
        },
        dataset_id: fileId,  // Include the dataset ID if available
        filename: fileName    // Include filename for saving if dataset doesn't exist
      };
      
      await ApiClient.post(API_ROUTES.clustering.compute, requestData);
      
      onProgress(100); // 100%, todo: add actual progress (websocket?)

    } catch (error) {
      console.error('Error computing clusters:', error);
      throw error;
    }
  }

  static async getClusterSimilarities(
    selectedFeature1: string,
    selectedFeature2: string,
    selectedClusterId: number,
    datasetId: string
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
        selected_cluster_id: selectedClusterId,
        dataset_id: datasetId
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

  static async getClustersByFeatures(
    feature1: string,
    feature2: string,
    datasetId: string,
    data?: Record<string, any>[]
  ): Promise<Record<number, number[]> | null> {
    try {
      // Check if both features are numeric if data is provided
      if (data && data.length > 0) {
        const isNumericColumn = (column: string): boolean => {
          // Check a sample of values (up to 100) to see if they're all numeric
          const sampleSize = Math.min(100, data.length);
          
          for (let i = 0; i < sampleSize; i++) {
            const value = data[i][column];
            // Skip null values
            if (value === null || value === undefined) continue;
            
            // If any non-null value is not a number, return false
            if (typeof value !== 'number' && isNaN(Number(value))) {
              console.log(`Column ${column} contains non-numeric value: ${value}`);
              return false;
            }
          }
          return true;
        };
        
        // Check both columns
        if (!isNumericColumn(feature1) || !isNumericColumn(feature2)) {
          console.log(`Skipping cluster request for non-numeric columns: ${feature1}, ${feature2}`);
          return null;
        }
      }
      
      // Only proceed with the request if both columns are numeric
      const url = `${API_ROUTES.clustering.getByFeatures}?dataset_id=${datasetId}&feature1=${feature1}&feature2=${feature2}`;
      return await ApiClient.get<Record<number, number[]> | null>(url);
    } catch (error) {
      console.error('Error fetching clusters:', error);
      return null;
    }
  }

  static async checkExistingClusters(datasetId: string): Promise<ClusteringResult[] | null> {
    try {
      if (!datasetId) {
        return null;
      }
      
      const url = `${API_ROUTES.clustering.getAllFeaturePairs}?dataset_id=${datasetId}`;
      const response = await ApiClient.get<ClusteringResult[]>(url);
      
      return response && response.length > 0 ? response : null;
    } catch (error) {
      console.error('Error checking for existing clusters:', error);
      return null;
    }
  }

  static async computeShapleyValues(
    targetColumn: string,
    datasetId: string,
    onProgress: (progress: number) => void,
    data?: DataRow[],
    fileName?: string
  ): Promise<void> {
    try {
      onProgress(25); // Initial progress
      
      const requestData = {
        target_column: targetColumn,
        dataset_id: datasetId,
        data: data,        // Include the data in case dataset doesn't exist
        filename: fileName  // Include filename for saving if dataset doesn't exist
      };
      
      await ApiClient.post(API_ROUTES.shapley.compute, requestData);
      
      onProgress(100); // Complete
    } catch (error) {
      console.error('Error computing Shapley values:', error);
      throw error;
    }
  }

  static async getShapleyValues(targetColumn: string, datasetId: string): Promise<ShapleyValueItem[] | null> {
    try {
      const url = `${API_ROUTES.shapley.getValues}/${datasetId}/${targetColumn}`;
      return await ApiClient.get<ShapleyValueItem[] | null>(url);
    } catch (error) {
      console.error('Error fetching Shapley values:', error);
      return null;
    }
  }
}