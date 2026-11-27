import type { ComputeApi } from "./worker";

type Method = keyof ComputeApi;

const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let nextId = 0;

worker.onmessage = ({ data: { id, result, error } }) => {
  const call = pending.get(id)!;
  pending.delete(id);
  if (error === undefined) call.resolve(result);
  else call.reject(new Error(error));
};

/** Call a method of the compute worker; calls run one at a time, in order. */
export function compute<M extends Method>(
  method: M,
  ...args: Parameters<ComputeApi[M]>
): Promise<ReturnType<ComputeApi[M]>> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    worker.postMessage({ id, method, args });
  });
}
