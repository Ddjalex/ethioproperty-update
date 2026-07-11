---
name: Detached-element outside-click auto-close bug
description: Why document-level "click outside to close" listeners using contains(e.target) can misfire, and the fix.
---

## The bug
A document-level click listener that closes a panel/modal via `if (!panel.contains(e.target)) close()` can fire incorrectly when the clicked element removes itself from the DOM inside its own click handler (e.g. a chip/button whose handler calls `el.remove()`).

Event order: the element's own bubbling handler runs first (still attached), then the event continues bubbling to `document` — but by then `e.target` is detached. `Node.contains()` on a detached node returns `false` even though the click originated inside the panel, so the outside-click handler wrongly triggers and closes the panel.

**Why:** Removing a node from the DOM does not stop the click event from continuing to bubble along its original path, but `contains()` is a live tree-membership check, not a path check — it re-evaluates against the *current* DOM after removal.

**How to apply:** Any time a UI has both (a) an "outside click closes me" document listener using `.contains(e.target)`, and (b) interactive children that remove themselves on click (quick-reply chips, dismissible cards, one-shot buttons), use `e.composedPath()` instead: `path.indexOf(panel) !== -1`. `composedPath()` is captured at dispatch time before any removal, so it still reports the original ancestors correctly. Found and fixed this exact pattern in the EthioProperty Ask-AI chat widget (quick-reply chips / welcome-card chips / contact-card skip button all self-removed and were spuriously closing the whole chat panel).
