import type { Environment, Capture, MockRule, AppState } from "../types";
import { DEFAULT_STATE } from "../types";

interface StorageSchema {
  environments: Environment[];
  captures: Capture[];
  mocks: MockRule[];
  state: AppState;
}

type StorageKey = keyof StorageSchema;

async function get<K extends StorageKey>(key: K): Promise<StorageSchema[K]> {
  const defaults: StorageSchema = {
    environments: [],
    captures: [],
    mocks: [],
    state: DEFAULT_STATE,
  };
  const result = await chrome.storage.local.get(key);
  return (result[key] as StorageSchema[K]) ?? defaults[key];
}

async function set<K extends StorageKey>(
  key: K,
  value: StorageSchema[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// Environments
export async function getEnvironments(): Promise<Environment[]> {
  return get("environments");
}

export async function saveEnvironments(envs: Environment[]): Promise<void> {
  return set("environments", envs);
}

export async function findEnvironmentByHost(
  hostname: string
): Promise<Environment | undefined> {
  const envs = await getEnvironments();
  return envs.find((e) => hostname.includes(e.urlPattern));
}

// Captures
export async function getCaptures(): Promise<Capture[]> {
  return get("captures");
}

export async function addCapture(capture: Capture): Promise<void> {
  const captures = await getCaptures();
  captures.unshift(capture);
  return set("captures", captures);
}

export async function deleteCapture(id: string): Promise<void> {
  const captures = await getCaptures();
  return set(
    "captures",
    captures.filter((c) => c.id !== id)
  );
}

export async function clearCaptures(): Promise<void> {
  return set("captures", []);
}

// Mocks
export async function getMocks(): Promise<MockRule[]> {
  return get("mocks");
}

export async function saveMocks(mocks: MockRule[]): Promise<void> {
  return set("mocks", mocks);
}

export async function getMocksForEnvironment(
  environmentId: string
): Promise<MockRule[]> {
  const mocks = await getMocks();
  return mocks.filter((m) => m.targetEnvironmentId === environmentId && m.enabled);
}

// State
export async function getState(): Promise<AppState> {
  return get("state");
}

export async function setState(state: Partial<AppState>): Promise<void> {
  const current = await getState();
  return set("state", { ...current, ...state });
}
