<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue';
import { VTooltip } from 'vuetify/components/VTooltip';
import { VBadge } from 'vuetify/components/VBadge';
const props = defineProps<{ label: string; text: string; helpKey?: string }>();
const anchor = ref<HTMLElement | null>(null), trigger = ref<HTMLButtonElement | null>(null);
const open = ref(false), tooltipId = `au-help-${useId()}`;
let pinned = false, closing: ReturnType<typeof setTimeout> | undefined;
function clearClosing() { if (closing !== undefined) { clearTimeout(closing); closing = undefined; } }
function show() { clearClosing(); open.value = true; }
function close() { clearClosing(); open.value = false; pinned = false; }
function otherControl(target: EventTarget | null) { const el = target instanceof Element ? target.closest('button,input,select,[role="combobox"],[role="slider"]') : null; return el && el !== trigger.value; }
function hover(event: PointerEvent) { if (otherControl(event.target)) { if (!pinned) close(); } else show(); }
function leave() { clearClosing(); if (!pinned && document.activeElement !== trigger.value) closing = setTimeout(close, 140); }
function click(event: MouseEvent) { if (otherControl(event.target)) return; if (open.value && pinned) close(); else { show(); pinned = true; } }
function visible() {
  const target = anchor.value; if (!target) return false;
  const bounds = target.getBoundingClientRect();
  let left = Math.max(0,bounds.left), right = Math.min(innerWidth,bounds.right), top = Math.max(0,bounds.top), bottom = Math.min(innerHeight,bounds.bottom);
  for (let node = target.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    if (['hidden','clip','auto','scroll'].includes(style.overflowX)) { left = Math.max(left,rect.left); right = Math.min(right,rect.right); }
    if (['hidden','clip','auto','scroll'].includes(style.overflowY)) { top = Math.max(top,rect.top); bottom = Math.min(bottom,rect.bottom); }
  }
  return right > left && bottom > top;
}
function escape(event: KeyboardEvent) { if (event.key === 'Escape') close(); }
function outside(event: PointerEvent) { const target = event.target as Node; if (!anchor.value?.contains(target) && !(target instanceof Element && target.closest(`#${CSS.escape(tooltipId)}`))) close(); }
function scroll() { if (open.value && !visible()) close(); }
onMounted(() => { document.addEventListener('keydown',escape); document.addEventListener('pointerdown',outside); document.addEventListener('scroll',scroll,true); window.addEventListener('resize',scroll); });
onBeforeUnmount(() => { close(); document.removeEventListener('keydown',escape); document.removeEventListener('pointerdown',outside); document.removeEventListener('scroll',scroll,true); window.removeEventListener('resize',scroll); });
</script>
<template>
  <span ref="anchor" class="au-label-help field-label-group" @pointerenter="hover" @pointermove="hover" @pointerleave="leave" @click="click">
    <slot />
    <button ref="trigger" type="button" class="au-help-trigger help-trigger" :data-help="helpKey" :aria-label="label" :aria-describedby="tooltipId" @focus="show" @blur="leave"><VBadge inline content="?" class="au-help-badge" color="var(--color-bg-default)" text-color="var(--color-text-secondary)" :transition="false" aria-hidden="true" role="presentation" aria-live="off" /></button>
    <VTooltip v-model="open" :activator="trigger ?? undefined" :id="`${tooltipId}-overlay`" role="presentation" :eager="false" :activator-props="{ 'aria-describedby': tooltipId }" :content-props="{ id: tooltipId, role: 'tooltip', onPointerenter: show, onPointerleave: leave }" :z-index="3" :open-on-hover="false" :open-on-focus="false" :open-on-click="false" location="top center" :max-width="300" :offset="10" :transition="false" content-class="au-overlay au-help-popover help-popover" :interactive="true">
      <span @pointerenter="clearClosing" @pointerleave="leave">{{ text }}</span>
    </VTooltip>
  </span>
</template>
