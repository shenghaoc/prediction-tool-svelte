## 2024-05-24 - Intl.NumberFormat Instantiation Overhead

**Learning:** `Intl.NumberFormat` instantiation is notoriously slow. In high-frequency code paths such as reactive derived state or hover tooltips, repeatedly instantiating formatting objects can lead to main thread blocking and jank.
**Action:** Always reuse `Intl.NumberFormat` instances via caching instead of creating a new instance every time the function is called.
