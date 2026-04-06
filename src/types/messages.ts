import type { Capture } from "./capture";
import type { MockRule } from "./mock";
import type { AppState } from "./state";

export type Message =
  | { type: "CAPTURE_RESPONSE"; payload: Omit<Capture, "id"> }
  | { type: "GET_MOCK_RULES"; payload: { hostname: string } }
  | { type: "MOCK_RULES_RESPONSE"; payload: MockRule[] }
  | { type: "TOGGLE_CAPTURE"; payload: { enabled: boolean; environmentId?: string } }
  | { type: "TOGGLE_MOCKING"; payload: { enabled: boolean } }
  | { type: "STATE_CHANGED"; payload: AppState };

export const MSG = {
  CAPTURE_RESPONSE: "CAPTURE_RESPONSE",
  GET_MOCK_RULES: "GET_MOCK_RULES",
  MOCK_RULES_RESPONSE: "MOCK_RULES_RESPONSE",
  TOGGLE_CAPTURE: "TOGGLE_CAPTURE",
  TOGGLE_MOCKING: "TOGGLE_MOCKING",
  STATE_CHANGED: "STATE_CHANGED",
} as const;
