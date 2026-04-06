/**
 * EnvPorter — Injected page script
 * Runs in the page's JS context. Monkey-patches fetch and XHR
 * to capture responses and serve mock data.
 */

const ENVPORTER_SOURCE = "envporter-content";
const INJECTED_SOURCE = "envporter-injected";
const MAX_BODY_SIZE = 1_000_000; // 1MB

// Domains to never intercept — auth providers that cause CORS issues on redirects
const SKIP_DOMAINS = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "auth0.com",
  "cognito-idp.",
  "okta.com",
  "iap.googleapis.com",
];

function shouldSkip(url) {
  try {
    var hostname = new URL(url).hostname;
    return SKIP_DOMAINS.some(function (d) { return hostname.includes(d); });
  } catch {
    return false;
  }
}

// Read config from meta tag
function readConfig() {
  var meta = document.querySelector('meta[name="envporter-config"]');
  if (!meta) return { rules: [], captureEnabled: false, activeEnvironmentId: null, environmentId: null };
  try {
    return JSON.parse(meta.getAttribute("content") || "{}");
  } catch {
    return { rules: [], captureEnabled: false, activeEnvironmentId: null, environmentId: null };
  }
}

var config = readConfig();

// Listen for config updates from content script
window.addEventListener("message", function (event) {
  if (event.source !== window || !event.data || event.data.source !== ENVPORTER_SOURCE) return;
  if (event.data.type === "STATE_CHANGED") {
    config = Object.assign({}, config, event.data.payload);
  }
});

function sendCapture(data) {
  if (!config.captureEnabled || !config.environmentId) return;
  if (data.responseBody.length > MAX_BODY_SIZE) return;

  // Only capture JSON responses
  var ct = data.responseHeaders["content-type"] || "";
  if (!ct.includes("application/json")) return;

  window.postMessage(
    {
      source: INJECTED_SOURCE,
      type: "CAPTURE_RESPONSE",
      payload: {
        environmentId: config.environmentId,
        method: data.method,
        url: data.url,
        pathname: data.pathname,
        statusCode: data.statusCode,
        responseHeaders: data.responseHeaders,
        responseBody: data.responseBody,
        capturedAt: Date.now(),
      },
    },
    "*"
  );
}

function findMockRule(method, pathname) {
  return config.rules.find(
    function (r) { return r.method === method && r.pathname === pathname; }
  );
}

function createMockResponse(rule) {
  return new Response(rule.responseBody, {
    status: rule.statusCode,
    headers: { "content-type": "application/json" },
  });
}

// --- Monkey-patch fetch ---

var originalFetch = window.fetch;
var pageOrigin = window.location.origin;

window.fetch = function (input, init) {
  var requestUrl;
  try {
    requestUrl = new URL(typeof input === "string" ? input : input.url, pageOrigin);
  } catch {
    return originalFetch.call(window, input, init);
  }

  // Never touch auth provider requests
  if (shouldSkip(requestUrl.href)) {
    return originalFetch.call(window, input, init);
  }

  var method = (init && init.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
  var pathname = requestUrl.pathname;

  // Check mock rules
  var mockRule = findMockRule(method, pathname);
  if (mockRule && mockRule.mode === "full") {
    return Promise.resolve(createMockResponse(mockRule));
  }

  // Execute real request, capture on success
  return originalFetch.call(window, input, init).then(function (response) {
    if (config.captureEnabled && config.environmentId && response.ok) {
      try {
        var clone = response.clone();
        clone.text().then(function (body) {
          var headers = {};
          clone.headers.forEach(function (v, k) { headers[k] = v; });
          sendCapture({
            method: method,
            url: requestUrl.href,
            pathname: pathname,
            statusCode: clone.status,
            responseHeaders: headers,
            responseBody: body,
          });
        }).catch(function () {});
      } catch (e) {}
    }
    return response;
  });
};

// --- Monkey-patch XMLHttpRequest ---

var originalOpen = XMLHttpRequest.prototype.open;
var originalSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url) {
  this._ep_method = method.toUpperCase();
  this._ep_url = String(url);
  return originalOpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function (body) {
  var xhr = this;
  var method = xhr._ep_method;

  // Skip auth domains
  if (shouldSkip(xhr._ep_url)) {
    return originalSend.call(this, body);
  }

  var pathname;
  try {
    pathname = new URL(xhr._ep_url, window.location.origin).pathname;
  } catch {
    return originalSend.call(this, body);
  }

  // Check mock rules
  var mockRule = findMockRule(method, pathname);
  if (mockRule && mockRule.mode === "full") {
    Object.defineProperty(this, "readyState", { value: 4, writable: false });
    Object.defineProperty(this, "status", { value: mockRule.statusCode, writable: false });
    Object.defineProperty(this, "responseText", { value: mockRule.responseBody, writable: false });
    Object.defineProperty(this, "response", { value: mockRule.responseBody, writable: false });
    this.dispatchEvent(new Event("readystatechange"));
    this.dispatchEvent(new Event("load"));
    this.dispatchEvent(new Event("loadend"));
    return;
  }

  // Capture on load
  this.addEventListener("load", function () {
    if (!config.captureEnabled || !config.environmentId) return;
    if (this.status < 200 || this.status >= 300) return; // only capture success
    try {
      var responseText =
        typeof this.response === "string"
          ? this.response
          : JSON.stringify(this.response);

      sendCapture({
        method: method,
        url: xhr._ep_url,
        pathname: pathname,
        statusCode: this.status,
        responseHeaders: parseXHRHeaders(this.getAllResponseHeaders()),
        responseBody: responseText,
      });
    } catch (e) {}
  });

  return originalSend.call(this, body);
};

function parseXHRHeaders(raw) {
  var headers = {};
  var lines = raw.trim().split(/[\r\n]+/);
  for (var i = 0; i < lines.length; i++) {
    var idx = lines[i].indexOf(":");
    if (idx > 0) {
      headers[lines[i].slice(0, idx).trim().toLowerCase()] = lines[i].slice(idx + 1).trim();
    }
  }
  return headers;
}

console.log("[EnvPorter] Injected script loaded — monitoring fetch/XHR");
