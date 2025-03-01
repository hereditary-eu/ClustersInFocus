interface ClusterGroups {
  [clusterId: number]: number[];  // Array of data point indices for each cluster
}

export class LocalStorageService {
  static generateCacheKey(feature1: string, feature2: string): string {
    const [f1, f2] = [feature1, feature2].sort();
    return `kmeans-${f1}-${f2}`;
  }

  static getClusters(feature1: string, feature2: string): ClusterGroups | null {
    const cacheKey = this.generateCacheKey(feature1, feature2);
    const cachedResults = localStorage.getItem(cacheKey);
    return cachedResults ? JSON.parse(cachedResults) : null;
  }

  static saveClusters(feature1: string, feature2: string, clusterGroups: ClusterGroups): void {
    const cacheKey = this.generateCacheKey(feature1, feature2);
    localStorage.setItem(cacheKey, JSON.stringify(clusterGroups));
  }

  static getAllClusteredFeaturePairs(): Array<{ feature1: string, feature2: string }> {
    const pairs: Array<{ feature1: string, feature2: string }> = [];
    
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Check if this is a kmeans cache key
      if (key?.startsWith('kmeans-')) {
        // Extract feature names from the key (format: 'kmeans-feature1-feature2')
        const [_, feature1, feature2] = key.split('-');
        if (feature1 && feature2) {
          pairs.push({ feature1, feature2 });
        }
      }
    }
    
    return pairs;
  }
} 