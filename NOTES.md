
# Implementation Notes

- `index.html` provides the semantic page structure, status regions, accessible seat map, and native checkout dialog.
- `styles.css` contains responsive styling, CSS Grid seat layouts, design tokens, light/dark themes, visible focus states, and success popup styling.
- `js/seats.js` is a pure JavaScript module responsible for seat selection rules, isolated-seat detection, pricing, and validation, with no DOM access.
- `js/app.js` loads `event.json`, renders accessible seat buttons, handles keyboard navigation, customer validation, checkout, and booking confirmation.
- Booking confirmation displays a success message with an OK button. Booking updates are maintained in browser memory.
- Run automated business logic tests using `node tests/seats.test.js` (Node.js only; no dependencies required).
- Keyboard accessibility: the seat map uses roving tabindex, arrow keys for navigation, and native button behavior for Enter/Space selection.
- Screen-reader support: seat buttons provide row, seat number, category, price, and availability state through accessible labels. Validation errors and booking confirmations use live regions.
- Manual accessibility verification with NVDA/VoiceOver and axe or Lighthouse has not been performed as part of this delivery.
- Future improvements: server-side booking persistence, real payment integration, reservation expiry, and end-to-end browser testing.
