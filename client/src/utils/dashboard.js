export function getFullName(record, fallback = "Unknown") {
  if (!record) {
    return fallback;
  }

  const fullName = [record.firstName, record.lastName].filter(Boolean).join(" ").trim();
  return fullName || record.name || fallback;
}

export function getInitials(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatRelativeSeconds(timestamp) {
  if (!timestamp) {
    return "just now";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 5) {
    return "just now";
  }

  return `${seconds}s ago`;
}

export function getPercentageChange(currentValue, previousValue) {
  if (!previousValue) {
    return 0;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
}

export function groupByDate(items, selector) {
  return items.reduce((accumulator, item) => {
    const key = new Date(selector(item)).toISOString().slice(0, 10);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

export function buildDateRange(length, formatter) {
  return Array.from({ length }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (length - index - 1));
    return formatter(date);
  });
}
