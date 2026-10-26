<script setup lang="ts">
import AuButton from './AuButton.vue';
import AuIcon from './AuIcon.vue';
defineProps<{ label: string; active?: boolean; disabled?: boolean }>();
</script>
<template>
  <AuButton class="au-tips-button" variant="outlined" :active="active" :disabled="disabled" :aria-label="label">
    <AuIcon :size="20" path="M6 12h4M7 14h2M8 2a4 4 0 0 1 2.4 7.2c-.5.4-.7.9-.7 1.4H6.3c0-.5-.2-1-.7-1.4A4 4 0 0 1 8 2Z" />
    <span>{{ label }}</span>
  </AuButton>
</template>

<style>
:is(.au-root,.au-overlay) .au-button.au-tips-button { height:32px; border:1px solid var(--color-stroke-default); border-radius:999px; background:var(--color-bg-default); color:var(--color-text-secondary); padding-inline:12px; font-size:var(--au-font-size-action); }
:is(.au-root,.au-overlay) .au-button.au-tips-button:not(:disabled):hover { border-color:var(--color-stroke-strong); background:var(--color-bg-hover); }
:is(.au-root,.au-overlay) .au-button.au-tips-button[aria-pressed="true"] { outline:1px solid var(--color-stroke-active); outline-offset:0; }
</style>
