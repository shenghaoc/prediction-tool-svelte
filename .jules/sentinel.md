## 2024-05-24 - Missing Security Headers

**Vulnerability:** The application was missing critical security headers like X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Strict-Transport-Security.
**Learning:** Security headers should be added globally at the SvelteKit hooks level (`src/hooks.server.ts` or similar) to ensure all outgoing responses from the server are protected against common web vulnerabilities like clickjacking and MIME-sniffing.
**Prevention:** Use SvelteKit's `handle` hook to systematically inject these headers into all HTTP responses.

## 2024-05-26 - Missing Input Validation for NaN Bypassing Bounds Checks

**Vulnerability:** The API endpoint `/api/prices` validates numeric boundaries (e.g., `< 20` or `> 300`) but fails to account for `NaN` values. Since `typeof NaN === 'number'`, it passes the type check, and since `NaN < 20` and `NaN > 300` both evaluate to `false`, it bypasses the bounds checks. This leads to downstream `NaN` calculations and application errors (HTTP 500).
**Learning:** In JavaScript/TypeScript, always use `Number.isFinite()` on parsed numeric input before evaluating greater-than or less-than boundaries, because `NaN` breaks standard comparison logic.
**Prevention:** Include explicit `!Number.isFinite(val)` checks in the initial input validation layer.

## 2026-05-27 - In-Memory Rate Limiting for Public APIs

**Vulnerability:** The public API endpoint `/api/prices` lacked rate limiting, making it susceptible to basic Denial of Service (DoS) attacks and brute-force queries against the D1 database.
**Learning:** Even serverless or edge environments (like Cloudflare Workers) require basic rate limiting to protect resources and prevent isolate exhaustion. In-memory Map-based limiters with strict size bounds provide an effective, zero-dependency layer of defense in depth. Always prefer trusted headers like `cf-connecting-ip` over easily spoofable headers like `x-forwarded-for`.
**Prevention:** Implement a basic rate limiter using `getClientAddress()` or trusted proxy headers for unauthenticated public endpoints.

## 2026-05-28 - Rate Limit Bypass via Missing IP Headers

**Vulnerability:** The rate limiting check in `/api/prices` could be entirely bypassed if the client IP could not be resolved (e.g. `cf-connecting-ip` missing), leaving the API exposed.
**Learning:** Security controls like rate limiting should fail securely. If an identifier (like IP) is missing, it is safer to group all unidentified requests into a single shared bucket rather than skipping the check completely.
**Prevention:** Provide a fallback identifier (e.g., `'unknown'`) when resolving client IPs for rate limiting to ensure the limit is always applied.

## 2026-05-28 - Preventing Object Injection with CSP

**Vulnerability:** The Content Security Policy (CSP) was missing restrictions on plugins (`object-src`) and did not explicitly force secure connections for all subresources.
**Learning:** Setting `object-src: ['none']` is a critical defense-in-depth measure to prevent execution of malicious legacy plugins (Flash, PDF viewers, etc.) even if other injections are mitigated. Furthermore, `upgrade-insecure-requests` should be enabled to enforce HTTPS.
**Prevention:** Ensure `object-src: ['none']` and `upgrade-insecure-requests: true` are included in the default CSP directives.
