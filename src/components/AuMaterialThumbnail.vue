<script setup lang="ts">
import { safeHexColor, type UiMaterialKind } from '../contracts.js';
import { materialSurfaces } from '../material-surfaces.js';
withDefaults(defineProps<{ material: UiMaterialKind; color?: string }>(), { color: '#9ac8bb' });
</script>
<template>
  <svg class="au-material-thumbnail" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
    <template v-if="material === 'acrylic'">
      <rect width="80" height="80" fill="#e8ecef"/>
      <path d="M8 8h64v64H8z" fill="#d4edf2" fill-opacity=".65" stroke="#769ba6" stroke-width="2"/>
      <path d="M12 52L52 12h12L12 64z" fill="#fff" fill-opacity=".7"/>
      <path d="M8 72h64V8" fill="none" stroke="#527782" stroke-width="3"/>
    </template>
    <template v-else>
    <rect width="80" height="80" :fill="material === 'solid' ? safeHexColor(color, '#9ac8bb') : materialSurfaces[material === 'walnut' ? 'walnut' : 'pine'].fallback"/>
    <image v-if="material !== 'solid'" :href="materialSurfaces[material === 'walnut' ? 'walnut' : 'pine'].thumbnail" width="80" height="80" preserveAspectRatio="xMidYMid slice"/>
    </template>
  </svg>
</template>
