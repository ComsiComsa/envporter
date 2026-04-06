import { MSG } from "../types";
import type { Message } from "../types";

const ENVPORTER_SOURCE = "envporter-content";
const INJECTED_SOURCE = "envporter-injected";

// Ask background for mock rules and config for this page
async function init() {
  const hostname = window.location.hostname;

  const response = await chrome.runtime.sendMessage({
    type: MSG.GET_MOCK_RULES,
    payload: { hostname },
  } satisfies Message);

  // Inject the page-level script
  injectPageScript(response);
}

function injectPageScript(config: unknown) {
  // Pass config to the injected script via a data attribute
  const configEl = document.createElement("meta");
  configEl.setAttribute("name", "envporter-config");
  configEl.setAttribute("content", JSON.stringify(config));
  document.documentElement.appendChild(configEl);

  // Inject the script using web_accessible_resources
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/content/injected.js");
  script.type = "module";
  document.documentElement.appendChild(script);
  script.onload = () => script.remove();
}

// Bridge: page context -> background
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.source !== INJECTED_SOURCE) return;

  const { type, payload } = event.data;

  if (type === MSG.CAPTURE_RESPONSE) {
    chrome.runtime.sendMessage({ type, payload } satisfies Message);
  }
});

// Bridge: background -> page context
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === MSG.STATE_CHANGED) {
    window.postMessage(
      { source: ENVPORTER_SOURCE, type: message.type, payload: message.payload },
      "*"
    );
  }
});

init();
