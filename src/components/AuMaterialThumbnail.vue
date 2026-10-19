<script setup lang="ts">
import { useId } from 'vue';
import { safeHexColor, type UiMaterialKind } from '../contracts.js';
withDefaults(defineProps<{ material: UiMaterialKind; color?: string }>(), { color: '#9ac8bb' });
const patternId = 'au-material-' + useId();
</script>
<template>
  <svg class="au-material-thumbnail" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
    <defs><pattern v-if="material !== 'solid'" :id="patternId" width="20" height="80" patternUnits="userSpaceOnUse"><rect width="20" height="80" :fill="material === 'walnut' ? '#795331' : '#e7c891'"/><path d="M3 0Q8 20 3 40T3 80M11 0Q6 25 11 50T11 80M16 0V80" fill="none" :stroke="material === 'walnut' ? '#4c311d' : '#b88e58'" stroke-width=".7" opacity=".6"/></pattern></defs>
    <rect width="80" height="80" :fill="material === 'solid' ? safeHexColor(color, '#9ac8bb') : `url(#${patternId})`"/>
  </svg>
</template>
