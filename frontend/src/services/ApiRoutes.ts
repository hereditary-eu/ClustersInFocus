const BASE_API_URL = 'http://localhost:8000';

export const API_ROUTES = {
  clustering: {
    compute: `${BASE_API_URL}/clustering/compute`,
    similarities: `${BASE_API_URL}/clustering/similarities`,
    getByFeatures: `${BASE_API_URL}/clustering/get_by_features`,
  },
  
  shapley: {
    compute: `${BASE_API_URL}/shapley/compute_shap_values`,
    getValues: `${BASE_API_URL}/shapley/get_shapley_values`,
  },
};