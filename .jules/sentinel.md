## 2024-05-24 - Missing Security Headers

**Vulnerability:** The application was missing critical security headers like X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Strict-Transport-Security.
**Learning:** Security headers should be added globally at the SvelteKit hooks level (`src/hooks.server.ts` or similar) to ensure all outgoing responses from the server are protected against common web vulnerabilities like clickjacking and MIME-sniffing.
**Prevention:** Use SvelteKit's `handle` hook to systematically inject these headers into all HTTP responses.

## 2024-05-26 - Missing Input Validation for NaN Bypassing Bounds Checks

**Vulnerability:** The API endpoint `/api/prices` validates numeric boundaries (e.g., `< 20` or `> 300`) but fails to account for `NaN` values. Since `typeof NaN === 'number'`, it passes the type check, and since `NaN < 20` and `NaN > 300` both evaluate to `false`, it bypasses the bounds checks. This leads to downstream `NaN` calculations and application errors (HTTP 500).
**Learning:** In JavaScript/TypeScript, always use `Number.isFinite()` on parsed numeric input before evaluating greater-than or less-than boundaries, because `NaN` breaks standard comparison logic.
**Prevention:** Include explicit `!Number.isFinite(val)` checks in the initial input validation layer.
