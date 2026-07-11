---
name: High z-index popups silently eat clicks
description: A fixed-position modal/backdrop with a near-max z-index (e.g. 2147483644) intercepts clicks meant for elements visually underneath it, even elements that look clickable through blur/transparency.
---

If a user reports "clicking X does nothing" for a button/toggle that visually overlaps the screen region where a timed popup (newsletter signup, cookie banner, subscribe modal, etc.) appears, check whether the popup's backdrop or card has an extremely high `z-index` and whether its screen position overlaps the reported-broken control.

**Why:** Browsers resolve real clicks via `elementFromPoint` hit-testing against the actual DOM stacking order, not visual appearance. A `position:fixed; inset:0; z-index:2147483644` backdrop (or a centered card at an even higher z-index) will absorb clicks anywhere in its bounds, including over buttons that appear visible/blurred-but-usable behind it. This is invisible in static screenshots taken before the popup's timer fires, and easy to miss without interactive testing.

**How to apply:**
- Confirm with `document.elementFromPoint(x, y)` at the target button's coordinates while the popup is showing — if it returns the popup/backdrop instead of the intended element, that's the bug.
- Don't just raise the underlying element's z-index above the popup — if they occupy the same screen region, that just flips which one visually renders on top and looks broken either way.
- Prefer: delay/reschedule the popup's appearance while the user is actively interacting (clicks/keydown/touchstart) so it only shows once the user is idle, and optionally make backdrop clicks "pass through" to the element underneath after dismissing (via `elementFromPoint` + `.click()`) for defense in depth.
</content>
