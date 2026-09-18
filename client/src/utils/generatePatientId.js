export function generatePatientId(existingPatients = []) {
  const ids = existingPatients
    .map((p) => p?.patientId || p?.patientCode)
    .filter((id) => id && /^P\d+$/i.test(id))
    .map((id) => Number.parseInt(id.replace(/^P/i, ""), 10))
    .filter((n) => Number.isFinite(n));

  const nextNum = ids.length > 0 ? Math.max(...ids) + 1 : existingPatients.length + 1;
  return `P${String(nextNum).padStart(3, "0")}`;
}

