<script setup lang="ts">
import { useId } from 'vue';
import AuButton from './AuButton.vue';
import AuIcon from './AuIcon.vue';
defineProps<{ title: string; text?: string; label: string; closeLabel: string; nextLabel: string; hideLabel: string }>();
const emit = defineEmits<{ close: []; next: []; hide: [] }>();
const id = useId();
</script>
<template>
  <section class="au-onboarding-card" role="dialog" tabindex="-1" :aria-labelledby="`au-tip-title-${id}`" :aria-describedby="`au-tip-text-${id}`">
    <header><span class="au-onboarding-icon"><AuIcon path="M6 12h4M7 14h2M8 2a4 4 0 0 1 2.4 7.2c-.5.4-.7.9-.7 1.4H6.3c0-.5-.2-1-.7-1.4A4 4 0 0 1 8 2Z" /></span><span>{{ label }}</span><AuButton variant="text" icon :aria-label="closeLabel" @click="emit('close')"><AuIcon path="m4 4 8 8M12 4l-8 8" /></AuButton></header>
    <h3 :id="`au-tip-title-${id}`">{{ title }}</h3>
    <div :id="`au-tip-text-${id}`" class="au-onboarding-body"><slot>{{ text }}</slot></div>
    <footer><AuButton variant="text" @click="emit('hide')">{{ hideLabel }}</AuButton><AuButton class="au-onboarding-next" variant="text" @click="emit('next')">{{ nextLabel }}</AuButton></footer>
  </section>
</template>
