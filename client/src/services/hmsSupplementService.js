import { generatePatientId } from "../utils/generatePatientId";

const STORAGE_KEY = "hms_supplement_data_v1";
const NOTIFICATION_READ_KEY = "hms_notification_reads_v2";

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeDate(value) {
  return new Date(value).toISOString();
}

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (_error) {
    return null;
  }
}

function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("hms:supplement-updated"));
  return data;
}

function withDefaults(data) {
  return {
    patientCodes: {},
    diagnoses: [],
    prescriptions: [],
    diagnosisNotes: [],
    tests: [],
    reminders: [],
    notifications: [],
    appointmentMeta: {},
    invoiceMeta: {},
    doctorProfiles: {},
    auditTrail: [],
    ...data,
  };
}

function buildSeedData(seed = {}) {
  const patients = seed.patients || [];
  const doctors = seed.doctors || [];
  const appointments = seed.appointments || [];
  const billing = seed.billing || [];

  const firstPatient = patients[0];
  const secondPatient = patients[1] || firstPatient;
  const firstDoctor = doctors[0];
  const secondDoctor = doctors[1] || firstDoctor;
  const firstAppointment = appointments[0];
  const secondAppointment = appointments[1] || firstAppointment;

  return {
    patientCodes: patients.reduce((accumulator, patient, index) => {
      accumulator[patient._id] = patient.patientCode || generatePatientId(patients.slice(0, index));
      return accumulator;
    }, {}),
    diagnoses: firstPatient && firstDoctor ? [
      {
        id: createId("diag"),
        patientId: firstPatient._id,
        diseaseName: "Hypertension",
        icd10: "I10",
        dateDiagnosed: normalizeDate(firstAppointment?.appointmentDate || new Date()),
        severity: "Moderate",
        currentStatus: "Chronic",
        doctorId: firstDoctor._id,
      },
      {
        id: createId("diag"),
        patientId: secondPatient?._id,
        diseaseName: "Seasonal Migraine",
        icd10: "G43.9",
        dateDiagnosed: normalizeDate(secondAppointment?.appointmentDate || new Date()),
        severity: "Mild",
        currentStatus: "Active",
        doctorId: secondDoctor?._id,
      },
    ] : [],
    prescriptions: firstPatient && firstDoctor ? [
      {
        id: createId("rx"),
        patientId: firstPatient._id,
        appointmentId: firstAppointment?._id || "",
        diagnosisId: "",
        doctorId: firstDoctor._id,
        date: normalizeDate(firstAppointment?.appointmentDate || new Date()),
        status: "Active",
        notes: "Continue low-sodium diet and daily blood pressure tracking.",
        medicines: [
          { name: "Amlodipine", dose: "5 mg", frequency: "Once daily", duration: "30 days", instructions: "After breakfast" },
          { name: "Telmisartan", dose: "40 mg", frequency: "Once daily", duration: "30 days", instructions: "At bedtime" },
        ],
      },
    ] : [],
    diagnosisNotes: firstPatient && firstDoctor ? [
      {
        id: createId("note"),
        patientId: firstPatient._id,
        appointmentId: firstAppointment?._id || "",
        diagnosisId: "",
        doctorId: firstDoctor._id,
        tag: "Observation",
        content: "Patient reports improved evening readings. Continue monitoring for 2 weeks.",
        timestamp: normalizeDate(new Date()),
      },
    ] : [],
    tests: firstPatient && firstDoctor ? [
      {
        id: createId("test"),
        patientId: firstPatient._id,
        appointmentId: firstAppointment?._id || "",
        doctorId: firstDoctor._id,
        testName: "Lipid Profile",
        date: normalizeDate(new Date()),
        department: "Biochemistry Lab",
        status: "Reviewed",
        resultValue: "LDL 118 mg/dL",
        fileName: "lipid-profile.pdf",
      },
      {
        id: createId("test"),
        patientId: secondPatient?._id,
        appointmentId: secondAppointment?._id || "",
        doctorId: secondDoctor?._id,
        testName: "MRI Brain",
        date: normalizeDate(new Date(Date.now() - 86400000 * 4)),
        department: "Radiology",
        status: "Pending",
        resultValue: "",
        fileName: "",
      },
    ] : [],
    reminders: patients.map((patient) => ({
      patientId: patient._id,
      optIn: true,
      preferredChannel: "Both",
      emailTemplate: "Your appointment with Dr. [Name] is on [Date] at [Time]",
      smsTemplate: "Your appointment with Dr. [Name] is on [Date] at [Time]",
    })),
    notifications: billing.slice(0, 2).map((item) => ({
      id: createId("notif"),
      category: "Billing",
      type: item.paymentStatus === "Paid" ? "payment received" : "payment due",
      title: item.paymentStatus === "Paid" ? "Payment received" : "Invoice payment due",
      detail: item.serviceDescription,
      entityId: item._id,
      entityType: "billing",
      createdAt: normalizeDate(item.createdAt || new Date()),
      targetPath: "/admin/billing",
      targetRoles: ["super_admin", "patient", "receptionist"],
    })),
    appointmentMeta: appointments.reduce((accumulator, appointment, index) => {
      accumulator[appointment._id] = {
        appointmentType: index % 5 === 0 ? "Follow-up" : index % 4 === 0 ? "Telemedicine" : "In-person",
        department: appointment.doctorId?.departmentId?.name || "General Medicine",
        slotStatus: index % 6 === 0 ? "on-hold" : index % 5 === 0 ? "booked" : "available",
        displayStatus:
          appointment.status === "Scheduled"
            ? index % 3 === 0
              ? "Confirmed"
              : "Scheduled"
            : appointment.status === "In-Progress"
              ? "In Progress"
              : appointment.status,
        reminderChannels: ["Email", "SMS"],
      };
      return accumulator;
    }, {}),
    invoiceMeta: billing.reduce((accumulator, item) => {
      accumulator[item._id] = {
        status:
          item.paymentStatus === "Paid"
            ? "Paid"
            : item.paymentStatus === "Partially Paid"
              ? "Partially Paid"
              : "Sent",
        paidAmount: item.paymentStatus === "Paid" ? item.totalAmount : item.paymentStatus === "Partially Paid" ? item.totalAmount / 2 : 0,
        lineItems: [
          {
            description: item.serviceDescription,
            quantity: 1,
            unitPrice: item.amount || item.totalAmount,
            discount: item.discount || 0,
            tax: item.tax || 0,
            subtotal: item.totalAmount,
          },
        ],
      };
      return accumulator;
    }, {}),
    doctorProfiles: doctors.reduce((accumulator, doctor, index) => {
      accumulator[doctor._id] = {
        availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        availableHours: "09:00 AM - 05:00 PM",
        rating: Number((4.2 + ((index % 7) * 0.1)).toFixed(1)),
        reviews: 18 + index * 3,
      };
      return accumulator;
    }, {}),
    auditTrail: [],
  };
}

