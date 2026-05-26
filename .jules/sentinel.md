## 2024-05-26 - Missing Input Validation for NaN Bypassing Bounds Checks

**Vulnerability:** The API endpoint `/api/prices` validates numeric boundaries (e.g., `< 20` or `> 300`) but fails to account for `NaN` values. Since `typeof NaN === 'number'`, it passes the type check, and since `NaN < 20` and `NaN > 300` both evaluate to `false`, it bypasses the bounds checks. This leads to downstream `NaN` calculations and application errors (HTTP 500). Additionally, string lengths were unbounded before lookup checks.
**Learning:** In JavaScript/TypeScript, always use `Number.isFinite()` on parsed numeric input before evaluating greater-than or less-than boundaries, because `NaN` breaks standard comparison logic. String length bounds should also be applied to prevent unnecessary processing of massive payloads.
**Prevention:** Include explicit `!Number.isFinite(val)` and string `.length` constraints in the initial input validation layer.
