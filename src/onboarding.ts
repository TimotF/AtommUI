import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

/** Copy, selectors and completion conditions always belong to the consumer. */
export interface OnboardingStep { id: string; target: string; title: string; text: string; available?: boolean; complete?: boolean }
export interface OnboardingProgress { version: 1; completed: string[]; hidden: boolean }
export interface OnboardingStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function readOnboardingProgress(raw: string | null): OnboardingProgress {
  const empty: OnboardingProgress = { version: 1, completed: [], hidden: false };
  if (!raw || raw.length > 64_000) return empty;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Array.isArray(value.completed) || typeof value.hidden !== 'boolean' || value.completed.length > 500 || value.completed.some((id: unknown) => typeof id !== 'string' || id.length > 200)) return empty;
    return { version: 1, completed: [...new Set<string>(value.completed)], hidden: value.hidden };
  } catch { return empty; }
}
export function pendingOnboardingSteps(steps: readonly OnboardingStep[], completed: readonly string[]): OnboardingStep[] {
  const seen = new Set<string>();
  return steps.filter(step => {
    if (!step.id || seen.has(step.id)) return false;
    seen.add(step.id);
    return step.available !== false && !step.complete && !completed.includes(step.id);
  });
}
/** Separate instances and explicit storage keys prevent one guide affecting another. */
export function useOnboarding(steps: MaybeRefOrGetter<readonly OnboardingStep[]>, options: { storageKey?: string; storage?: OnboardingStorage | null; autoStart?: boolean } = {}) {
  const completed = ref<string[]>([]), hidden = ref(false), activeId = ref(''), open = ref(false), storageError = ref(false);
  let storage: OnboardingStorage | null = options.storage ?? null;
  const pending = computed(() => pendingOnboardingSteps(toValue(steps), completed.value));
  const current = computed(() => hidden.value ? null : pending.value.find(step => step.id === activeId.value) ?? null);
  function persist() {
    if (!storage || !options.storageKey) return;
    try { storage.setItem(options.storageKey, JSON.stringify({ version: 1, completed: completed.value, hidden: hidden.value })); storageError.value = false; } catch { storageError.value = true; }
  }
  function selectFirst() { activeId.value = pending.value[0]?.id ?? ''; open.value = !!activeId.value; }
  function restart() { completed.value = []; hidden.value = false; selectFirst(); persist(); }
  function next() { if (!current.value) return; completed.value = [...completed.value, current.value.id]; selectFirst(); persist(); }
  function hide() { hidden.value = true; open.value = false; persist(); }
  function resume() { hidden.value = false; selectFirst(); persist(); }
  watch(pending, () => { if (activeId.value && !pending.value.some(step => step.id === activeId.value)) selectFirst(); });
  onMounted(() => {
    if (options.storage === undefined && options.storageKey) { try { storage = window.localStorage; } catch { storageError.value = true; } }
    if (storage && options.storageKey) {
      try { const progress = readOnboardingProgress(storage.getItem(options.storageKey)); completed.value = progress.completed; hidden.value = progress.hidden; } catch { storageError.value = true; }
    }
    if (options.autoStart && !hidden.value) selectFirst();
  });
  return { current, completed, hidden, open, storageError, restart, next, hide, resume };
}
