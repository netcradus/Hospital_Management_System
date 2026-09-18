import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { HiOutlineArrowDownTray, HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlineCalendar } from "react-icons/hi2";
import { toast } from "sonner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { createEntityService } from "../../services/entityService";
import api from "../../services/api";
import {
  ensureSupplementData,
  getAppointmentMeta,
  saveAppointmentMeta,
  saveAppointmentNotifications,
  saveAppointmentStatusNotification,
} from "../../services/hmsSupplementService";
import { canAccess } from "../../config/rbac";

const appointmentService = createEntityService("appointments");
const patientService = createEntityService("patients");
const doctorService = createEntityService("doctors");
const departmentService = createEntityService("departments");

const defaultForm = {
  patientId: "",
  doctorId: "",
  departmentId: "",
  department: "",
  appointmentDate: "",
  appointmentTime: "",
  duration: 30,
  appointmentType: "In-person",
  reasonForVisit: "",
};

const slotDurations = [15, 20, 30];
const bookingStatuses = ["Scheduled", "Confirmed", "In Progress", "Completed", "Cancelled", "No-Show"];
const typeColors = {
  "In-person": "default",
  Telemedicine: "info",
  "Follow-up": "warning",
  Emergency: "danger",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

function generateSlots(duration) {
  const slots = [];
  for (let hour = 9; hour < 18; hour += 1) {
    for (let minute = 0; minute < 60; minute += duration) {
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      slots.push(date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }));
    }
  }
  return slots;
}

