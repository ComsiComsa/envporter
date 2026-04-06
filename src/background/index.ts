import { MSG } from "../types";
import type { Message, Capture } from "../types";
import {
  addCapture,
  getCaptures,
  getMocks,
  findEnvironmentByHost,
  getMocksForEnvironment,
  getState,
  setState,
} from "../lib/storage";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // keep channel open for async response
});

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case MSG.CAPTURE_RESPONSE: {
      const capture: Capture = {
        ...message.payload,
        id: crypto.randomUUID(),
      };
      await addCapture(capture);
      await updateBadge();
      return { ok: true, id: capture.id };
    }

    case MSG.GET_MOCK_RULES: {
      const { hostname } = message.payload;
      const state = await getState();
      if (!state.mockingEnabled) return { rules: [] };

      const env = await findEnvironmentByHost(hostname);
      if (!env) return { rules: [] };

      const rules = await getMocksForEnvironment(env.id);
      return {
        rules,
        captureEnabled: state.captureEnabled,
        activeEnvironmentId: state.activeEnvironmentId,
        environmentId: env.id,
      };
    }

    case MSG.TOGGLE_CAPTURE: {
      await setState({
        captureEnabled: message.payload.enabled,
        activeEnvironmentId: message.payload.environmentId ?? null,
      });
      await updateBadge();
      return { ok: true };
    }

    case MSG.TOGGLE_MOCKING: {
      await setState({ mockingEnabled: message.payload.enabled });
      await updateBadge();
      return { ok: true };
    }

    default:
      return { error: "Unknown message type" };
  }
}

async function updateBadge(): Promise<void> {
  const state = await getState();
  const mocks = await getMocks();
  const hasActiveMocks = state.mockingEnabled && mocks.some((m) => m.enabled);

  if (state.captureEnabled) {
    chrome.action.setBadgeText({ text: "REC" });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444" });
  } else if (hasActiveMocks) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#3B82F6" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Auto-prune captures older than 7 days
async function pruneOldCaptures() {
  const captures = await getCaptures();
  const cutoff = Date.now() - SEVEN_DAYS;
  const fresh = captures.filter((c) => c.capturedAt > cutoff);
  if (fresh.length < captures.length) {
    await chrome.storage.local.set({ captures: fresh });
  }
}

// Initialize
updateBadge();
pruneOldCaptures();

// Run prune periodically via alarm
chrome.alarms.create("prune-captures", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "prune-captures") pruneOldCaptures();
});

console.log("[EnvPorter] Background service worker loaded");
