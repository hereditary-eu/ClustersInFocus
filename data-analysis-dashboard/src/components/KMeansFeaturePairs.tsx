import { useState, useCallback } from 'react';
import { kmeans } from 'ml-kmeans';

interface DataRow {
  [key: string]: string | number;
}

interface KMeansFeaturePairsProps {
  csvData: DataRow[];
  columns: string[];
  k: number;
}

// Helper function to generate consistent cache key for feature pairs
export function generateCacheKey(feature1: string, feature2: string, k: number): string {
  // Sort features alphabetically to ensure consistent key regardless of order
  const [f1, f2] = [feature1, feature2].sort();
  return `kmeans-${f1}-${f2}-k${k}`;
}

export function KMeansFeaturePairs({ csvData, columns, k }: KMeansFeaturePairsProps) {
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);

  const computeKMeans = useCallback(async () => {
    setIsComputing(true);
    setProgress(0);
    
    const dataset = csvData.map(row => 
      columns.map(col => Number(row[col]))
    );
    
    const totalPairs = (columns.length * (columns.length - 1)) / 2;
    let completedPairs = 0;
    
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const featurePairData = dataset.map(row => [row[i], row[j]]);
        const cacheKey = generateCacheKey(columns[i], columns[j], k);
        
        const cachedResults = localStorage.getItem(cacheKey);
        if (!cachedResults) {
          const { clusters } = kmeans(featurePairData, k, { maxIterations: 1000 });
          localStorage.setItem(cacheKey, JSON.stringify(clusters));
        }
        
        completedPairs++;
        setProgress((completedPairs / totalPairs) * 100);
        
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    setIsComputing(false);
  }, [csvData, columns, k]);

  return (
    <>
      <button
        onClick={computeKMeans}
        disabled={isComputing}
        className="kmeans-button"
      >
        {isComputing ? `Computing... ${Math.round(progress)}%` : 'Compute K-Means Clusters'}
      </button>

      {isComputing && (
        <div className="kmeans-modal">
          <div className="kmeans-modal-content">
            <h3>Computing K-Means Clusters</h3>
            <div className="kmeans-progress-bar-container">
              <div 
                className="kmeans-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p>{Math.round(progress)}%</p>
          </div>
        </div>
      )}
    </>
  );
}

// Simplified helper function without hashing
export function getClustersByFeaturePair(
  feature1: string, 
  feature2: string, 
  k: number
): number[] | null {
  const cacheKey = generateCacheKey(feature1, feature2, k);
  const cachedResults = localStorage.getItem(cacheKey);
  return cachedResults ? JSON.parse(cachedResults) : null;
}