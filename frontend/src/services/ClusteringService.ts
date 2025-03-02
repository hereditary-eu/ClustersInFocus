import { API_ROUTES } from './ApiRoutes';
import { ApiClient } from './ApiClient';
import { ShapleyValueItem, DataRow } from '../types';

export type ClusteringAlgorithm = 'kmeans' | 'dbscan';

export interface ClusteringParams {
  kmeans: {
    k: number;
    maxIterations: number;
  };
  dbscan: {
    eps: number;
    minSamples: number;
  };
  // Add more algorithm params here later
}

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
        params: algorithm === 'kmeans' ? {
          k: (params as ClusteringParams['kmeans']).k,
          max_iterations: (params as ClusteringParams['kmeans']).maxIterations
        } : {
          eps: (params as ClusteringParams['dbscan']).eps,
          min_samples: (params as ClusteringParams['dbscan']).minSamples
        }
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

  static async getClustersByFeatures(
    feature1: string,
    feature2: string
  ): Promise<Record<number, number[]> | null> {
    try {
      const url = `${API_ROUTES.clustering.getByFeatures}?feature1=${feature1}&feature2=${feature2}`;
      return await ApiClient.get<Record<number, number[]> | null>(url);
    } catch (error) {
      console.error('Error fetching clusters:', error);
      return null;
    }
  }

  static async computeShapleyValues(
    targetColumn: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    try {
      onProgress(10); // Initial progress
      
      const requestData = {
        target_column: targetColumn
      };
      
      await ApiClient.post(API_ROUTES.shapley.compute, requestData);
      
      onProgress(100); // Complete
    } catch (error) {
      console.error('Error computing Shapley values:', error);
      throw error;
    }
  }

  static async getShapleyValues(targetColumn: string): Promise<ShapleyValueItem[] | null> {
    try {
      const url = `${API_ROUTES.shapley.getValues}/${targetColumn}`;
      return await ApiClient.get<ShapleyValueItem[] | null>(url);
    } catch (error) {
      console.error('Error fetching Shapley values:', error);
      return null;
    }
  }
}