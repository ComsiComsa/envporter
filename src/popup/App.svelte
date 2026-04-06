<script lang="ts">
  import { MSG } from "../types";
  import type { AppState, Environment, Capture, MockRule } from "../types";
  import { DEFAULT_STATE } from "../types";
  import Environments from "./components/Environments.svelte";
  import Captures from "./components/Captures.svelte";
  import Mocks from "./components/Mocks.svelte";

  let activeTab = $state<"environments" | "captures" | "mocks">("environments");
  let appState = $state<AppState>({ ...DEFAULT_STATE });
  let environments = $state<Environment[]>([]);
  let captures = $state<Capture[]>([]);
  let mocks = $state<MockRule[]>([]);

  async function loadData() {
    const result = await chrome.storage.local.get([
      "environments",
      "captures",
      "mocks",
      "state",
    ]);
    environments = result.environments ?? [];
    captures = result.captures ?? [];
    mocks = result.mocks ?? [];
    appState = result.state ?? { ...DEFAULT_STATE };
  }

  loadData();

  // Listen for storage changes
  chrome.storage.onChanged.addListener(() => {
    loadData();
  });

  function toggleCapture(envId: string) {
    const enabling = !(appState.captureEnabled && appState.activeEnvironmentId === envId);
    chrome.runtime.sendMessage({
      type: MSG.TOGGLE_CAPTURE,
      payload: {
        enabled: enabling,
        environmentId: enabling ? envId : undefined,
      },
    });
  }

  function toggleMocking() {
    chrome.runtime.sendMessage({
      type: MSG.TOGGLE_MOCKING,
      payload: { enabled: !appState.mockingEnabled },
    });
  }

  const tabs = [
    { id: "environments" as const, label: "Envs", count: () => environments.length },
    { id: "captures" as const, label: "Captures", count: () => captures.length },
    { id: "mocks" as const, label: "Mocks", count: () => mocks.length },
  ];
</script>

<main class="w-[400px] min-h-[500px] bg-gray-50 text-gray-900 text-sm">
  <!-- Header -->
  <header class="bg-teal-600 text-white px-4 py-3 flex items-center justify-between">
    <h1 class="font-bold text-base">EnvPorter</h1>
    <button
      class="text-xs px-2 py-1 rounded {appState.mockingEnabled
        ? 'bg-teal-700 hover:bg-teal-800'
        : 'bg-gray-500 hover:bg-gray-600'}"
      onclick={toggleMocking}
    >
      {appState.mockingEnabled ? "Mocking ON" : "Mocking OFF"}
    </button>
  </header>

  <!-- Tabs -->
  <nav class="flex border-b border-gray-200 bg-white">
    {#each tabs as tab}
      <button
        class="flex-1 px-3 py-2 text-center text-xs font-medium transition-colors
          {activeTab === tab.id
          ? 'border-b-2 border-teal-600 text-teal-600'
          : 'text-gray-500 hover:text-gray-700'}"
        onclick={() => (activeTab = tab.id)}
      >
        {tab.label}
        <span class="ml-1 text-gray-400">({tab.count()})</span>
      </button>
    {/each}
  </nav>

  <!-- Content -->
  <div class="p-3">
    {#if activeTab === "environments"}
      <Environments
        {environments}
        {appState}
        onToggleCapture={toggleCapture}
      />
    {:else if activeTab === "captures"}
      <Captures {captures} {environments} {mocks} />
    {:else}
      <Mocks {mocks} {environments} />
    {/if}
  </div>
</main>
