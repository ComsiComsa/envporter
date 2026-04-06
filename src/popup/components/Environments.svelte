<script lang="ts">
  import type { Environment, AppState } from "../../types";
  import EnvironmentForm from "./EnvironmentForm.svelte";

  interface Props {
    environments: Environment[];
    appState: AppState;
    onToggleCapture: (envId: string) => void;
  }

  let { environments, appState, onToggleCapture }: Props = $props();

  let showForm = $state(false);
  let editingEnv = $state<Environment | undefined>(undefined);

  async function saveEnvironment(data: Omit<Environment, "id" | "createdAt">) {
    const current = (await chrome.storage.local.get("environments")).environments ?? [];

    if (editingEnv) {
      const idx = current.findIndex((e: Environment) => e.id === editingEnv!.id);
      if (idx >= 0) current[idx] = { ...editingEnv, ...data };
    } else {
      current.push({
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      });
    }

    await chrome.storage.local.set({ environments: current });
    showForm = false;
    editingEnv = undefined;
  }

  async function deleteEnvironment(id: string) {
    const current = (await chrome.storage.local.get("environments")).environments ?? [];
    await chrome.storage.local.set({
      environments: current.filter((e: Environment) => e.id !== id),
    });
  }

  function startEdit(env: Environment) {
    editingEnv = env;
    showForm = true;
  }

  function isCapturing(envId: string): boolean {
    return appState.captureEnabled && appState.activeEnvironmentId === envId;
  }
</script>

{#if showForm}
  <EnvironmentForm
    environment={editingEnv}
    onSave={saveEnvironment}
    onCancel={() => {
      showForm = false;
      editingEnv = undefined;
    }}
  />
{:else}
  <div class="space-y-2">
    {#each environments as env (env.id)}
      <div
        class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
      >
        <span
          class="w-3 h-3 rounded-full shrink-0"
          style="background-color: {env.color}"
        ></span>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-xs truncate">{env.name}</div>
          <div class="text-[10px] text-gray-400 truncate">{env.urlPattern}</div>
        </div>
        <button
          class="text-[10px] px-2 py-1 rounded {isCapturing(env.id)
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          onclick={() => onToggleCapture(env.id)}
        >
          {isCapturing(env.id) ? "REC" : "Capture"}
        </button>
        <button
          class="text-gray-400 hover:text-gray-600 text-xs"
          onclick={() => startEdit(env)}
        >
          Edit
        </button>
        <button
          class="text-gray-400 hover:text-red-500 text-xs"
          onclick={() => deleteEnvironment(env.id)}
        >
          Del
        </button>
      </div>
    {/each}

    {#if environments.length === 0}
      <p class="text-center text-gray-400 text-xs py-4">
        No environments yet. Add one to get started.
      </p>
    {/if}

    <button
      class="w-full bg-teal-600 text-white text-xs px-3 py-2 rounded hover:bg-teal-700"
      onclick={() => {
        editingEnv = undefined;
        showForm = true;
      }}
    >
      + Add Environment
    </button>
  </div>
{/if}