export function ensureSupplementData(seed = {}) {
  const current = readStorage();
  if (current) {
    return writeStorage(withDefaults(current));
  }

  const seeded = buildSeedData(seed);
  return writeStorage(seeded);
}

export function getSupplementData() {
  return withDefaults(readStorage() || buildSeedData());
}

export function updateSupplementData(updater) {
  const current = getSupplementData();
  const next = updater(structuredClone ? structuredClone(current) : JSON.parse(JSON.stringify(current)));
  return writeStorage(next);
}

export function addDiagnosis(payload, actor) {
  return updateSupplementData((data) => {
    data.diagnoses.unshift({ id: createId("diag"), ...payload });
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: "Add Diagnosis",
      module: "Patient Profile",
      details: `${payload.diseaseName} added`,
    });
    return data;
  });
}

export function saveDiagnosisNote(payload, actor) {
  return updateSupplementData((data) => {
    data.diagnosisNotes.unshift({ id: createId("note"), timestamp: normalizeDate(new Date()), ...payload });
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: "Save Note",
      module: "Diagnosis Notes",
      details: payload.tag,
    });
    return data;
  });
}

export function savePrescription(payload, actor) {
  return updateSupplementData((data) => {
    data.prescriptions.unshift({ id: createId("rx"), date: normalizeDate(new Date()), ...payload });
    data.notifications.unshift({
      id: createId("notif"),
      category: "Medical",
      type: "new prescription",
      title: "New prescription added",
      detail: payload.notes || "Prescription available for download",
      entityId: payload.patientId,
      entityType: "patient",
      createdAt: normalizeDate(new Date()),
      targetPath: "/doctor/dashboard",
      targetRoles: ["doctor", "patient", "super_admin"],
    });
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: "Create Prescription",
      module: "Prescriptions",
      details: `${payload.medicines.length} medicines added`,
    });
    return data;
  });
}

