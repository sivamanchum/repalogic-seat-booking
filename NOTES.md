# Implementation notes

- `index.html` provides semantic page structure, status regions, a seat map and a native checkout dialog.
- `styles.css` contains responsive styling, CSS Grid seats, design tokens, light/dark themes and visible focus states.
- `js/seats.js` is a pure module for seat rules, isolated-seat detection, pricing and validation; it has no DOM access.
- `js/app.js` loads `event.json`, renders accessible seat buttons, handles checkout and keyboard navigation.
- Run the automated logic tests with `node tests/seats.test.js` (Node.js only; no dependencies).
- Keyboard checks: Tab enters/leaves the map in one stop; arrow keys move between available seats; Enter/Space selects.
- Screen-reader checks: seat buttons expose row, number, category, price and state; errors and booking confirmation use live regions.
- Manual accessibility checks should include NVDA/VoiceOver and axe or Lighthouse; these tools were not run as part of this delivery.
- With more time: add server-side booking persistence, real payment integration, reservation expiry and end-to-end browser tests.
