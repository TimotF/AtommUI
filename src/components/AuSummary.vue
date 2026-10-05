<script setup lang="ts">
defineProps<{ label: string; items: readonly { label: string; value: string | number }[] }>();
</script>
<template>
  <dl class="au-summary" :aria-label="label">
    <div v-for="item in items" :key="item.label"><dt>{{ item.label }}</dt><dd>{{ item.value }}</dd></div>
  </dl>
</template>
