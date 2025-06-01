// // Service for caching dataset information in localStorage
// import { DatasetInfo, ServerDataset } from '../types';

// export class LocalStorageService {
//   private static readonly DATASET_PREFIX = 'dataset-';

//   static saveDataset(name: string, hash?: string): void {
//     const datasetInfo: DatasetInfo = { name };
//     if (hash) {
//       datasetInfo.hash = hash;
//     }
//     localStorage.setItem(this.DATASET_PREFIX + name, JSON.stringify(datasetInfo));
//   }

//   static updateDatasetHash(name: string, hash: string): void {
//     const datasetKey = this.DATASET_PREFIX + name;
//     const datasetJson = localStorage.getItem(datasetKey);

//     if (datasetJson) {
//       const dataset: DatasetInfo = JSON.parse(datasetJson);
//       dataset.hash = hash;
//       localStorage.setItem(datasetKey, JSON.stringify(dataset));
//     }
//   }

//   static getDataset(name: string): DatasetInfo | null {
//     const datasetJson = localStorage.getItem(this.DATASET_PREFIX + name);
//     return datasetJson ? JSON.parse(datasetJson) : null;
//   }

//   static getDatasetByHash(hash: string): DatasetInfo | null {
//     for (let i = 0; i < localStorage.length; i++) {
//       const key = localStorage.key(i);
//       if (key?.startsWith(this.DATASET_PREFIX)) {
//         const datasetJson = localStorage.getItem(key);
//         if (datasetJson) {
//           const dataset: DatasetInfo = JSON.parse(datasetJson);
//           if (dataset.hash === hash) {
//             return dataset;
//           }
//         }
//       }
//     }
//     return null;
//   }

//   static getAllDatasets(): DatasetInfo[] {
//     const datasets: DatasetInfo[] = [];

//     for (let i = 0; i < localStorage.length; i++) {
//       const key = localStorage.key(i);
//       if (key?.startsWith(this.DATASET_PREFIX)) {
//         const datasetJson = localStorage.getItem(key);
//         if (datasetJson) {
//           datasets.push(JSON.parse(datasetJson));
//         }
//       }
//     }

//     return datasets;
//   }

//   static removeDataset(name: string): void {
//     localStorage.removeItem(this.DATASET_PREFIX + name);
//   }

//   /**
//    * Synchronize localStorage with the server by removing datasets that no longer exist on the server.
//    * This helps maintain consistency when datasets are deleted by other clients.
//    *
//    * @param getAllDatasetsFn Function to get all datasets from the server
//    */
//   static async synchronizeWithServer(
//     getAllDatasetsFn: () => Promise<ServerDataset[]>
//   ): Promise<void> {
//     try {
//       // Get all datasets from the server
//       const serverDatasets = await getAllDatasetsFn();
//       const serverDatasetIds = new Set(serverDatasets.map(d => d.id));

//       // Get all datasets from localStorage
//       const localDatasets = this.getAllDatasets();

//       // Remove datasets from localStorage that no longer exist on the server
//       for (const dataset of localDatasets) {
//         if (dataset.hash && !serverDatasetIds.has(dataset.hash)) {
//           this.removeDataset(dataset.name);
//           console.log(`Removed dataset ${dataset.name} from localStorage as it no longer exists on the server`);
//         }
//       }
//     } catch (error) {
//       console.error('Error synchronizing with server:', error);
//     }
//   }
// }
