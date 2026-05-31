## 2026-05-26 - Add Tooltip to Theme Toggle Button

**Learning:** Some components use generic SVG icons without a tooltip and an `aria-label` which updates based on state (`darkMode`). Tooltips can complement these icon-only buttons to make the interface more pleasant to use and intuitive, especially when the icon toggles a state that may not be immediately obvious.
**Action:** Always wrap icon-only action buttons with a `Tooltip` component where applicable to provide helpful context.

## 2026-05-27 - Keyboard Shortcuts Discoverability

**Learning:** This app already implements keyboard shortcuts for submitting the form (`Ctrl/Cmd + Enter`) and resetting the form (`Esc`), but users couldn't see them. Adding small visual hints to the buttons makes these powerful shortcuts discoverable.
**Action:** When an app implements keyboard shortcuts, ensure they are visually surfaced in the UI (e.g., using `<kbd>` tags inside action buttons) so users know they exist.
## 2026-05-29 - Missing feedback on destructive forms actions
**Learning:** Form reset actions can be destructive. While a keyboard shortcut correctly resets the form, failing to trigger a confirmation toast or screen reader announcement for the physical button leaves users without adequate feedback. In addition, allowing a reset action while the form is loading can cause unintended side effects.
**Action:** Always ensure physical buttons and keyboard shortcuts trigger identical feedback pathways (e.g., both trigger toast notifications and screen reader announcements), and guard destructive actions while async tasks are running. The reliable way to keep them in sync is to route both the button handler and the shortcut handler through a single shared function that owns the loading guard and the feedback, rather than duplicating logic.
