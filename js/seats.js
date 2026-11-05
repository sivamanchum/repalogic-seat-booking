/**
 * Pure seat and pricing rules. No DOM access or browser dependencies.
 * All prices are integer cents.
 */

export function getSeatPrice(event, seatId) {
  const match = /^([A-F])(10|[1-9])$/.exec(seatId);
  if (!match) throw new Error(`Invalid seat ID: ${seatId}`);
  const category = event.rows[match[1]];
  const price = event.categories[category];
  if (!Number.isInteger(price) || price < 0) {
    throw new Error(`Missing or invalid price for category: ${category}`);
  }
  return price;
}

export function calculatePrice(event, selectedSeats) {
  const subtotal = selectedSeats.reduce((sum, seatId) => sum + getSeatPrice(event, seatId), 0);
  const discount = selectedSeats.length >= 4 ? Math.round(subtotal * 0.10) : 0;
  return { subtotal, discount, total: subtotal - discount };
}

/**
 * A free seat is isolated when it is next to a selected seat and the seat
 * on its other side is unavailable (sold/selected) or the row boundary.
 */
export function findIsolatedSeats(selectedSeats, soldSeats = []) {
  const selected = new Set(selectedSeats);
  const sold = new Set(soldSeats);
  const isolated = new Set();

  for (const seatId of selected) {
    const match = /^([A-F])(10|[1-9])$/.exec(seatId);
    if (!match) continue;
    const row = match[1];
    const seatNumber = Number(match[2]);

    for (const direction of [-1, 1]) {
      const freeNumber = seatNumber + direction;
      if (freeNumber < 1 || freeNumber > 10) continue;

      const freeSeat = `${row}${freeNumber}`;
      if (selected.has(freeSeat) || sold.has(freeSeat)) continue;

      const beyondNumber = freeNumber + direction;
      const beyondIsUnavailable =
        beyondNumber < 1 ||
        beyondNumber > 10 ||
        selected.has(`${row}${beyondNumber}`) ||
        sold.has(`${row}${beyondNumber}`);

      if (beyondIsUnavailable) isolated.add(freeSeat);
    }
  }
  return [...isolated].sort((a, b) => a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1)));
}

export function validateSelection(selectedSeats, soldSeats = []) {
  const problems = [];
  const selected = [...new Set(selectedSeats)];

  if (selected.length === 0) problems.push("Select at least one seat to continue.");
  if (selected.length > 6) problems.push("You can book a maximum of 6 seats.");
  const soldConflicts = selected.filter((seatId) => soldSeats.includes(seatId));
  if (soldConflicts.length) problems.push(`These seats are already sold: ${soldConflicts.join(", ")}.`);
  const isolated = findIsolatedSeats(selected, soldSeats);
  if (isolated.length) {
    problems.push(`Your selection leaves ${isolated.join(", ")} as a single free seat. Please adjust your selection.`);
  }
  return { valid: problems.length === 0, problems, isolated };
}

export function getSeatState(event, selectedSeats, seatId) {
  if ((event.sold || []).includes(seatId)) return "sold";
  if (selectedSeats.includes(seatId)) return "selected";
  return "available";
}