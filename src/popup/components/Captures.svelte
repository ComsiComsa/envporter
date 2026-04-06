<script lang="ts">
  import type { Capture, Environment, MockRule } from "../../types";

  interface Props {
    captures: Capture[];
    environments: Environment[];
    mocks: MockRule[];
  }

  let { captures, environments, mocks }: Props = $props();

  let filterEnvId = $state<string>("");
  let showMockDialog = $state(false);
  let selectedCapture = $state<Capture | null>(null);
  let targetEnvId = $state<string>("");

  const filtered = $derived(
    filterEnvId ? captures.filter((c) => c.environmentId === filterEnvId) : captures
  );

  function envName(id: string): string {
    return environments.find((e) => e.id === id)?.name ?? "Unknown";
  }

  function envColor(id: string): string {
    return environments.find((e) => e.id === id)?.color ?? "#999";
  }

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function methodColor(method: string): string {
    switch (method) {
      case "GET": return "text-green-600";
      case "POST": return "text-blue-600";
      case "PUT": return "text-orange-600";
      case "DELETE": return "text-red-600";
      default: return "text-gray-600";
    }
  }

  function openMockDialog(capture: Capture) {
    selectedCapture = capture;
    targetEnvId = environments.find((e) => e.id !== capture.environmentId)?.id ?? "";
    showMockDialog = true;
  }

  async function createMock() {
    if (!selectedCapture || !targetEnvId) return;

    const current = (await chrome.storage.local.get("mocks")).mocks ?? [];
    current.push({
      id: crypto.randomUUID(),
      captureId: selectedCapture.id,
      targetEnvironmentId: targetEnvId,
      method: selectedCapture.method,
      pathname: selectedCapture.pathname,
      enabled: true,
      mode: "full" as const,
      responseBody: selectedCapture.responseBody,
      overrides: null,
      statusCode: selectedCapture.statusCode,
      createdAt: Date.now(),
    });

    await chrome.storage.local.set({ mocks: current });
    showMockDialog = false;
    selectedCapture = null;
  }

  async function deleteCapture(id: string) {
    const current = (await chrome.storage.local.get("captures")).captures ?? [];
    await chrome.storage.local.set({
      captures: current.filter((c: Capture) => c.id !== id),
    });
  }

  async function clearAll() {
    await chrome.storage.local.set({ captures: [] });
  }
</script>

{#if showMockDialog && selectedCapture}
  <div class="space-y-3 p-3 bg-white rounded border border-teal-200">
    <h3 class="text-xs font-medium">Create Mock from Capture</h3>
    <div class="text-[10px] text-gray-500">
      <span class={methodColor(selectedCapture.method)}>{selectedCapture.method}</span>
      {selectedCapture.pathname}
    </div>
    <div>
      <label class="block text-[10px] text-gray-500 mb-1" for="target-env">Target environment</label>
      <select
        id="target-env"
        bind:value={targetEnvId}
        class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      >
        {#each environments.filter((e) => e.id !== selectedCapture?.environmentId) as env}
          <option value={env.id}>{env.name}</option>
        {/each}
      </select>
    </div>
    <div class="flex gap-2">
      <button
        class="flex-1 bg-teal-600 text-white text-xs py-1.5 rounded hover:bg-teal-700"
        onclick={createMock}
      >
        Create Mock
      </button>
      <button
        class="flex-1 bg-gray-200 text-gray-700 text-xs py-1.5 rounded hover:bg-gray-300"
        onclick={() => (showMockDialog = false)}
      >
        Cancel
      </button>
    </div>
  </div>
{:else}
  <!-- Filter -->
  {#if environments.length > 0}
    <div class="mb-2">
      <select
        bind:value={filterEnvId}
        class="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white"
      >
        <option value="">All environments</option>
        {#each environments as env}
          <option value={env.id}>{env.name}</option>
        {/each}
      </select>
    </div>
  {/if}

  <div class="space-y-1.5">
    {#each filtered as capture (capture.id)}
      <div class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
        <span
          class="w-2 h-2 rounded-full shrink-0"
          style="background-color: {envColor(capture.environmentId)}"
        ></span>
        <span class="text-[10px] font-mono {methodColor(capture.method)} w-8 shrink-0">
          {capture.method}
        </span>
        <span class="text-xs truncate flex-1 font-mono">{capture.pathname}</span>
        <span class="text-[10px] text-gray-400 shrink-0">{capture.statusCode}</span>
        <span class="text-[10px] text-gray-300 shrink-0">{timeAgo(capture.capturedAt)}</span>
        <button
          class="text-[10px] text-teal-600 hover:text-teal-800 shrink-0"
          onclick={() => openMockDialog(capture)}
          title="Create mock from this capture"
        >
          Mock
        </button>
        <button
          class="text-[10px] text-gray-400 hover:text-red-500 shrink-0"
          onclick={() => deleteCapture(capture.id)}
        >
          x
        </button>
      </div>
    {/each}

    {#if filtered.length === 0}
      <p class="text-center text-gray-400 text-xs py-4">
        No captures yet. Enable capture on an environment and make API calls.
      </p>
    {/if}

    {#if captures.length > 0}
      <button
        class="w-full text-xs text-gray-400 hover:text-red-500 py-1"
        onclick={clearAll}
      >
        Clear all captures
      </button>
    {/if}
  </div>
{/if}
