import { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle } from "react-icons/hi2";
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
  const header = ["ID", "Patient", "Doctor", "Date", "Time", "Type", "Status"];
  const csv = [header.join(",")]
    .concat(
      rows.map((row) =>
        [row._id, row.patientName, row.doctorName, row.appointmentDate, row.appointmentTime, row.appointmentType, row.displayStatus]
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

function AppointmentsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const role = user?.workspaceRole || user?.role;
  const canBook = canAccess(role, "appointments", "create");
  const canEditAppointments = canAccess(role, "appointments", "edit");
  const canDeleteAppointments = canAccess(role, "appointments", "delete");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [filters, setFilters] = useState({ doctorId: "", department: "", status: "", dateFrom: "", dateTo: "" });
  const [calendarMode, setCalendarMode] = useState("month");
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailAppointment, setDetailAppointment] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "appointmentDate", direction: "desc" });

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
      setForm((current) => ({
        ...current,
        patientId: current.patientId || patientResponse.items[0]?._id || "",
        doctorId: current.doctorId || doctorResponse.items[0]?._id || "",
        department:
          current.department ||
          departmentResponse.items.find((item) => item._id === doctorResponse.items[0]?.departmentId?._id)?.name ||
          departmentResponse.items[0]?.name ||
          "",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const slotDuration = Number(form.duration || 30);
  const daySlots = useMemo(() => generateSlots(slotDuration), [slotDuration]);
  const currentDayTakenSlots = useMemo(() => {
    return new Map(
      decoratedAppointments
        .filter((appointment) => appointment.appointmentDate === form.appointmentDate)
        .map((appointment) => [appointment.appointmentTime, appointment.displayStatus === "Cancelled" ? "available" : "booked"])
    );
  }, [decoratedAppointments, form.appointmentDate]);

  const confirmBooking = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await appointmentService.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
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
      toast.success("Appointment booked and notification queued");
      setForm(defaultForm);
      setSelectedIds([]);
      await loadData();
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
    await loadData();
  };

  const bulkCancel = async () => {
    if (!selectedIds.length) {
      toast.error("Select appointments first");
      return;
    }

    await Promise.all(
      selectedIds.map(async (id) => {
        const appointment = decoratedAppointments.find((item) => item._id === id);
        if (appointment) {
          await updateAppointmentStatus(appointment, "Cancelled");
        }
      })
    );
    setSelectedIds([]);
  };

  const calendarCards = filteredAppointments.slice(0, calendarMode === "day" ? 6 : calendarMode === "week" ? 12 : 18);

  const copy = language === "hi"
    ? {
        eyebrow: "अपॉइंटमेंट्स",
        title: "अपॉइंटमेंट बुकिंग और प्रबंधन",
        description: "विजिट बुक करें, स्टेटस अपडेट करें और अपॉइंटमेंट सूची एक्सपोर्ट करें।",
        bookingTitle: "अपॉइंटमेंट बुकिंग",
        bookingSubtitle: "मरीज या रिसेप्शनिस्ट नई बुकिंग कर सकते हैं",
        managementTitle: "अपॉइंटमेंट प्रबंधन",
        managementSubtitle: "फिल्टर, कैलेंडर दृश्य और त्वरित स्टेटस नियंत्रण",
        patient: "मरीज",
        doctor: "डॉक्टर",
        department: "विभाग",
        date: "तिथि",
        duration: "स्लॉट अवधि",
        type: "अपॉइंटमेंट प्रकार",
        slots: "उपलब्ध समय स्लॉट",
        reason: "नोट्स / कारण",
        save: "अपॉइंटमेंट कन्फर्म करें",
        saving: "अपॉइंटमेंट सेव हो रहा है...",
        listTitle: "अपॉइंटमेंट सूची",
        listSubtitle: "सॉर्टेबल टेबल, बल्क कैंसिल और CSV एक्सपोर्ट",
      }
    : {
        eyebrow: "Appointments",
        title: "Appointment Booking & Management",
        description: "Book visits, manage status updates, view schedule cards, and export the live appointment table.",
        bookingTitle: "Appointment Booking",
        bookingSubtitle: "Patient or receptionist can create a new booking",
        managementTitle: "Appointment Management",
        managementSubtitle: "Filters, calendar view, and quick status controls",
        patient: "Patient",
        doctor: "Doctor",
        department: "Department",
        date: "Date",
        duration: "Slot Duration",
        type: "Appointment Type",
        slots: "Available Time Slots",
        reason: "Notes / Reason",
        save: "Confirm Appointment",
        saving: "Saving appointment...",
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

      {canBook ? (
        <Card title={copy.bookingTitle} subtitle={copy.bookingSubtitle}>
          <form className="space-y-4" onSubmit={confirmBooking}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-2 block text-[var(--field-label)]">{copy.patient}</span>
                <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}>
                  {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.firstName} {patient.lastName}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-2 block text-[var(--field-label)]">{copy.doctor}</span>
                <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.doctorId} onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}>
                  {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-2 block text-[var(--field-label)]">{copy.department}</span>
                <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}>
                  {departments.map((department) => <option key={department._id} value={department.name}>{department.name}</option>)}
                </select>
              </label>
              <InputField label={copy.date} type="date" value={form.appointmentDate} onChange={(event) => setForm((current) => ({ ...current, appointmentDate: event.target.value }))} />
              <label className="text-sm">
                <span className="mb-2 block text-[var(--field-label)]">{copy.duration}</span>
                <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value) }))}>
                  {slotDurations.map((value) => <option key={value} value={value}>{value} min</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-2 block text-[var(--field-label)]">{copy.type}</span>
                <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.appointmentType} onChange={(event) => setForm((current) => ({ ...current, appointmentType: event.target.value }))}>
                  {["In-person", "Telemedicine", "Follow-up", "Emergency"].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-[var(--field-label)]">{copy.slots}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {daySlots.map((slot) => {
                  const state = currentDayTakenSlots.get(slot) || (slot.endsWith(":00") ? "available" : "on-hold");
                  const styles =
                    state === "booked"
                      ? "border-rose-300 bg-rose-100 text-rose-700"
                      : state === "on-hold"
                        ? "border-amber-300 bg-amber-100 text-amber-700"
                        : form.appointmentTime === slot
                          ? "border-brand-500 bg-brand-500/12 text-brand-700"
                          : "border-emerald-300 bg-emerald-100 text-emerald-700";
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={state === "booked"}
                      onClick={() => setForm((current) => ({ ...current, appointmentTime: slot }))}
                      className={`min-h-[48px] rounded-2xl border px-3 text-sm font-medium ${styles}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block text-sm">
              <span className="mb-2 block text-[var(--field-label)]">{copy.reason}</span>
              <textarea className="min-h-[110px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3" value={form.reasonForVisit} onChange={(event) => setForm((current) => ({ ...current, reasonForVisit: event.target.value }))} />
            </label>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? copy.saving : copy.save}
            </Button>
          </form>
        </Card>
      ) : null}

      <Card title={copy.managementTitle} subtitle={copy.managementSubtitle}>
          <div className="grid gap-3 md:grid-cols-5">
            <select className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.doctorId} onChange={(event) => setFilters((current) => ({ ...current, doctorId: event.target.value }))}>
              <option value="">All doctors</option>
              {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName}</option>)}
            </select>
            <select className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}>
              <option value="">All departments</option>
              {departments.map((department) => <option key={department._id} value={department.name}>{department.name}</option>)}
            </select>
            <select className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              {bookingStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" />
            <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {["day", "week", "month"].map((mode) => (
                <Button key={mode} type="button" variant={calendarMode === mode ? "primary" : "secondary"} onClick={() => setCalendarMode(mode)}>
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
                    <Badge variant={typeColors[appointment.appointmentType] || "default"}>{appointment.appointmentType}</Badge>
                    <Badge variant={appointment.displayStatus === "Cancelled" || appointment.displayStatus === "No-Show" ? "danger" : appointment.displayStatus === "Completed" ? "success" : "warning"}>
                      {appointment.displayStatus}
                    </Badge>
                  </div>
                  <p className="mt-3 font-semibold">{appointment.patientName || "Patient"}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Dr. {appointment.doctorName || "Doctor"}</p>
                  <p className="mt-3 text-sm">{formatDate(appointment.appointmentDate)} • {appointment.appointmentTime}</p>
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
            {canDeleteAppointments ? <Button type="button" variant="secondary" onClick={bulkCancel}>Cancel selected</Button> : null}
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
                    ["_id", "ID"],
                    ["patientName", "Patient"],
                    ["doctorName", "Doctor"],
                    ["appointmentDate", "Date"],
                    ["appointmentTime", "Time"],
                    ["appointmentType", "Type"],
                    ["displayStatus", "Status"],
                  ].map(([key, label]) => (
                    <th key={key} className="cursor-pointer py-3 pr-4" onClick={() => setSortConfig((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }))}>
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
                        <input type="checkbox" checked={selectedIds.includes(appointment._id)} onChange={() => setSelectedIds((current) => current.includes(appointment._id) ? current.filter((id) => id !== appointment._id) : [...current, appointment._id])} />
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">{appointment._id.slice(-6)}</td>
                    <td className="py-3 pr-4">{appointment.patientName}</td>
                    <td className="py-3 pr-4">{appointment.doctorName}</td>
                    <td className="py-3 pr-4">{formatDate(appointment.appointmentDate)}</td>
                    <td className="py-3 pr-4">{appointment.appointmentTime}</td>
                    <td className="py-3 pr-4"><Badge variant={typeColors[appointment.appointmentType] || "default"}>{appointment.appointmentType}</Badge></td>
                    <td className="py-3 pr-4"><Badge variant={appointment.displayStatus === "Completed" ? "success" : appointment.displayStatus === "Cancelled" || appointment.displayStatus === "No-Show" ? "danger" : "warning"}>{appointment.displayStatus}</Badge></td>
                    <td className="py-3">
                      <Button type="button" variant="secondary" onClick={() => setDetailAppointment(appointment)}>Open</Button>
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
                <p className="text-sm text-[var(--text-muted)]">Patient</p>
                <p className="mt-2 font-semibold">{detailAppointment.patientName}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Doctor: {detailAppointment.doctorName}</p>
              </div>
              <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Visit</p>
                <p className="mt-2 font-semibold">{formatDate(detailAppointment.appointmentDate)} • {detailAppointment.appointmentTime}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{detailAppointment.department} • {detailAppointment.appointmentType}</p>
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

export default AppointmentsPage;

