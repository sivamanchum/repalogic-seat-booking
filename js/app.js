import { calculatePrice, getSeatPrice, getSeatState, validateSelection } from "./seats.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  title: $("#event-title"), loading: $("#loading"), error: $("#error-panel"),
  errorMessage: $("#error-message"), retry: $("#retry-button"),
  content: $("#booking-content"), map: $("#seat-map"),
  selectedSeats: $("#selected-seats"), count: $("#seat-count"),
  subtotal: $("#subtotal"), discountLine: $("#discount-line"),
  discount: $("#discount"), total: $("#total"),
  continue: $("#continue-button"), validation: $("#validation-summary"),
  validationList: $("#validation-list"), dialog: $("#checkout-dialog"),
  form: $("#checkout-form"), closeDialog: $("#close-dialog"),
  name: $("#customer-name"), email: $("#customer-email"),
  nameError: $("#name-error"), emailError: $("#email-error"),
  dialogProblems: $("#dialog-problems"), dialogProblemList: $("#dialog-problem-list"),
  dialogTotal: $("#dialog-total"), announcement: $("#announcement"),
  themeToggle: $("#theme-toggle"), themeLabel: $(".theme-label")
};

const currency = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
let eventData = null;
let selectedSeats = [];
let seatButtons = new Map();
let lastFocusedSeat = null;

function announce(message) {
  elements.announcement.textContent = "";
  window.setTimeout(() => { elements.announcement.textContent = message; }, 20);
}

function formatCents(cents) {
  return currency.format(cents / 100);
}

async function loadEvent() {
  elements.loading.hidden = false;
  elements.error.hidden = true;
  elements.content.hidden = true;
  try {
    const response = await fetch("./event.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const data = await response.json();
    if (!data || !data.categories || !data.rows || !Array.isArray(data.sold)) {
      throw new Error("The event data is incomplete.");
    }
    eventData = data;
    // textContent prevents the supplied event name from being interpreted as HTML.
    elements.title.textContent = data.name;
    selectedSeats = [];
    renderSeatMap();
    updateSummary();
    elements.loading.hidden = true;
    elements.content.hidden = false;
  } catch (error) {
    elements.loading.hidden = true;
    elements.errorMessage.textContent = `${error.message} Please try again.`;
    elements.error.hidden = false;
  }
}

function renderSeatMap() {
  elements.map.replaceChildren();
  seatButtons.clear();
  const fragment = document.createDocumentFragment();

  for (const row of Object.keys(eventData.rows)) {
    const rowLabel = document.createElement("span");
    rowLabel.className = "row-label";
    rowLabel.textContent = row;
    rowLabel.setAttribute("aria-hidden", "true");
    fragment.append(rowLabel);

    for (let number = 1; number <= 10; number += 1) {
      const seatId = `${row}${number}`;
      const state = getSeatState(eventData, selectedSeats, seatId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `seat ${state}`;
      button.dataset.seat = seatId;
      button.setAttribute("aria-pressed", String(state === "selected"));
      button.disabled = state === "sold";
      button.tabIndex = seatButtons.size === 0 ? 0 : -1;
      const category = eventData.rows[row];
      const readableState = state === "sold" ? "sold" : state === "selected" ? "selected" : "available";
      button.setAttribute("aria-label", `Row ${row}, seat ${number}, ${category}, ${formatCents(getSeatPrice(eventData, seatId))}, ${readableState}`);
      const numberSpan = document.createElement("span");
      numberSpan.className = "seat-number";
      numberSpan.textContent = String(number);
      button.append(numberSpan);
      button.addEventListener("click", () => toggleSeat(seatId));
      button.addEventListener("keydown", handleSeatKeydown);
      fragment.append(button);
      seatButtons.set(seatId, button);
    }
  }
  elements.map.append(fragment);
}

function toggleSeat(seatId) {
  const button = seatButtons.get(seatId);
  if (!button || button.disabled) return;
  lastFocusedSeat = seatId;
  if (selectedSeats.includes(seatId)) {
    selectedSeats = selectedSeats.filter((id) => id !== seatId);
  } else {
    selectedSeats = [...selectedSeats, seatId];
  }
  renderSeatMap();
  updateSummary();
  seatButtons.get(seatId)?.focus();
  elements.validation.hidden = true;
}

function handleSeatKeydown(event) {
  const current = event.currentTarget.dataset.seat;
  const row = current[0];
  const number = Number(current.slice(1));
  const rowOrder = Object.keys(eventData.rows);
  let nextRow = row;
  let nextNumber = number;

  switch (event.key) {
    case "ArrowRight": nextNumber = Math.min(10, number + 1); break;
    case "ArrowLeft": nextNumber = Math.max(1, number - 1); break;
    case "ArrowDown": nextRow = rowOrder[Math.min(rowOrder.length - 1, rowOrder.indexOf(row) + 1)]; break;
    case "ArrowUp": nextRow = rowOrder[Math.max(0, rowOrder.indexOf(row) - 1)]; break;
    default: return;
  }
  event.preventDefault();
  let target = seatButtons.get(`${nextRow}${nextNumber}`);
  // Skip sold seats in the direction of travel where possible.
  if (target?.disabled) {
    const vertical = nextRow !== row;
    const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    for (let attempt = 0; attempt < 10 && target?.disabled; attempt += 1) {
      if (vertical) {
        const candidateRow = rowOrder[rowOrder.indexOf(nextRow) + step * (attempt + 1)];
        if (!candidateRow) break;
        target = seatButtons.get(`${candidateRow}${nextNumber}`);
      } else {
        const candidateNumber = nextNumber + step * (attempt + 1);
        if (candidateNumber < 1 || candidateNumber > 10) break;
        target = seatButtons.get(`${nextRow}${candidateNumber}`);
      }
    }
  }
  if (target && !target.disabled) {
    elements.map.querySelectorAll(".seat").forEach((seat) => { seat.tabIndex = -1; });
    target.tabIndex = 0;
    target.focus();
  }
}

function updateSummary() {
  const price = calculatePrice(eventData, selectedSeats);
  const sortedSeats = [...selectedSeats].sort((a, b) => a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1)));
  elements.selectedSeats.textContent = sortedSeats.length ? sortedSeats.join(", ") : "No seats selected";
  elements.count.textContent = String(selectedSeats.length);
  elements.subtotal.textContent = formatCents(price.subtotal);
  elements.discount.textContent = `−${formatCents(price.discount)}`;
  elements.discountLine.hidden = price.discount === 0;
  elements.total.textContent = formatCents(price.total);
  elements.dialogTotal.textContent = formatCents(price.total);
}

