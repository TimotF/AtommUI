<script setup lang="ts">
import { safeHexColor, type UiMaterialKind } from '../contracts.js';
import { materialSurfaces } from '../material-surfaces.js';
withDefaults(defineProps<{ material: UiMaterialKind; color?: string }>(), { color: '#9ac8bb' });
</script>
<template>
  <svg class="au-material-thumbnail" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
    <rect width="80" height="80" :fill="material === 'solid' ? safeHexColor(color, '#9ac8bb') : materialSurfaces[material === 'walnut' ? 'walnut' : 'pine'].fallback"/>
    <image v-if="material !== 'solid'" :href="materialSurfaces[material === 'walnut' ? 'walnut' : 'pine'].thumbnail" width="80" height="80" preserveAspectRatio="xMidYMid slice"/>
  </svg>
</template>
