<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useTheme, useRtl } from 'vuetify';
import { compactProfileKey } from '../profile.js';
import { positionOnboarding } from '../onboarding-position.js';
import type { OnboardingStep } from '../onboarding.js';
import AuOnboardingCard from './AuOnboardingCard.vue';
import AuButton from './AuButton.vue';
const props = withDefaults(defineProps<{ root: HTMLElement | null; step: OnboardingStep | null; open: boolean; label: string; closeLabel: string; nextLabel: string; hideLabel: string; hidden?: boolean; hiddenMessage?: string; reactivateLabel?: string; blocked?: boolean; autoCloseMs?: number }>(), { hidden: false, blocked: false, autoCloseMs: 0 });
const emit = defineEmits<{ 'update:open': [open: boolean]; next: []; hide: []; reactivate: [] }>();
const compact = inject(compactProfileKey, () => false), theme = useTheme(), { isRtl } = useRtl();
const cardHost = ref<HTMLElement>(), geometry = ref<ReturnType<typeof positionOnboarding>>(null), toast = ref(false), highlight = ref({ left: 0, top: 0, width: 0, height: 0, radius: '8px' }), modalOpen = ref(false);
const classes = computed(() => [theme.themeClasses.value, { 'au-profile-compact': compact() }]);
const shown = computed(() => !!props.step && !props.hidden && !props.blocked && !modalOpen.value && !!geometry.value);
let resize: ResizeObserver | undefined, mutation: MutationObserver | undefined, overlays: MutationObserver | undefined, frame = 0, closeTimer: ReturnType<typeof setTimeout> | undefined, toastTimer: ReturnType<typeof setTimeout> | undefined;
let previousFocus: HTMLElement | null = null;
function target() {
  if (!props.root || !props.step) return null;
  try { return [...props.root.querySelectorAll<HTMLElement>(props.step.target)].find(el => {
    if (!el.getClientRects().length || el.closest('[hidden],[inert]')) return false;
    const style = getComputedStyle(el); if (style.visibility === 'hidden' || style.display === 'none') return false;
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return false;
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(css.overflowY) && (rect.bottom <= bounds.top || rect.top >= bounds.bottom)) return false;
      if (/(auto|scroll|hidden|clip)/.test(css.overflowX) && (rect.right <= bounds.left || rect.left >= bounds.right)) return false;
    }
    return true;
  }) ?? null; } catch { return null; }
}
function position() {
  frame = 0; const el = target();
  modalOpen.value = !!document.querySelector('dialog[open], .v-overlay--active.v-menu, .v-overlay--active.v-dialog');
  if (el) { const rect = el.getBoundingClientRect(); highlight.value = { left: Math.max(2, rect.left - 3), top: Math.max(2, rect.top - 3), width: Math.min(rect.width + 6, innerWidth - 4), height: Math.min(rect.height + 6, innerHeight - 4), radius: getComputedStyle(el).borderRadius }; }
  geometry.value = el ? positionOnboarding(el.getBoundingClientRect(), { width: innerWidth, height: innerHeight }, cardHost.value?.offsetHeight ?? 210) : null;
}
function queue() { if (!frame) frame = requestAnimationFrame(position); }
function pause() { clearTimeout(closeTimer); closeTimer = undefined; }
function resume() {
  pause();
  if (props.open && shown.value && Number.isFinite(props.autoCloseMs) && props.autoCloseMs > 0 && !cardHost.value?.matches(':hover,:focus-within')) closeTimer = setTimeout(() => emit('update:open', false), props.autoCloseMs);
}
function restoreFocus() {
  if (cardHost.value?.contains(document.activeElement)) {
    const destination = previousFocus?.isConnected ? previousFocus : props.root?.querySelector<HTMLElement>('[data-onboarding-trigger]');
    destination?.focus({ preventScroll: true });
  }
}
function close() { restoreFocus(); emit('update:open', false); }
function next() { restoreFocus(); emit('next'); }
function hide() { restoreFocus(); emit('hide'); }
function key(event: KeyboardEvent) { if (event.key === 'Escape' && props.open && shown.value) { event.preventDefault(); close(); } }
function observe() {
  resize?.disconnect(); mutation?.disconnect();
  if (props.root) { resize?.observe(props.root); const el = target(); if (el) resize?.observe(el); mutation?.observe(props.root, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class', 'style', 'aria-expanded'] }); }
  queue();
}
watch(() => [props.step?.id, props.root], async () => {
  restoreFocus(); pause(); await nextTick();
  if (props.root && props.step) { try { props.root.querySelector<HTMLElement>(props.step.target)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* Invalid consumer selector leaves this tip unavailable. */ } }
  observe();
  if (props.open && !props.blocked) cardHost.value?.querySelector<HTMLElement>('[role="dialog"]')?.focus({ preventScroll: true });
});
watch(() => [props.open, props.blocked, props.hidden], async () => {
  pause(); if (props.open && !props.blocked && typeof document !== 'undefined' && document.activeElement instanceof HTMLElement && !document.activeElement.closest('[data-onboarding-ui],.au-onboarding-toast')) previousFocus = document.activeElement;
  await nextTick(); queue(); resume();
});
watch(shown, value => { if (value) resume(); else pause(); });
watch(() => props.hidden, value => { clearTimeout(toastTimer); toast.value = value; if (value) toastTimer = setTimeout(() => { toast.value = false; }, 4000); });
watch(cardHost, async element => { await nextTick(); queue(); resume(); if (element) element.querySelector<HTMLElement>('[role="dialog"]')?.focus({ preventScroll: true }); });
onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  resize = new ResizeObserver(queue); mutation = new MutationObserver(queue); observe();
  overlays = new MutationObserver(records => { if (records.some(record => !(record.target instanceof Element && record.target.closest('[data-onboarding-ui],.au-onboarding-toast')))) queue(); });
  overlays.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class','open'] });
  window.addEventListener('resize', queue); document.addEventListener('scroll', queue, true); document.addEventListener('keydown', key);
});
onBeforeUnmount(() => { restoreFocus(); pause(); clearTimeout(toastTimer); cancelAnimationFrame(frame); resize?.disconnect(); mutation?.disconnect(); overlays?.disconnect(); window.removeEventListener('resize', queue); document.removeEventListener('scroll', queue, true); document.removeEventListener('keydown', key); });
</script>
<template>
  <Teleport to="body">
    <div v-if="shown && geometry && step" class="au-overlay au-onboarding" :class="classes" :dir="isRtl ? 'rtl' : 'ltr'" data-onboarding-ui :data-step="step.id">
      <div v-if="open" class="au-onboarding-target" :style="{left: `${highlight.left}px`, top: `${highlight.top}px`, width: `${highlight.width}px`, height: `${highlight.height}px`, borderRadius: highlight.radius}" />
      <button class="au-onboarding-beacon" type="button" :aria-label="`${label} : ${step.title}`" :style="{ left: `${geometry.beaconLeft}px`, top: `${geometry.beaconTop}px` }" @click="emit('update:open', !open)"><span /></button>
      <div v-if="open" class="au-onboarding-halo" :style="{ left: `${geometry.beaconLeft - 8}px`, top: `${geometry.beaconTop - 8}px` }" />
      <div v-if="open" ref="cardHost" class="au-onboarding-position" :data-arrow="geometry.arrow" :style="{ left: `${geometry.left}px`, top: `${geometry.top}px`, width: `${geometry.width}px`, '--au-tip-arrow-offset': `${geometry.arrowOffset}px` }" @mouseenter="pause" @mouseleave="resume" @focusin="pause" @focusout="() => nextTick(resume)">
        <AuOnboardingCard :title="step.title" :text="step.text" :label="label" :close-label="closeLabel" :next-label="nextLabel" :hide-label="hideLabel" @close="close" @next="next" @hide="hide" />
      </div>
    </div>
    <div v-if="toast && hiddenMessage && reactivateLabel && !blocked" class="au-overlay au-onboarding-toast" :class="classes" :dir="isRtl ? 'rtl' : 'ltr'" role="status">{{ hiddenMessage }}<AuButton variant="text" @click="toast = false; emit('reactivate')">{{ reactivateLabel }}</AuButton></div>
  </Teleport>
</template>
