import Papa from "papaparse";
import { DataRow, DatasetInfo } from "../types";

/** Ships with the app (frontend/public), so it can be loaded but not deleted. */
export const EXAMPLE_DATASET: DatasetInfo = { id: "example", name: "parkinsonsdata.csv" };

function inferColumnType(values: unknown[]): "number" | "string" {
  return values.filter((v) => v !== null && v !== "" && v !== undefined).every((v) => !isNaN(Number(v)))
    ? "number"
    : "string";
}

/** Parse a CSV file (or CSV text) into typed rows; empty cells become null. */
function parseCSV(source: File | string): Promise<{ data: DataRow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(source, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data: rawData }) => {
        if (rawData.length === 0) return reject(new Error("No data found in file"));
        const headers = Object.keys(rawData[0]);
        if (headers.length === 0) return reject(new Error("No valid headers found in the file"));

        const types = Object.fromEntries(headers.map((h) => [h, inferColumnType(rawData.map((row) => row[h]))]));
        const data: DataRow[] = rawData
          .filter((row) => Object.values(row).some((v) => v !== null && v !== "" && v !== undefined))
          .map((row) => {
            const out: DataRow = {};
            for (const h of headers) {
              const v = row[h];
              if (v === null || v === undefined || v === "") out[h] = null;
              else if (types[h] === "number") out[h] = isNaN(Number(v)) ? null : Number(v);
              else out[h] = String(v).trim() || null;
            }
            return out;
          });
        if (data.length === 0) return reject(new Error("No valid data rows found after processing"));
        resolve({ data, headers });
      },
      error: (error: Error) => reject(error),
    });
  });
}

// Saved datasets live in this browser's IndexedDB: "datasets" holds {id, name} for the list,
// "rows" holds each dataset's {data, headers} under the same id.
let opened: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  opened ??= new Promise((resolve, reject) => {
    const req = indexedDB.open("clusters-in-focus", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("datasets", { keyPath: "id", autoIncrement: true });
      req.result.createObjectStore("rows");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opened;
}

async function transaction<T>(
  mode: IDBTransactionMode,
  run: (datasets: IDBObjectStore, rows: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const tx = (await db()).transaction(["datasets", "rows"], mode);
  const req = run(tx.objectStore("datasets"), tx.objectStore("rows"));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

export class FileService {
  static parseCSVFile(file: File) {
    return parseCSV(file);
  }

  static async saveDataset(name: string, data: DataRow[], headers: string[]): Promise<DatasetInfo> {
    const id = await transaction("readwrite", (datasets, rows) => {
      const req = datasets.add({ name });
      req.onsuccess = () => rows.put({ data, headers }, req.result);
      return req;
    });
    return { id: id as number, name };
  }

  static async getDataset(dataset: DatasetInfo): Promise<{ data: DataRow[]; headers: string[] }> {
    if (dataset.id === EXAMPLE_DATASET.id) {
      const response = await fetch(import.meta.env.BASE_URL.replace(/\/?$/, "/") + EXAMPLE_DATASET.name);
      if (!response.ok) throw new Error(`Could not load ${EXAMPLE_DATASET.name}`);
      return parseCSV(await response.text());
    }
    const stored = await transaction("readonly", (_, rows) => rows.get(dataset.id));
    if (!stored) throw new Error(`Dataset ${dataset.name} not found`);
    return stored;
  }

  static async deleteDataset(dataset: DatasetInfo): Promise<void> {
    await transaction("readwrite", (datasets, rows) => {
      rows.delete(dataset.id);
      return datasets.delete(dataset.id);
    });
  }

  /** The bundled example first, then this browser's saved datasets. */
  static async getAllDatasets(): Promise<DatasetInfo[]> {
    try {
      return [EXAMPLE_DATASET, ...(await transaction("readonly", (datasets) => datasets.getAll()))];
    } catch {
      return [EXAMPLE_DATASET]; // IndexedDB unavailable, e.g. blocked site data
    }
  }
}