export function saveReminderSettings(payload, actor) {
  return updateSupplementData((data) => {
    const existingIndex = data.reminders.findIndex((item) => item.patientId === payload.patientId);
    if (existingIndex >= 0) {
      data.reminders[existingIndex] = payload;
    } else {
      data.reminders.push(payload);
    }
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: "Update Reminder Settings",
      module: "Notifications",
      details: payload.preferredChannel,
    });
    return data;
  });
}

export function saveAppointmentNotifications(appointment, actor, roles = ["patient", "doctor", "super_admin", "receptionist"]) {
  return updateSupplementData((data) => {
    data.notifications.unshift({
      id: createId("notif"),
      category: "Appointment",
      type: "confirmed",
      title: "Appointment confirmed",
      detail: `Appointment scheduled for ${new Date(appointment.appointmentDate || appointment.date).toLocaleDateString("en-IN")} at ${appointment.appointmentTime || appointment.time}`,
      entityId: appointment._id || appointment.id,
      entityType: "appointment",
      createdAt: normalizeDate(new Date()),
      targetPath: "/admin/appointments",
      targetRoles: roles,
    });
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: "Book Appointment",
      module: "Appointments",
      details: appointment.reasonForVisit || appointment.reason || "Appointment created",
    });
    return data;
  });
}

export function saveAppointmentStatusNotification(appointment, status, actor) {
  return updateSupplementData((data) => {
    data.notifications.unshift({
      id: createId("notif"),
      category: "Appointment",
      type: status.toLowerCase(),
      title: `Appointment ${status.toLowerCase()}`,
      detail: appointment.reasonForVisit || appointment.reason || "Status updated",
      entityId: appointment._id || appointment.id,
      entityType: "appointment",
      createdAt: normalizeDate(new Date()),
      targetPath: "/admin/appointments",
      targetRoles: ["super_admin", "doctor", "patient", "receptionist"],
    });
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: `Appointment ${status}`,
      module: "Appointments",
      details: appointment.reasonForVisit || appointment.reason || "Status updated",
    });
    return data;
  });
}

export function saveAppointmentMeta(appointmentId, payload) {
  return updateSupplementData((data) => {
    data.appointmentMeta[appointmentId] = {
      ...(data.appointmentMeta[appointmentId] || {}),
      ...payload,
    };
    return data;
  });
}

export function saveInvoiceNotification(invoice, actor) {
  return updateSupplementData((data) => {
    data.notifications.unshift({
      id: createId("notif"),
      category: "Billing",
      type: "invoice generated",
      title: "Invoice generated",
      detail: invoice.invoiceNumber || "Billing record created",
      entityId: invoice._id || invoice.id,
      entityType: "billing",
      createdAt: normalizeDate(new Date()),
      targetPath: "/admin/billing",
      targetRoles: ["super_admin", "patient", "receptionist"],
    });
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: "Create Invoice",
      module: "Billing",
      details: invoice.invoiceNumber || invoice.serviceDescription,
    });
    return data;
  });
}

export function saveInvoiceMeta(invoiceId, payload) {
  return updateSupplementData((data) => {
    data.invoiceMeta[invoiceId] = {
      ...(data.invoiceMeta[invoiceId] || {}),
      ...payload,
    };
    return data;
  });
}

export function saveTestResult(payload, actor) {
  return updateSupplementData((data) => {
    const index = data.tests.findIndex((item) => item.id === payload.id);
    if (index >= 0) {
      data.tests[index] = { ...data.tests[index], ...payload };
    } else {
      data.tests.unshift({ id: createId("test"), ...payload });
    }
    data.notifications.unshift({
      id: createId("notif"),
      category: "Medical",
      type: "test result ready",
      title: "Lab test result ready",
      detail: payload.testName,
      entityId: payload.patientId,
      entityType: "patient",
      createdAt: normalizeDate(new Date()),
      targetPath: "/patient/dashboard",
      targetRoles: ["patient", "doctor", "lab_staff", "super_admin"],
    });
    data.auditTrail.unshift({
      id: createId("audit"),
      timestamp: normalizeDate(new Date()),
      user: actor?.name || "System",
      action: "Upload Test Result",
      module: "Lab Reports",
      details: payload.testName,
    });
    return data;
  });
}

