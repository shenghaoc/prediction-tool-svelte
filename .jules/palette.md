## 2026-05-26 - Add Tooltip to Theme Toggle Button

**Learning:** Some components use generic SVG icons without a tooltip and an `aria-label` which updates based on state (`darkMode`). Tooltips can complement these icon-only buttons to make the interface more pleasant to use and intuitive, especially when the icon toggles a state that may not be immediately obvious.
**Action:** Always wrap icon-only action buttons with a `Tooltip` component where applicable to provide helpful context.

## 2026-05-27 - Keyboard Shortcuts Discoverability

**Learning:** This app already implements keyboard shortcuts for submitting the form (`Ctrl/Cmd + Enter`) and resetting the form (`Esc`), but users couldn't see them. Adding small visual hints to the buttons makes these powerful shortcuts discoverable.
**Action:** When an app implements keyboard shortcuts, ensure they are visually surfaced in the UI (e.g., using `<kbd>` tags inside action buttons) so users know they exist.
