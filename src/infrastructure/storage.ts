import {
  CLOUD_CHUNK_SIZE,
  CLOUD_META_KEY,
  CLOUD_PREFIX,
  DEVICE_KEY,
  STORAGE_KEY,
  STORAGE_TIMEOUT_MS,
  SYNC_TIMEOUT_MS,
} from "../constants";
import type { AppState, TelegramStorage } from "../types";
import { chunkText, once, withTimeout } from "../utils/async";
import { normalizeState } from "../state/normalize";

export type SyncResult = "local" | "synced" | "failed";

export interface StorageTargets {
  deviceStorage: TelegramStorage | null;
  cloudStorage: TelegramStorage | null;
}

export function loadLocalState(): AppState | null {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function loadDeviceState(storage: TelegramStorage | null): Promise<AppState | null> {
  if (!storage) return null;
  const raw = await storageGet(storage, DEVICE_KEY);
  return parseState(raw);
}

export async function loadCloudState(storage: TelegramStorage | null): Promise<AppState | null> {
  if (!storage) return null;

  const meta = parseJson(await storageGet(storage, CLOUD_META_KEY));
  if (!meta?.chunks) return null;

  const keys = Array.from({ length: Number(meta.chunks) }, (_, index) => cloudChunkKey(index));
  const chunks = await Promise.all(keys.map((key) => storageGet(storage, key)));
  return parseState(chunks.join(""));
}

export function saveLocalState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}

export async function syncTelegramStores(
  state: AppState,
  targets: StorageTargets,
): Promise<SyncResult> {
  const serialized = serializeState(state);
  const jobs: Promise<boolean>[] = [];

  if (targets.deviceStorage) jobs.push(storageSet(targets.deviceStorage, DEVICE_KEY, serialized));
  if (targets.cloudStorage) jobs.push(saveCloudState(targets.cloudStorage, serialized, state.updatedAt));

  if (!jobs.length) return "local";

  const results = await Promise.allSettled(
    jobs.map((job) => withTimeout(job, SYNC_TIMEOUT_MS, false)),
  );
  const hasSuccess = results.some((result) => result.status === "fulfilled" && result.value);
  return hasSuccess ? "synced" : "failed";
}

export function parseJson(raw: unknown): any | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function serializeState(state: AppState): string {
  return JSON.stringify(state);
}

function parseState(raw: unknown): AppState | null {
  const parsed = parseJson(raw);
  return parsed ? normalizeState(parsed) : null;
}

async function saveCloudState(
  storage: TelegramStorage,
  serialized: string,
  updatedAt: string,
): Promise<boolean> {
  const chunks = chunkText(serialized, CLOUD_CHUNK_SIZE);
  const oldMeta = parseJson(await storageGet(storage, CLOUD_META_KEY));
  const oldChunkCount = Number(oldMeta?.chunks || 0);

  const chunkResults = await Promise.all(
    chunks.map((chunk, index) => storageSet(storage, cloudChunkKey(index), chunk)),
  );
  if (chunkResults.some((ok) => !ok)) return false;

  const staleKeys: string[] = [];
  for (let index = chunks.length; index < oldChunkCount; index += 1) {
    staleKeys.push(cloudChunkKey(index));
  }
  await Promise.all(staleKeys.map((key) => storageRemove(storage, key)));

  return storageSet(storage, CLOUD_META_KEY, JSON.stringify({ chunks: chunks.length, updatedAt }));
}

function storageGet(storage: TelegramStorage, key: string): Promise<string> {
  return new Promise((resolve) => {
    const finish = once(resolve);
    const timer = window.setTimeout(() => finish(""), STORAGE_TIMEOUT_MS);

    try {
      storage.getItem(key, (error, value) => {
        window.clearTimeout(timer);
        finish(error ? "" : value || "");
      });
    } catch {
      window.clearTimeout(timer);
      finish("");
    }
  });
}

function storageSet(storage: TelegramStorage, key: string, value: string): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = once(resolve);
    const timer = window.setTimeout(() => finish(false), STORAGE_TIMEOUT_MS);

    try {
      storage.setItem(key, value, (error, ok) => {
        window.clearTimeout(timer);
        finish(!error && ok !== false);
      });
    } catch {
      window.clearTimeout(timer);
      finish(false);
    }
  });
}

function storageRemove(storage: TelegramStorage, key: string): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = once(resolve);
    const timer = window.setTimeout(() => finish(false), STORAGE_TIMEOUT_MS);

    try {
      storage.removeItem(key, (error, ok) => {
        window.clearTimeout(timer);
        finish(!error && ok !== false);
      });
    } catch {
      window.clearTimeout(timer);
      finish(false);
    }
  });
}

function cloudChunkKey(index: number): string {
  return `${CLOUD_PREFIX}_${index}`;
}

