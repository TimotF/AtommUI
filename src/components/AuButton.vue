<script setup lang="ts">
import { VBtn } from 'vuetify/components/VBtn';
withDefaults(defineProps<{ primary?: boolean; icon?: boolean; block?: boolean; disabled?: boolean; active?: boolean }>(), { primary: false, icon: false, block: false, disabled: false, active: undefined });
</script>
<template>
  <VBtn class="au-button" :class="{ 'au-button-icon': icon, 'au-button-primary': primary }" :color="primary ? 'primary' : undefined" :variant="primary ? 'flat' : 'text'" :disabled="disabled" :block="block" :aria-pressed="active === undefined ? undefined : String(active)"><slot /></VBtn>
</template>