function csvDownload(rows) {
  const header = ["Appointment ID", "Patient", "Doctor", "Department", "Date", "Time", "Type", "Status"];
  const csv = [header.join(",")]
    .concat(
      rows.map((row) =>
        [row.appointmentId || row._id, row.patientName, row.doctorName, row.department, row.appointmentDate, row.appointmentTime, row.appointmentType, row.displayStatus]
          .map((item) => `"${String(item ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "appointments.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const role = user?.workspaceRole || user?.role || "guest";
  const isPatientRole = role === "patient";
  const { language } = useLanguage();

  const canCreateAppointments = canAccess(role, "appointments", "create");
  const canBook = canCreateAppointments;
  const canEditAppointments = canAccess(role, "appointments", "update");
  const canDeleteAppointments = canAccess(role, "appointments", "delete");

  const bookingCardRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({ capacity: 5, counts: {}, fullSlots: [] });
  const [form, setForm] = useState(defaultForm);
  const [filters, setFilters] = useState({ doctorId: "", department: "", status: "", dateFrom: "", dateTo: "" });
  const [calendarMode, setCalendarMode] = useState("month");
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailAppointment, setDetailAppointment] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "appointmentDate", direction: "desc" });

  const loggedInPatient = useMemo(() => {
    if (!isPatientRole) return null;
    const userEmail = String(user?.email || "").toLowerCase();
    return (
      patients.find(
        (p) =>
          String(p._id) === String(user?.id || user?._id) ||
          String(p.userId) === String(user?.id || user?._id) ||
          (p.email && String(p.email).toLowerCase() === userEmail)
      ) || null
    );
  }, [patients, user, isPatientRole]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patientResponse, doctorResponse, departmentResponse, appointmentResponse] = await Promise.all([
        patientService.list({ limit: 200 }, { force: true }),
        doctorService.list({ limit: 100 }, { force: true }),
        departmentService.list({ limit: 100 }, { force: true }),
        appointmentService.list({ limit: 300 }, { force: true }),
      ]);
      ensureSupplementData({
        patients: patientResponse.items,
        doctors: doctorResponse.items,
        appointments: appointmentResponse.items,
      });
      setPatients(patientResponse.items);
      setDoctors(doctorResponse.items);
      setDepartments(departmentResponse.items);
      setAppointments(appointmentResponse.items);

      const defaultDept = departmentResponse.items[0];
      const defaultDeptId = defaultDept?._id || "";
      const defaultDeptName = defaultDept?.name || "";

      const initialMatchingDoctors = doctorResponse.items.filter((doc) => {
        const docDeptId = String(doc.departmentId?._id || doc.departmentId || "");
        const docDeptName = String(doc.departmentId?.name || "").trim().toLowerCase();
        const docSpec = String(doc.specialization || "").trim().toLowerCase();
        const targetName = String(defaultDeptName).trim().toLowerCase();
        return docDeptId === String(defaultDeptId) || docDeptName === targetName || docSpec === targetName;
      });

      const initialDoctorId = initialMatchingDoctors[0]?._id || doctorResponse.items[0]?._id || "";

      setForm((current) => ({
        ...current,
        patientId: current.patientId || patientResponse.items[0]?._id || "",
        departmentId: current.departmentId || defaultDeptId,
        department: current.department || defaultDeptName || "General Medicine",
        doctorId: current.doctorId || initialDoctorId,
      }));
    } catch (error) {
      toast.error(error.message || "Failed to load appointment data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isPatientRole && loggedInPatient?._id) {
      setForm((current) => ({
        ...current,
        patientId: loggedInPatient._id,
      }));
    }
  }, [isPatientRole, loggedInPatient]);

  const availableDoctors = useMemo(() => {
    if (!form.departmentId && !form.department) return doctors;
    const targetDept = departments.find((d) => String(d._id) === String(form.departmentId));
    const targetName = String(targetDept?.name || form.department || "").trim().toLowerCase();

    return doctors.filter((doc) => {
      const docDeptId = String(doc.departmentId?._id || doc.departmentId || "");
      const docDeptName = String(doc.departmentId?.name || "").trim().toLowerCase();
      const docSpec = String(doc.specialization || "").trim().toLowerCase();
      return docDeptId === String(form.departmentId) || docDeptName === targetName || docSpec === targetName;
    });
  }, [doctors, departments, form.departmentId, form.department]);

  const handleDepartmentChange = (event) => {
    const newDeptId = event.target.value;
    const targetDept = departments.find((d) => String(d._id) === String(newDeptId));
    const newDeptName = targetDept ? targetDept.name : "";
    const targetName = targetDept ? String(targetDept.name || "").trim().toLowerCase() : "";

    const matchingDoctors = doctors.filter((doc) => {
      const docDeptId = String(doc.departmentId?._id || doc.departmentId || "");
      const docDeptName = String(doc.departmentId?.name || "").trim().toLowerCase();
      const docSpec = String(doc.specialization || "").trim().toLowerCase();
      return docDeptId === String(newDeptId) || docDeptName === targetName || docSpec === targetName;
    });

    const firstDoctorId = matchingDoctors[0]?._id || "";

    setForm((current) => ({
      ...current,
      departmentId: newDeptId,
      department: newDeptName,
      doctorId: firstDoctorId,
      appointmentTime: "",
    }));
    setSlotAvailability({ capacity: 5, counts: {}, fullSlots: [] });
  };

  const handleDoctorChange = (event) => {
    const selectedDoctorId = event.target.value;
    setForm((current) => ({
      ...current,
      doctorId: selectedDoctorId,
      appointmentTime: "",
    }));
    setSlotAvailability({ capacity: 5, counts: {}, fullSlots: [] });
  };

  const handleDateChange = (event) => {
    const selectedDate = event.target.value;
    setForm((current) => ({
      ...current,
      appointmentDate: selectedDate,
      appointmentTime: "",
    }));
    setSlotAvailability({ capacity: 5, counts: {}, fullSlots: [] });
  };

  const fetchBookedSlots = useCallback(async () => {
    if (!form.doctorId || !form.appointmentDate) {
      setSlotAvailability({ capacity: 5, counts: {}, fullSlots: [] });
      return;
    }

    try {
      const res = await api.get("/appointments/booked-slots", {
        params: { doctorId: form.doctorId, date: form.appointmentDate },
      });
      const data = res.data?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setSlotAvailability(data);
      } else {
        setSlotAvailability({
          capacity: 5,
          counts: {},
          fullSlots: Array.isArray(data) ? data : [],
        });
      }
    } catch {
      setSlotAvailability({ capacity: 5, counts: {}, fullSlots: [] });
    }
  }, [form.doctorId, form.appointmentDate]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const decoratedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const meta = getAppointmentMeta(appointment._id) || {};
      return {
        ...appointment,
        appointmentType: meta.appointmentType || "In-person",
        department: meta.department || appointment.doctorId?.departmentId?.name || "General Medicine",
        displayStatus:
          meta.displayStatus ||
          (appointment.status === "In-Progress" ? "In Progress" : appointment.status || "Scheduled"),
        patientName: `${appointment.patientId?.firstName || ""} ${appointment.patientId?.lastName || ""}`.trim(),
        doctorName: `${appointment.doctorId?.firstName || ""} ${appointment.doctorId?.lastName || ""}`.trim(),
      };
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const items = decoratedAppointments.filter((appointment) => {
      const matchesDoctor = !filters.doctorId || String(appointment.doctorId?._id || appointment.doctorId) === filters.doctorId;
      const matchesDepartment = !filters.department || appointment.department === filters.department;
      const matchesStatus = !filters.status || appointment.displayStatus === filters.status;
      const dateValue = appointment.appointmentDate ? new Date(appointment.appointmentDate) : null;
      const matchesFrom = !filters.dateFrom || (dateValue && dateValue >= new Date(filters.dateFrom));
      const matchesTo = !filters.dateTo || (dateValue && dateValue <= new Date(filters.dateTo));
      return matchesDoctor && matchesDepartment && matchesStatus && matchesFrom && matchesTo;
    });

    return items.sort((left, right) => {
      const leftValue = sortConfig.key === "appointmentDate" ? `${left.appointmentDate}${left.appointmentTime}` : left[sortConfig.key];
      const rightValue = sortConfig.key === "appointmentDate" ? `${right.appointmentDate}${right.appointmentTime}` : right[sortConfig.key];
      if (leftValue < rightValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [decoratedAppointments, filters, sortConfig]);

  const upcomingAppointment = useMemo(() => {
    if (!isPatientRole) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return (
      decoratedAppointments
        .filter((a) => a.displayStatus !== "Cancelled" && a.displayStatus !== "Completed" && new Date(a.appointmentDate) >= now)
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0] || null
    );
  }, [decoratedAppointments, isPatientRole]);

  const pastAppointments = useMemo(() => {
    if (!isPatientRole) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return decoratedAppointments
      .filter((a) => a.displayStatus === "Cancelled" || a.displayStatus === "Completed" || new Date(a.appointmentDate) < now)
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
  }, [decoratedAppointments, isPatientRole]);

  const slotDuration = Number(form.duration || 30);
  const daySlots = useMemo(() => generateSlots(slotDuration), [slotDuration]);

  const slotCapacity = slotAvailability.capacity || 5;
  const slotCounts = slotAvailability.counts || {};
  const fullSlots = Array.isArray(slotAvailability.fullSlots)
    ? slotAvailability.fullSlots
    : Array.isArray(slotAvailability)
    ? slotAvailability
    : [];

  const availableSlotsCount = useMemo(() => {
    return daySlots.filter((slot) => {
      const count = slotCounts[slot] || 0;
      return count < slotCapacity && !fullSlots.includes(slot);
    }).length;
  }, [daySlots, slotCounts, slotCapacity, fullSlots]);

  const confirmBooking = async (event) => {
    event.preventDefault();
    if (!form.doctorId) {
      toast.error("Please select a doctor belonging to the selected department.");
      return;
    }
    if (!form.appointmentDate) {
      toast.error("Please select an appointment date.");
      return;
    }
    if (!form.appointmentTime) {
      toast.error("Please select an available time slot.");
      return;
    }

    const currentCount = slotCounts[form.appointmentTime] || 0;
    if (currentCount >= slotCapacity || fullSlots.includes(form.appointmentTime)) {
      toast.error("This time slot is full. Please select another slot.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await appointmentService.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
        departmentId: form.departmentId || undefined,
        department: form.department,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        duration: Number(form.duration),
        reasonForVisit: form.reasonForVisit,
        status: "Scheduled",
      });
      saveAppointmentMeta(created._id, {
        appointmentType: form.appointmentType,
        department: form.department,
        slotStatus: "booked",
        displayStatus: "Scheduled",
      });
      saveAppointmentNotifications(created, user, ["patient", "doctor", "super_admin", "receptionist", "lab_staff"]);
      toast.success("Appointment booked successfully!");
      setForm((prev) => ({
        ...defaultForm,
        patientId: prev.patientId,
        departmentId: prev.departmentId,
        department: prev.department,
        doctorId: prev.doctorId,
        appointmentDate: prev.appointmentDate,
      }));
      setSelectedIds([]);
      await loadData();
      await fetchBookedSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAppointmentStatus = async (appointment, nextStatus) => {
    const backendStatusMap = {
      Scheduled: "Scheduled",
      Confirmed: "Scheduled",
      "In Progress": "In-Progress",
      Completed: "Completed",
      Cancelled: "Cancelled",
      "No-Show": "Cancelled",
    };

    await appointmentService.update(appointment._id, {
      patientId: appointment.patientId?._id || appointment.patientId,
      doctorId: appointment.doctorId?._id || appointment.doctorId,
      departmentId: appointment.departmentId?._id || appointment.departmentId,
      department: appointment.department,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      duration: appointment.duration,
      reasonForVisit: appointment.reasonForVisit,
      notes: appointment.notes,
      status: backendStatusMap[nextStatus] || "Scheduled",
    });

    saveAppointmentMeta(appointment._id, {
      appointmentType: appointment.appointmentType,
      department: appointment.department,
      displayStatus: nextStatus,
    });
    saveAppointmentStatusNotification(appointment, nextStatus, user);
    toast.success(`Appointment marked ${nextStatus}`);
    setSelectedIds([]);
    await loadData();
    await fetchBookedSlots();
  };

  const bulkCancel = async () => {
    if (!selectedIds.length) {
      toast.error("Select appointments to cancel");
      return;
    }

    await Promise.all(
      selectedIds.map((id) => {
        const item = decoratedAppointments.find((appt) => appt._id === id);
        return item ? updateAppointmentStatus(item, "Cancelled") : Promise.resolve();
      })
    );

    setSelectedIds([]);
    toast.success("Selected appointments cancelled");
  };

  const calendarCards = useMemo(() => {
    return filteredAppointments.slice(0, calendarMode === "day" ? 4 : calendarMode === "week" ? 8 : 12);
  }, [filteredAppointments, calendarMode]);

  const todayStr = new Date().toISOString().split("T")[0];

  const scrollToBooking = () => {
    if (bookingCardRef.current) {
      bookingCardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const copy =
    language === "hi"
      ? {
          eyebrow: isPatientRole ? "मेरी अपॉइंटमेंट्स" : "अपॉइंटमेंट वर्कफ़्लो",
          title: isPatientRole ? "अपॉइंटमेंट बुकिंग एवं इतिहास" : "अपॉइंटमेंट शेड्यूलिंग और प्रबंधन",
          description: isPatientRole
            ? "आसानी से डॉक्टर के साथ अपॉइंटमेंट बुक करें और अपनी आगामी मुलाकातों को देखें।"
            : "लाइव स्लॉट चयन, स्टेटस अपडेट, फिल्टर, डॉक्टर असाइनमेंट और बल्क एक्शन।",
          bookingTitle: "अपॉइंटमेंट बुक करें",
          bookingSubtitle: isPatientRole ? "विभाग, डॉक्टर और उपलब्ध समय स्लॉट चुनें" : "मरीज़ या रिसेप्शनिस्ट नया बुकिंग बना सकते हैं",
          managementTitle: "अपॉइंटमेंट प्रबंधन",
          managementSubtitle: "फिल्टर, कैलेंडर व्यू और त्वरित स्टेटस कंट्रोल",
          patient: "मरीज़",
          doctor: "डॉक्टर",
          department: "विभाग",
          date: "दिनांक",
          duration: "स्लॉट अवधि",
          type: "अपॉइंटमेंट का प्रकार",
          slots: "उपलब्ध समय स्लॉट",
          reason: "मुलाकात का कारण / बीमारी / लक्षण",
          save: "अपॉइंटमेंट कन्फर्म करें",
          saving: "अपॉइंटमेंट सेव हो रहा है...",
          listTitle: "अपॉइंटमेंट सूची",
          listSubtitle: "लाइव टेबल, बल्क कैंसिल और CSV एक्सपोर्ट",
        }
      : {
          eyebrow: isPatientRole ? "My Appointments" : "Appointment Workflow",
          title: isPatientRole ? "Appointment Booking & Records" : "Appointment Scheduling & Management",
          description: isPatientRole
            ? "Book doctor appointments and manage your upcoming and previous consultations."
            : "Live slot picking, status updates, doctor assignments, and bulk actions.",
          bookingTitle: "Book Appointment",
          bookingSubtitle: isPatientRole ? "Select department, doctor, date, and available time slot" : "Patient or receptionist can create a new booking",
          managementTitle: "Appointment Management",
          managementSubtitle: "Filters, calendar view, and quick status controls",
          patient: "Patient",
          doctor: "Doctor",
          department: "Department",
          date: "Date",
          duration: "Slot Duration",
          type: "Appointment Type",
          slots: "Available Time Slots",
          reason: "Reason for Visit / Disease / Symptoms",
          save: "Book Appointment",
          saving: "Booking appointment...",
          listTitle: "Appointment List View",
          listSubtitle: "Sortable live table with bulk cancel and CSV export",
        };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      {/* Patient Specific View - Upcoming Appointment Card */}
      {isPatientRole ? (
        <Card title="Upcoming Appointment" subtitle="Your next scheduled doctor consultation">
          {upcomingAppointment ? (
            <div className="rounded-[28px] border border-brand-500/20 bg-gradient-to-r from-[rgba(26,188,156,0.12)] to-[rgba(41,128,232,0.08)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="info">{upcomingAppointment.department}</Badge>
                  <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                    Dr. {upcomingAppointment.doctorName}
                  </h3>
                </div>
                <Badge variant={upcomingAppointment.displayStatus === "Confirmed" ? "success" : "warning"}>
                  {upcomingAppointment.displayStatus}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]/80 p-3">
                  <span className="text-xs text-[var(--text-muted)]">Appointment ID</span>
                  <p className="font-mono font-bold text-brand-600">
                    {upcomingAppointment.appointmentId || upcomingAppointment._id.slice(-6)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]/80 p-3">
                  <span className="text-xs text-[var(--text-muted)]">Date</span>
                  <p className="font-medium text-[var(--text-primary)]">{formatDate(upcomingAppointment.appointmentDate)}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]/80 p-3">
                  <span className="text-xs text-[var(--text-muted)]">Time Slot</span>
                  <p className="font-medium text-[var(--text-primary)]">{upcomingAppointment.appointmentTime}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]/80 p-3">
                  <span className="text-xs text-[var(--text-muted)]">Type</span>
                  <p className="font-medium text-[var(--text-primary)]">{upcomingAppointment.appointmentType}</p>
                </div>
              </div>

              {upcomingAppointment.reasonForVisit && (
                <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]/60 p-3">
                  <span className="text-xs text-[var(--text-muted)]">Reason for Visit / Symptoms</span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{upcomingAppointment.reasonForVisit}</p>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => updateAppointmentStatus(upcomingAppointment, "Cancelled")}
                >
                  <HiOutlineXCircle className="mr-2 text-base" />
                  Cancel Appointment
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <EmptyState
                title="No upcoming appointment"
                description="You have no upcoming consultations scheduled."
                action={
                  <Button type="button" onClick={scrollToBooking}>
                    <HiOutlineCalendar className="mr-2 text-base" />
                    Book an Appointment
                  </Button>
                }
              />
            </div>
          )}
        </Card>
      ) : null}

      {/* Booking Form Card */}
      {canBook ? (
        <div ref={bookingCardRef}>
          <Card title={copy.bookingTitle} subtitle={copy.bookingSubtitle}>
            <form className="space-y-4" onSubmit={confirmBooking}>
              <div className="grid gap-4 md:grid-cols-2">
                {isPatientRole ? (
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 md:col-span-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Patient (Read Only — Auto-Populated)
                    </span>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold">
                          {loggedInPatient
                            ? `${loggedInPatient.firstName} ${loggedInPatient.lastName}`
                            : user?.name || "Logged-in Patient"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {loggedInPatient?.email || user?.email || "No email"} • {loggedInPatient?.phone || "No phone"}
                        </p>
                      </div>
                      {loggedInPatient?.patientId && (
                        <span className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-3 py-1 font-mono text-xs font-semibold text-brand-600">
                          ID: {loggedInPatient.patientId}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="text-sm">
                    <span className="mb-2 block text-[var(--field-label)]">{copy.patient}</span>
                    <select
                      className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4"
                      value={form.patientId}
                      onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}
                    >
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName} {patient.patientId ? `(${patient.patientId})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">{copy.department}</span>
                  <select
                    className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4"
                    value={form.departmentId || form.department}
                    onChange={handleDepartmentChange}
                  >
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">{copy.doctor}</span>
                  <select
                    className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 disabled:opacity-60"
                    value={form.doctorId}
                    onChange={handleDoctorChange}
                    disabled={availableDoctors.length === 0}
                  >
                    {availableDoctors.length > 0 ? (
                      availableDoctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </option>
                      ))
                    ) : (
                      <option value="">No doctors available for this department.</option>
                    )}
                  </select>
                </label>

                <InputField
                  label={copy.date}
                  type="date"
                  min={todayStr}
                  value={form.appointmentDate}
                  onChange={handleDateChange}
                />

                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">{copy.type}</span>
                  <select
                    className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4"
                    value={form.appointmentType}
                    onChange={(event) => setForm((current) => ({ ...current, appointmentType: event.target.value }))}
                  >
                    {["In-person", "Telemedicine", "Follow-up", "Emergency"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--field-label)]">{copy.slots}</p>
                  {form.doctorId && form.appointmentDate ? (
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {availableSlotsCount > 0
                        ? `${availableSlotsCount} slots available`
                        : "No available slots on this date"}
                    </span>
                  ) : null}
                </div>

                {availableDoctors.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--panel-muted)] p-4 text-center text-sm text-[var(--text-muted)]">
                    No doctors available for this department.
                  </p>
                ) : availableSlotsCount === 0 && form.doctorId && form.appointmentDate ? (
                  <p className="rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 p-4 text-center text-sm font-medium text-rose-700">
                    No available slots for this doctor on the selected date. Please pick another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {daySlots.map((slot) => {
                      const count = slotCounts[slot] || 0;
                      const isFull = count >= slotCapacity || fullSlots.includes(slot);
                      const isSelected = form.appointmentTime === slot;

                      const styles = isFull
                        ? "border-rose-300 bg-rose-100/70 text-rose-700 cursor-not-allowed opacity-75"
                        : isSelected
                        ? "border-brand-600 bg-brand-500/15 text-brand-700 ring-2 ring-brand-500 font-bold"
                        : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100";

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isFull}
                          onClick={() => setForm((current) => ({ ...current, appointmentTime: slot }))}
                          className={`flex min-h-[50px] flex-col items-center justify-center rounded-2xl border px-3 py-1.5 text-sm transition-all ${styles}`}
                        >
                          <span className="font-semibold">{slot}</span>
                          <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">
                            {count}/{slotCapacity} {isFull ? "Full" : "Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="block text-sm">
                <span className="mb-2 block text-[var(--field-label)]">{copy.reason}</span>
                <textarea
                  placeholder="e.g. Fever, Headache, Chest pain, Regular check-up"
                  className="min-h-[100px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3 text-sm"
                  value={form.reasonForVisit}
                  onChange={(event) => setForm((current) => ({ ...current, reasonForVisit: event.target.value }))}
                />
              </label>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || availableDoctors.length === 0 || !form.appointmentTime}
              >
                {isSubmitting ? copy.saving : copy.save}
              </Button>
            </form>
          </Card>
        </div>
      ) : null}

      {/* Patient Specific View - My Appointment History */}
      {isPatientRole ? (
        <Card title="My Appointment History" subtitle="Previous and past consultations">
          {pastAppointments.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                    <th className="py-3 pr-4">Appointment ID</th>
                    <th className="py-3 pr-4">Doctor</th>
                    <th className="py-3 pr-4">Department</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Time</th>
                    <th className="py-3 pr-4">Reason</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAppointments.map((appointment) => (
                    <tr key={appointment._id} className="border-b border-[var(--border-color)]/70">
                      <td className="py-3 pr-4 font-mono font-semibold text-[var(--text-primary)]">
                        {appointment.appointmentId || appointment._id.slice(-6)}
                      </td>
                      <td className="py-3 pr-4 font-medium">Dr. {appointment.doctorName}</td>
                      <td className="py-3 pr-4">{appointment.department}</td>
                      <td className="py-3 pr-4">{formatDate(appointment.appointmentDate)}</td>
                      <td className="py-3 pr-4">{appointment.appointmentTime}</td>
                      <td className="py-3 pr-4 text-xs text-[var(--text-muted)] max-w-xs truncate">
                        {appointment.reasonForVisit || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            appointment.displayStatus === "Completed"
                              ? "success"
                              : appointment.displayStatus === "Cancelled" || appointment.displayStatus === "No-Show"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {appointment.displayStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No past appointments" description="Your previous consultations will appear here." />
          )}
        </Card>
      ) : (
        /* Admin / Staff / Receptionist / Doctor Management Views */
        <>
          <Card title={copy.managementTitle} subtitle={copy.managementSubtitle}>
            <div className="grid gap-3 md:grid-cols-5">
              <select
                className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm"
                value={filters.doctorId}
                onChange={(event) => setFilters((current) => ({ ...current, doctorId: event.target.value }))}
              >
                <option value="">All doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </option>
                ))}
              </select>
              <select
                className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm"
                value={filters.department}
                onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department._id} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </select>
              <select
                className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm"
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">All statuses</option>
                {bookingStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
                className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {["day", "week", "month"].map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={calendarMode === mode ? "primary" : "secondary"}
                    onClick={() => setCalendarMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <Badge variant="info">{filteredAppointments.length} appointments</Badge>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {calendarCards.length ? (
                calendarCards.map((appointment) => (
                  <button
                    key={appointment._id}
                    type="button"
                    onClick={() => setDetailAppointment(appointment)}
                    className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 text-left"
                  >
                    <div className="flex flex-wrap items-start gap-2">
                      <Badge variant={typeColors[appointment.appointmentType] || "default"}>
                        {appointment.appointmentType}
                      </Badge>
                      <Badge
                        variant={
                          appointment.displayStatus === "Cancelled" || appointment.displayStatus === "No-Show"
                            ? "danger"
                            : appointment.displayStatus === "Completed"
                            ? "success"
                            : "warning"
                        }
                      >
                        {appointment.displayStatus}
                      </Badge>
                    </div>
                    <p className="mt-3 font-semibold">{appointment.patientName || "Patient"}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Dr. {appointment.doctorName || "Doctor"}</p>
                    <p className="mt-3 text-sm">
                      {formatDate(appointment.appointmentDate)} • {appointment.appointmentTime}
                    </p>
                  </button>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-3">
                  <EmptyState title="No appointments found" description="Adjust your filters or create a new booking." />
                </div>
              )}
            </div>
          </Card>

          <Card
            title={copy.listTitle}
            subtitle={copy.listSubtitle}
            action={
              <div className="flex gap-2">
                {canDeleteAppointments ? (
                  <Button type="button" variant="secondary" onClick={bulkCancel}>
                    Cancel selected
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={() => csvDownload(filteredAppointments)}>
                  <HiOutlineArrowDownTray className="mr-2 text-base" />
                  Export CSV
                </Button>
              </div>
            }
          >
            {isLoading ? (
              <div className="min-h-[240px]" />
            ) : filteredAppointments.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                      <th className="py-3 pr-3" />
                      {[
                        ["appointmentId", "Appointment ID"],
                        ["patientName", "Patient"],
                        ["doctorName", "Doctor"],
                        ["appointmentDate", "Date"],
                        ["appointmentTime", "Time"],
                        ["appointmentType", "Type"],
                        ["displayStatus", "Status"],
                      ].map(([key, label]) => (
                        <th
                          key={key}
                          className="cursor-pointer py-3 pr-4"
                          onClick={() =>
                            setSortConfig((current) => ({
                              key,
                              direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
                            }))
                          }
                        >
                          {label}
                        </th>
                      ))}
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment._id} className="border-b border-[var(--border-color)]/70">
                        <td className="py-3 pr-3">
                          {canDeleteAppointments ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(appointment._id)}
                              onChange={() =>
                                setSelectedIds((current) =>
                                  current.includes(appointment._id)
                                    ? current.filter((id) => id !== appointment._id)
                                    : [...current, appointment._id]
                                )
                              }
                            />
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 font-mono font-medium text-[var(--text-primary)]">
                          {appointment.appointmentId || appointment._id.slice(-6)}
                        </td>
                        <td className="py-3 pr-4">{appointment.patientName}</td>
                        <td className="py-3 pr-4">{appointment.doctorName}</td>
                        <td className="py-3 pr-4">{formatDate(appointment.appointmentDate)}</td>
                        <td className="py-3 pr-4">{appointment.appointmentTime}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={typeColors[appointment.appointmentType] || "default"}>
                            {appointment.appointmentType}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={
                              appointment.displayStatus === "Completed"
                                ? "success"
                                : appointment.displayStatus === "Cancelled" || appointment.displayStatus === "No-Show"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {appointment.displayStatus}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Button type="button" variant="secondary" onClick={() => setDetailAppointment(appointment)}>
                            Open
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No appointments yet" description="Booked appointments will appear here." />
            )}
          </Card>
        </>
      )}

      {/* Appointment Detail Modal */}
      <Modal
        open={Boolean(detailAppointment)}
        onClose={() => setDetailAppointment(null)}
        title="Appointment Detail"
        description="Confirm, reschedule, cancel, complete, or add notes"
        size="lg"
      >
        {detailAppointment ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Appointment ID</p>
                <p className="mt-2 font-mono font-semibold text-lg">
                  {detailAppointment.appointmentId || detailAppointment._id}
                </p>
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  Patient: <span className="font-semibold text-[var(--text-primary)]">{detailAppointment.patientName}</span>
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Doctor: {detailAppointment.doctorName}</p>
              </div>
              <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Visit Details</p>
                <p className="mt-2 font-semibold">
                  {formatDate(detailAppointment.appointmentDate)} • {detailAppointment.appointmentTime}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {detailAppointment.department} • {detailAppointment.appointmentType}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
              <p className="font-medium">Notes / Reason</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{detailAppointment.reasonForVisit || "No notes recorded."}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {canEditAppointments ? (
                <Button type="button" onClick={() => updateAppointmentStatus(detailAppointment, "Confirmed")}>
                  <HiOutlineCheckCircle className="mr-2 text-base" />
                  Confirm
                </Button>
              ) : null}
              {canEditAppointments ? (
                <Button type="button" variant="secondary" onClick={() => updateAppointmentStatus(detailAppointment, "Scheduled")}>
                  <HiOutlineCalendarDays className="mr-2 text-base" />
                  Reschedule
                </Button>
              ) : null}
              {canEditAppointments ? (
                <Button type="button" variant="secondary" onClick={() => updateAppointmentStatus(detailAppointment, "In Progress")}>
                  <HiOutlineClock className="mr-2 text-base" />
                  In Progress
                </Button>
              ) : null}
              {canEditAppointments ? (
                <Button type="button" variant="secondary" onClick={() => updateAppointmentStatus(detailAppointment, "Completed")}>
                  Mark Complete
                </Button>
              ) : null}
              {canDeleteAppointments ? (
                <Button type="button" variant="danger" onClick={() => updateAppointmentStatus(detailAppointment, "Cancelled")}>
                  <HiOutlineXCircle className="mr-2 text-base" />
                  Cancel
                </Button>
              ) : null}
              {!canEditAppointments && !canDeleteAppointments ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  Read-only appointment details for your role.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
