<script lang="ts">
  import type { MockRule, Environment } from "../../types";

  interface Props {
    mocks: MockRule[];
    environments: Environment[];
  }

  let { mocks, environments }: Props = $props();

  function envName(id: string): string {
    return environments.find((e) => e.id === id)?.name ?? "Unknown";
  }

  function envColor(id: string): string {
    return environments.find((e) => e.id === id)?.color ?? "#999";
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

  async function toggleMock(id: string) {
    const current: MockRule[] = (await chrome.storage.local.get("mocks")).mocks ?? [];
    const idx = current.findIndex((m) => m.id === id);
    if (idx >= 0) {
      current[idx].enabled = !current[idx].enabled;
      await chrome.storage.local.set({ mocks: current });
    }
  }

  async function deleteMock(id: string) {
    const current: MockRule[] = (await chrome.storage.local.get("mocks")).mocks ?? [];
    await chrome.storage.local.set({
      mocks: current.filter((m) => m.id !== id),
    });
  }
</script>

<div class="space-y-1.5">
  {#each mocks as mock (mock.id)}
    <div
      class="p-2 bg-white rounded border border-gray-200 {mock.enabled
        ? ''
        : 'opacity-50'}"
    >
      <div class="flex items-center gap-2">
        <button
          class="w-8 h-4 rounded-full relative cursor-pointer transition-colors {mock.enabled
            ? 'bg-teal-500'
            : 'bg-gray-300'}"
          onclick={() => toggleMock(mock.id)}
          title={mock.enabled ? "Disable mock" : "Enable mock"}
        >
          <span
            class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform {mock.enabled
              ? 'left-4'
              : 'left-0.5'}"
          ></span>
        </button>
        <span class="text-[10px] font-mono {methodColor(mock.method)} w-8 shrink-0">
          {mock.method}
        </span>
        <span class="text-xs font-mono truncate flex-1">{mock.pathname}</span>
        <span class="text-[10px] text-gray-400">{mock.statusCode}</span>
        <button
          class="text-[10px] text-gray-400 hover:text-red-500"
          onclick={() => deleteMock(mock.id)}
        >
          x
        </button>
      </div>
      <div class="flex items-center gap-1 mt-1">
        <span
          class="w-2 h-2 rounded-full"
          style="background-color: {envColor(mock.targetEnvironmentId)}"
        ></span>
        <span class="text-[10px] text-gray-400">
          {envName(mock.targetEnvironmentId)}
        </span>
        <span class="text-[10px] text-gray-300 ml-auto">{mock.mode}</span>
      </div>
    </div>
  {/each}

  {#if mocks.length === 0}
    <p class="text-center text-gray-400 text-xs py-4">
      No mock rules yet. Capture a response and create a mock from it.
    </p>
  {/if}
</div>
