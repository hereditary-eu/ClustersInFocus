const BASE_API_URL = 'http://localhost:8000';

export const API_ROUTES = {
  dataset: {
    upload: `${BASE_API_URL}/dataset/upload`,
    getById: (id: string) => `${BASE_API_URL}/dataset/${id}`,
    deleteById: (id: string) => `${BASE_API_URL}/dataset/${id}`,
    getAll: `${BASE_API_URL}/dataset/all`,
  },

  clustering: {
    compute: `${BASE_API_URL}/clustering/compute`,
    similarities: `${BASE_API_URL}/clustering/similarities`,
    getByFeatures: `${BASE_API_URL}/clustering/get_by_features`,
    getAllFeaturePairs: `${BASE_API_URL}/clustering/get_all_clustered_feature_pairs`,
  },
  
  shapley: {
    compute: `${BASE_API_URL}/shapley/compute_shap_values`,
    getValues: `${BASE_API_URL}/shapley/get_shapley_values`,
  },
};