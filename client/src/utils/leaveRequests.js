const STORAGE_KEY = "hms_leave_requests";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getLeaveRequests() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (_error) {
    return [];
  }
}

export function saveLeaveRequest(request) {
  const requests = getLeaveRequests();
  const nextRequests = [
    {
      id: request.id || `leave-${Date.now()}`,
      status: request.status || "Pending",
      createdAt: request.createdAt || new Date().toISOString(),
      ...request,
    },
    ...requests,
  ];

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRequests));
    window.dispatchEvent(new CustomEvent("hms:leave-requests-updated"));
  }

  return nextRequests;
}

export function updateLeaveRequestStatus(id, status) {
  const requests = getLeaveRequests();
  const nextRequests = requests.map((request) => (request.id === id ? { ...request, status } : request));

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRequests));
    window.dispatchEvent(new CustomEvent("hms:leave-requests-updated"));
  }

  return nextRequests;
}
