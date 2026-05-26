## 2025-05-26 - Dayjs Calculation Overhead
**Learning:** Initializing default form state dynamically evaluates `dayjs.subtract().format()` for past months in a loop. When resetting form state or mounting components repeatedly, this `dayjs` string calculation overhead becomes noticeable in hot paths.
**Action:** Always check if default states reliant on `dayjs` or formatting logic can be pre-computed at module initialization if they depend on constants.
