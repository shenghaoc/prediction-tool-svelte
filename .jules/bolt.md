## 2026-05-26 - Dayjs Calculation Overhead

**Learning:** Initializing default form state dynamically evaluates `dayjs.subtract().format()` for past months in a loop. When resetting form state or mounting components repeatedly, this `dayjs` string calculation overhead becomes noticeable in hot paths.
**Action:** Always check if default states reliant on `dayjs` or formatting logic can be pre-computed at module initialization if they depend on constants.

## 2026-05-27 - Deep Object Lookup in Highly Reactive Contexts

**Learning:** Svelte's `$t()` string translation lookup is called many times during re-renders, form events, and dataset iterations. Splitting string keys (e.g., `'town.bedok'`) via `.split('.')` and traversing deep dictionary objects on _every single evaluation_ creates noticeable `O(depth)` CPU overhead.
**Action:** When working with nested dictionaries or recursive configuration objects that are read frequently (like i18n), pre-compute or pre-flatten them into a one-level hash map `O(1)` during initialization to minimize string operation and nested traversal overhead.

## 2026-05-28 - Svelte 5 Reactive Inline Array Props & Layout Thrashing

**Learning:** Declaring static inline array maps inside props in Svelte 5 (like `options={TOWNS.map(...)}`) implicitly creates getters. This continuously causes new arrays and objects to be re-allocated during reactive component updates, adding unnecessary GC overhead. Also, calling `.getBoundingClientRect()` inside a `pointermove` handler continuously forces a synchronous layout reflow (Layout Thrashing).
**Action:** Extract inline property mappings into `$derived` variables to prevent re-evaluation on reactive updates. Use `event.offsetX` / `event.offsetY` instead of `getBoundingClientRect()` on every `pointermove` to calculate coordinates without forcing Layout Thrashing reflows or dealing with stale scroll offsets.
