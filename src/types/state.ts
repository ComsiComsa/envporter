export interface AppState {
  captureEnabled: boolean;
  activeEnvironmentId: string | null;
  mockingEnabled: boolean;
}

export const DEFAULT_STATE: AppState = {
  captureEnabled: false,
  activeEnvironmentId: null,
  mockingEnabled: true,
};
