import { compute } from "../compute/client";
import { useAppStore } from "../stores/useAppStore";
import { ShapleyValueItem, DataRow, ClusteringAlgorithm, ClusteringParams, ClusterSimilarityResponse } from "../types";

export const DEFAULT_PARAMS: ClusteringParams = {
  kmeans: {
    k: 3,
    maxIterations: 1000,
  },
  dbscan: {
    eps: 0.5,
    minSamples: 2,
  },
};

export interface FeaturePairMatrix {
  features: string[];
  similarities: number[][];
  stats: { min_similarity: number; max_similarity: number; size: number };
}

/** The dataset and columns currently held by the compute worker. */
let loaded: { data: DataRow[]; columns: string[] } | null = null;

async function ensureLoaded(data: DataRow[], columns: string[]) {
  if (loaded?.data === data && loaded.columns.join("\0") === columns.join("\0")) return;
  const n = data.length;
  const values = new Float64Array(n * columns.length);
  columns.forEach((column, j) =>
    data.forEach((row, i) => {
      const v = row[column];
      values[j * n + i] = v === null || v === "" ? NaN : Number(v);
    }),
  );
  loaded = null;
  await compute("load", values, n, columns.length);
  loaded = { data, columns };
}

/** Column indices of a feature pair, or null when no clusters exist for the dataset currently shown. */
function pairIndices(feature1: string, feature2: string): [number, number] | null {
  if (!loaded || loaded.data !== useAppStore.getState().data.csvData) return null;
  const i = loaded.columns.indexOf(feature1);
  const j = loaded.columns.indexOf(feature2);
  return i < 0 || j < 0 ? null : [i, j];
}

export class ClusteringService {
  static async computeFeaturePairsClusters(
    csvData: DataRow[],
    columns: string[],
    algorithm: ClusteringAlgorithm,
    params: ClusteringParams[typeof algorithm],
  ): Promise<void> {
    await ensureLoaded(csvData, columns);
    if (algorithm === "kmeans") {
      const { k, maxIterations } = params as ClusteringParams["kmeans"];
      await compute("kmeans", k, maxIterations);
    } else {
      const { eps, minSamples } = params as ClusteringParams["dbscan"];
      await compute("dbscan", eps, minSamples);
    }
  }

  /** Cluster label per row for a feature pair (-1 is DBSCAN noise), or null if not computed yet. */
  static async getClusterLabels(feature1: string, feature2: string): Promise<number[] | null> {
    const pair = pairIndices(feature1, feature2);
    if (!pair) return null;
    try {
      return Array.from(await compute("labels", ...pair));
    } catch {
      return null;
    }
  }

  static async getClusterSimilarities(
    selectedFeature1: string,
    selectedFeature2: string,
    selectedClusterId: number,
  ): Promise<ClusterSimilarityResponse[]> {
    const pair = pairIndices(selectedFeature1, selectedFeature2);
    if (!pair) throw new Error("No clusters found. Please compute clusters first.");
    const flat = await compute("similarities", ...pair, selectedClusterId);
    const columns = loaded!.columns;
    const out: ClusterSimilarityResponse[] = [];
    for (let k = 0; k < flat.length; k += 4) {
      out.push({
        feature1: columns[flat[k]],
        feature2: columns[flat[k + 1]],
        cluster_id: flat[k + 2],
        similarity: flat[k + 3],
      });
    }
    return out;
  }

  static async getFeaturePairSimilarityMatrix(
    selectedFeature1: string,
    selectedFeature2: string,
    selectedClusterId: number,
    aggregation: string = "max",
    reorderMethod: string = "none",
  ): Promise<FeaturePairMatrix> {
    const pair = pairIndices(selectedFeature1, selectedFeature2);
    if (!pair) throw new Error("No clusters found. Please compute clusters first.");
    const columns = loaded!.columns;
    const n = columns.length;
    const values = await compute("matrix", ...pair, selectedClusterId, aggregation);

    let min = Infinity;
    let max = -Infinity;
    values.forEach((v, k) => {
      if (k % n !== Math.floor(k / n)) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    });

    const order = reorderMethod === "none" ? columns.map((_, i) => i) : Array.from(await compute("reorder", values, n, reorderMethod));
    return {
      features: order.map((i) => columns[i]),
      similarities: order.map((i) => order.map((j) => values[i * n + j])),
      stats: { min_similarity: n > 1 ? min : 0, max_similarity: n > 1 ? max : 1, size: n },
    };
  }

  /** Mean |SHAP| of every other numeric column for predicting `targetColumn`, highest first. */
  static async computeShapleyValues(
    csvData: DataRow[],
    columns: string[],
    targetColumn: string,
  ): Promise<ShapleyValueItem[]> {
    await ensureLoaded(csvData, columns);
    const target = columns.indexOf(targetColumn);
    const importance = await compute("shap", target);
    return columns
      .map((feature, i) => ({ feature, "SHAP Value": importance[i] }))
      .filter((_, i) => i !== target)
      .sort((a, b) => b["SHAP Value"] - a["SHAP Value"]);
  }
}
