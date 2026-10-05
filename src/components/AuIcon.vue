<script setup lang="ts">
defineProps<{ path: string; size?: number }>();
</script>
<template><svg class="au-icon icon" viewBox="0 0 16 16" :width="size ?? 16" :height="size ?? 16" aria-hidden="true"><path :d="path" /></svg></template>
