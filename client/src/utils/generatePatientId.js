export function generatePatientId(existingPatients = []) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `P-${yy}${mm}-`;

  const thisMonthIds = existingPatients
    .map((p) => p?.patientId || p?.patientCode)
    .filter((id) => id && id.startsWith(prefix))
    .map((id) => Number.parseInt(id.replace(prefix, ""), 10))
    .filter((n) => Number.isFinite(n));

  const nextNum = thisMonthIds.length > 0 ? Math.max(...thisMonthIds) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
