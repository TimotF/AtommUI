import type { InjectionKey } from 'vue';

export const compactProfileKey: InjectionKey<() => boolean> = Symbol('atomm-ui-compact-profile');
