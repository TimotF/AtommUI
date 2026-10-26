<script setup lang="ts">
withDefaults(defineProps<{spacing?:'compact'|'reference'}>(),{spacing:'compact'});
</script>
<template><div class="au-field-groups" :class="{'au-field-groups-reference':spacing==='reference'}"><slot /></div></template>
