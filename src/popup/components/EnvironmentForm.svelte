<script lang="ts">
  import type { Environment } from "../../types";

  interface Props {
    environment?: Environment;
    onSave: (env: Omit<Environment, "id" | "createdAt">) => void;
    onCancel: () => void;
  }

  let { environment, onSave, onCancel }: Props = $props();

  let name = $state(environment?.name ?? "");
  let urlPattern = $state(environment?.urlPattern ?? "");
  let color = $state(environment?.color ?? "#009678");

  function handleSubmit() {
    if (!name.trim() || !urlPattern.trim()) return;
    onSave({ name: name.trim(), urlPattern: urlPattern.trim(), color });
  }
</script>

<form class="space-y-3" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <div>
    <label class="block text-xs font-medium text-gray-600 mb-1" for="env-name">Name</label>
    <input
      id="env-name"
      type="text"
      bind:value={name}
      placeholder="e.g. Dev 1"
      class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
    />
  </div>
  <div>
    <label class="block text-xs font-medium text-gray-600 mb-1" for="env-pattern">Host pattern</label>
    <input
      id="env-pattern"
      type="text"
      bind:value={urlPattern}
      placeholder="e.g. app.dev1.example.com"
      class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
    />
  </div>
  <div class="flex items-center gap-2">
    <label class="text-xs font-medium text-gray-600" for="env-color">Color</label>
    <input id="env-color" type="color" bind:value={color} class="w-8 h-8 rounded cursor-pointer" />
  </div>
  <div class="flex gap-2 pt-1">
    <button
      type="submit"
      class="flex-1 bg-teal-600 text-white text-xs px-3 py-1.5 rounded hover:bg-teal-700"
    >
      {environment ? "Update" : "Add"}
    </button>
    <button
      type="button"
      class="flex-1 bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded hover:bg-gray-300"
      onclick={onCancel}
    >
      Cancel
    </button>
  </div>
</form>