export function getPatientSupplement(patientId) {
  const data = getSupplementData();
  return {
    patientCode: data.patientCodes[patientId],
    diagnoses: data.diagnoses.filter((item) => item.patientId === patientId),
    prescriptions: data.prescriptions.filter((item) => item.patientId === patientId),
    diagnosisNotes: data.diagnosisNotes.filter((item) => item.patientId === patientId),
    tests: data.tests.filter((item) => item.patientId === patientId),
    reminder: data.reminders.find((item) => item.patientId === patientId) || null,
  };
}

export function getAppointmentMeta(appointmentId) {
  return getSupplementData().appointmentMeta?.[appointmentId] || null;
}

export function getInvoiceMeta(invoiceId) {
  return getSupplementData().invoiceMeta?.[invoiceId] || null;
}

export function getDoctorProfileMeta(doctorId) {
  return getSupplementData().doctorProfiles?.[doctorId] || null;
}

function deriveReadMap() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || "{}");
  } catch (_error) {
    return {};
  }
}

function writeReadMap(map) {
  localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(map));
}

export function getNotificationsForUser(user, context = {}) {
  const data = getSupplementData();
  const role = user?.role;
  const emailKey = user?.email || "anonymous";
  const readMap = deriveReadMap();
  const readIds = readMap[emailKey] || [];

  const derivedUpcoming = (context.appointments || [])
    .filter((item) => item.status === "Scheduled")
    .slice(0, 3)
    .flatMap((appointment) => ([
      {
        id: `upcoming-24-${appointment._id}`,
        category: "Appointment",
        type: "upcoming",
        title: "Upcoming appointment reminder",
        detail: `${appointment.appointmentTime} • ${appointment.reasonForVisit || "Visit scheduled"}`,
        targetPath: role === "patient" ? "/patient/appointments" : role === "doctor" ? "/doctor/appointments" : "/staff/appointments",
        targetRoles: [role],
        createdAt: normalizeDate(new Date()),
      },
      {
        id: `upcoming-2-${appointment._id}`,
        category: "Appointment",
        type: "upcoming",
        title: "2-hour appointment reminder",
        detail: `${appointment.appointmentTime} • ${appointment.reasonForVisit || "Visit scheduled"}`,
        targetPath: role === "patient" ? "/patient/appointments" : role === "doctor" ? "/doctor/appointments" : "/staff/appointments",
        targetRoles: [role],
        createdAt: normalizeDate(new Date()),
      },
    ]));

  const items = [...derivedUpcoming, ...data.notifications]
    .filter((item) => !item.targetRoles || item.targetRoles.includes(role))
    .map((item) => ({ ...item, read: readIds.includes(item.id) }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return items;
}

export function markNotificationRead(user, notificationId) {
  const emailKey = user?.email || "anonymous";
  const map = deriveReadMap();
  const next = new Set(map[emailKey] || []);
  next.add(notificationId);
  map[emailKey] = Array.from(next);
  writeReadMap(map);
}

export function markAllNotificationsRead(user, notifications) {
  const emailKey = user?.email || "anonymous";
  const map = deriveReadMap();
  map[emailKey] = notifications.map((item) => item.id);
  writeReadMap(map);
}

export function deleteNotification(notificationId) {
  return updateSupplementData((data) => {
    data.notifications = data.notifications.filter((item) => item.id !== notificationId);
    return data;
  });
}

export function searchGrouped(query, context = {}) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) {
    return { patients: [], doctors: [], appointments: [] };
  }

  return {
    patients: (context.patients || []).filter((item) => `${item.firstName} ${item.lastName} ${item._id}`.toLowerCase().includes(normalized)).slice(0, 5),
    doctors: (context.doctors || []).filter((item) => `${item.firstName} ${item.lastName} ${item.specialization}`.toLowerCase().includes(normalized)).slice(0, 5),
    appointments: (context.appointments || []).filter((item) => {
      const patientName = `${item.patientId?.firstName || ""} ${item.patientId?.lastName || ""}`;
      const doctorName = `${item.doctorId?.firstName || ""} ${item.doctorId?.lastName || ""}`;
      return `${patientName} ${doctorName} ${item._id}`.toLowerCase().includes(normalized);
    }).slice(0, 5),
  };
}

export function getAuditTrail() {
  return getSupplementData().auditTrail;
}
