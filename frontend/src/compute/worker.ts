// Runs the Rust/wasm compute crate (compute/) off the main thread. Holds one Workspace: the loaded dataset.
import init, { Workspace, reorder } from "./pkg/cif_compute.js";

let workspace: Workspace | undefined;
const ready = init();

const api = {
  load(data: Float64Array, nRows: number, nCols: number) {
    workspace?.free();
    workspace = new Workspace(data, nRows, nCols);
  },
  reorder,
};

self.onmessage = async ({ data: { id, method, args } }: MessageEvent) => {
  try {
    await ready;
    const target = (method in api ? api : workspace) as Record<string, (...a: unknown[]) => unknown> | undefined;
    if (!target) throw new Error("No dataset loaded");
    self.postMessage({ id, result: target[method](...args) });
  } catch (e) {
    // the crate's errors arrive as plain strings
    self.postMessage({ id, error: e instanceof Error ? e.message : String(e) });
  }
};

export type ComputeApi = typeof api &
  Pick<Workspace, "kmeans" | "dbscan" | "labels" | "similarities" | "matrix" | "shap">;
