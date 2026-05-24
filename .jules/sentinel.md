## 2024-05-24 - Missing Security Headers

**Vulnerability:** The application was missing critical security headers like X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Strict-Transport-Security.
**Learning:** Security headers should be added globally at the SvelteKit hooks level (`src/hooks.server.ts` or similar) to ensure all outgoing responses from the server are protected against common web vulnerabilities like clickjacking and MIME-sniffing.
**Prevention:** Use SvelteKit's `handle` hook to systematically inject these headers into all HTTP responses.
