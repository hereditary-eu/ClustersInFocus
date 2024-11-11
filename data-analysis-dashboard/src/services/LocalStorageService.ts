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
} 