const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ROUTES = {
  clustering: {
    compute: `${BASE_API_URL}/clustering/compute`,
    similarities: `${BASE_API_URL}/clustering/similarities`,
  },
  
  analysis: {
    ping: `${BASE_API_URL}/analysis/ping`, // debug
  },
};