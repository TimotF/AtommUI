<script setup lang="ts">
import { VBtn } from 'vuetify/components/VBtn';
withDefaults(defineProps<{ primary?: boolean; icon?: boolean; block?: boolean; disabled?: boolean; active?: boolean; loading?: boolean; large?: boolean }>(), { primary: false, icon: false, block: false, disabled: false, active: undefined, loading: false, large: false });
</script>
<template>
  <VBtn class="au-button" :class="{ 'au-button-icon': icon, 'au-button-primary': primary, 'au-button-block': block || large, 'au-button-large': large }" :color="primary ? 'primary' : undefined" :variant="primary ? 'flat' : icon ? 'text' : undefined" :disabled="disabled" :loading="loading" :aria-busy="loading ? 'true' : undefined" :block="block || large" :aria-pressed="active === undefined ? undefined : String(active)"><slot /></VBtn>
</template>