function showProblems(container, list, problems) {
  list.replaceChildren();
  for (const problem of problems) {
    const item = document.createElement("li");
    item.textContent = problem;
    list.append(item);
  }
  container.hidden = problems.length === 0;
}

function validateAndShow() {
  const result = validateSelection(selectedSeats, eventData.sold);
  showProblems(elements.validation, elements.validationList, result.problems);
  if (!result.valid) {
    elements.validation.scrollIntoView({ behavior: "smooth", block: "nearest" });
    elements.validation.querySelector("h3").focus?.();
    return false;
  }
  return true;
}

function clearFieldErrors() {
  for (const input of [elements.name, elements.email]) {
    input.removeAttribute("aria-invalid");
  }
  elements.nameError.textContent = "";
  elements.emailError.textContent = "";
  elements.dialogProblems.hidden = true;
}

function validateCustomer() {
  clearFieldErrors();
  const problems = [];
  let firstInvalid = null;
  const name = elements.name.value.trim();
  const email = elements.email.value.trim();
  if (!name) {
    problems.push("Enter your full name.");
    elements.name.setAttribute("aria-invalid", "true");
    elements.nameError.textContent = "Full name is required.";
    firstInvalid ||= elements.name;
  }
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!email) {
    problems.push("Enter your email address.");
    elements.email.setAttribute("aria-invalid", "true");
    elements.emailError.textContent = "Email address is required.";
    firstInvalid ||= elements.email;
  } else if (!validEmail) {
    problems.push("Enter a valid email address.");
    elements.email.setAttribute("aria-invalid", "true");
    elements.emailError.textContent = "Enter a valid email address.";
    firstInvalid ||= elements.email;
  }
  showProblems(elements.dialogProblems, elements.dialogProblemList, problems);
  firstInvalid?.focus();
  return problems.length === 0;
}

elements.continue.addEventListener("click", () => {
  if (!validateAndShow()) return;
  elements.name.value = "";
  elements.email.value = "";
  clearFieldErrors();
  updateSummary();
  elements.dialog.showModal();
  elements.name.focus();
});

elements.closeDialog.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("cancel", () => {
  // Native Escape handling closes the dialog; focus is restored below.
});
elements.dialog.addEventListener("close", () => {
  elements.continue.focus();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const selection = validateSelection(selectedSeats, eventData.sold);
  if (!selection.valid) {
    showProblems(elements.dialogProblems, elements.dialogProblemList, selection.problems);
    return;
  }
  if (!validateCustomer()) return;

  eventData.sold = [...new Set([...eventData.sold, ...selectedSeats])];
  const bookedCount = selectedSeats.length;
  selectedSeats = [];
  elements.dialog.close();
  renderSeatMap();
  updateSummary();
  elements.validation.hidden = true;
  announce(`Booking confirmed. ${bookedCount} seat${bookedCount === 1 ? "" : "s"} booked.`);
});

elements.retry.addEventListener("click", loadEvent);

elements.themeToggle.addEventListener("click", () => {
  const root = document.documentElement;
  const isDark = root.dataset.theme !== "dark";
  root.dataset.theme = isDark ? "dark" : "light";
  elements.themeLabel.textContent = isDark ? "Use light mode" : "Use dark mode";
  elements.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
});

loadEvent();