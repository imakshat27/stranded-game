# Story interface verification

Start the Vite frontend and FastAPI backend. `/qa/story.html` is a development-only fixture for shelter, weather, boat parts, and ACTIVE/WON/LOST states. It uses no saved expedition and is not part of the production entry.

- Restore an existing expedition; inspect choices and map markers without committing. Verify condition, inventory, and turn counts remain unchanged.
- Select each illustrated scene; preview a locked action and verify its reason and disabled commit button. Commit only in a disposable expedition, then verify server costs and day advancement.
- Open Bag → Escape plan. Check boat readiness, next step, and current availability. Preview a crisis; confirm the hypothetical route has no action buttons.
- Open Your journey. Inspect a historical turn and compare teal recorded states with dashed simulated alternatives. Pan, zoom, fit, focus current turn, expand/collapse branches, and inspect nodes by keyboard and touch.
- Run Search & Compare; switch through all seven algorithms. Replay, step, scrub, and compare two traces on the same recorded starting state. Failed searches must show no established route cost or winner.
- Try Risk experiments and Rival sandbox. Confirm they leave the expedition unchanged. Inspect calculation/search details only on demand.
- Review the report before any action and after several turns; check zero-valued profile metrics and resource timeline ordering.
- Check 390px, 768px, and desktop widths for overflow and reading order. Check reduced-motion rules. Verify terminal result dismissal, reopening, and restart confirmation using the fixture or a disposable expedition.

Backend regression tests cover recorded snapshots, missing legacy snapshots, restart boundaries, simulation isolation, equal search budgets, unique trace IDs, traversal-node references, and already-completed goals.
