import assert from "node:assert/strict";
import {
  calculatePrice,
  findIsolatedSeats,
  getSeatPrice,
  validateSelection
} from "../js/seats.js";

const event = {
  categories: { Front: 900, Standard: 1200, Premium: 1500 },
  rows: { A: "Front", B: "Front", C: "Standard", D: "Standard", E: "Premium", F: "Premium" },
  sold: ["C4", "C5", "D1", "D2", "E10"]
};

// Required challenge cases.
assert.equal(validateSelection(["C3"], event.sold).valid, true, "C3 should be valid");
assert.equal(validateSelection(["C9"], event.sold).valid, false, "C9 leaves C10 alone");
assert.deepEqual(findIsolatedSeats(["C9"], event.sold), ["C10"]);
assert.equal(validateSelection(["C7"], event.sold).valid, false, "C7 leaves C6 alone");
assert.deepEqual(findIsolatedSeats(["C7"], event.sold), ["C6"]);
assert.equal(validateSelection(["C6", "C7", "C8"], event.sold).valid, true);
assert.equal(validateSelection(["C1", "C2"], event.sold).valid, false, "C1,C2 leaves C3 alone");
assert.equal(validateSelection(["C1", "C2", "C3"], event.sold).valid, true);
assert.equal(validateSelection(["A1", "A2", "A3", "A4", "A5", "A6", "A7"], event.sold).valid, false);

// Required pricing case: 2 x €9 + 2 x €15 = €48; 10% discount = €4.80.
const priced = calculatePrice(event, ["B1", "B2", "F5", "F6"]);
assert.deepEqual(priced, { subtotal: 4800, discount: 480, total: 4320 });
assert.equal(getSeatPrice(event, "C1"), 1200);

// Additional edge cases.
assert.equal(validateSelection([], event.sold).valid, false, "empty selection is invalid");
assert.equal(validateSelection(["C4"], event.sold).valid, false, "sold seats cannot be selected by UI");
assert.equal(calculatePrice(event, ["A1", "A2", "A3"]).discount, 0);
assert.equal(calculatePrice(event, ["A1", "A2", "A3", "A4"]).discount, 360);
assert.deepEqual(findIsolatedSeats(["A9"], []), ["A10"], "the last seat is isolated at the row boundary");
assert.deepEqual(findIsolatedSeats(["A8", "A9"], []), ["A10"], "the last seat is isolated next to a selected seat");

console.log("All seat booking tests passed.");
