import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUsers,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineArrowRight,
  HiOutlineEye,
} from "react-icons/hi2";
import { toast } from "sonner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatCard from "../../components/common/StatCard";
import SelectField from "../../components/common/SelectField";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import useLiveQuery from "../../hooks/useLiveQuery";
import { createEntityService } from "../../services/entityService";
import { formatRelativeSeconds, getFullName } from "../../utils/dashboard";

const appointmentService = createEntityService("appointments");
const patientService = createEntityService("patients");
const doctorService = createEntityService("doctors");

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

function getPatientCode(patient) {
  if (!patient) return "-";
  if (patient.patientId) return patient.patientId;
  if (patient.patientCode) return patient.patientCode;
  if (patient._id) return `P${String(patient._id).slice(-4).toUpperCase()}`;
  return "-";
}

function getAppointmentCode(appointment) {
  if (!appointment) return "-";
  if (appointment.appointmentId) return appointment.appointmentId;
  if (appointment._id) return `A${String(appointment._id).slice(-4).toUpperCase()}`;
  return "-";
}

const APPOINTMENT_STATUSES = ["Scheduled", "Confirmed", "In Consultation", "Completed", "Cancelled"];

function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language, normalizeText } = useLanguage();
  const [patientSearch, setPatientSearch] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const debouncedPatientSearch = useDebouncedValue(patientSearch);

  const loadDoctorDashboard = useCallback(async () => {
    const [doctors, appointments, patients] = await Promise.all([
      doctorService.list({ limit: 100 }, { force: true }),
      appointmentService.list({ limit: 300 }, { force: true }),
      patientService.list({ limit: 300 }, { force: true }),
    ]);

    const doctorProfile =
      doctors.items.find((doctor) => String(doctor.userId) === String(user?.id || user?._id)) ||
      doctors.items.find((doctor) => doctor.email?.toLowerCase() === user?.email?.toLowerCase()) ||
      null;

    const doctorAppointments = appointments.items;
    const myPatients = patients.items;

    return {
      doctorProfile,
      appointments: doctorAppointments,
      myPatients,
    };
  }, [user?.email, user?.id, user?._id]);

  const { data, isLoading, lastUpdated, refetch } = useLiveQuery(loadDoctorDashboard, {
    initialData: null,
    interval: 180000,
    errorMessage: "Unable to load doctor dashboard",
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayAppointments = useMemo(() => {
    return (data?.appointments || []).filter((appointment) => {
      const apptDate = appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString().slice(0, 10) : "";
      return apptDate === todayStr;
    }).sort((a, b) => String(a.appointmentTime || "").localeCompare(String(b.appointmentTime || "")));
  }, [data?.appointments, todayStr]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (data?.appointments || []).filter((appointment) => {
      const apptDate = new Date(appointment.appointmentDate);
      return apptDate >= now && appointment.status !== "Completed" && appointment.status !== "Cancelled";
    });
  }, [data?.appointments]);

  const completedConsultations = useMemo(() => {
    return (data?.appointments || []).filter((appointment) => appointment.status === "Completed");
  }, [data?.appointments]);

  const pendingConsultations = useMemo(() => {
    return (data?.appointments || []).filter(
      (appointment) => appointment.status === "Scheduled" || appointment.status === "Confirmed" || appointment.status === "In Consultation"
    );
  }, [data?.appointments]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    setUpdatingStatusId(appointmentId);
    try {
      await appointmentService.update(appointmentId, { status: newStatus });
      toast.success(`Appointment status updated to ${newStatus}`);
      await refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update appointment status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredPatients = useMemo(() => {
    const query = debouncedPatientSearch.trim().toLowerCase();
    if (!query) return data?.myPatients || [];

    return (data?.myPatients || []).filter((patient) => {
      const name = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const pCode = getPatientCode(patient).toLowerCase();
      return name.includes(query) || pCode.includes(query);
    });
  }, [data?.myPatients, debouncedPatientSearch]);

  const copy = useMemo(() => {
    const isHi = language === "hi";
    return {
      eyebrow: isHi ? "डॉक्टर वर्कस्पेस" : "Clinical Workspace",
      title: isHi ? `स्वागत है, Dr. ${user?.name || ""}` : `Welcome, Dr. ${user?.name || "Doctor"}`,
      description: isHi
        ? "अपने मरीजों के अपॉइंटमेंट प्रबंधित करें, कंसल्टेशन रिकॉर्ड करें और प्रिस्क्रिप्शन जारी करें।"
        : "Manage patient appointments, record clinical consultations, and write online prescriptions.",
      myPatients: isHi ? "मेरे मरीज" : "My Patients",
      todayAppts: isHi ? "आज के अपॉइंटमेंट" : "Today's Appointments",
      upcomingAppts: isHi ? "आगामी अपॉइंटमेंट" : "Upcoming Appointments",
      completedConsultations: isHi ? "पूर्ण कंसल्टेशन" : "Completed Consultations",
      pendingConsultations: isHi ? "लंबित कंसल्टation" : "Pending Consultations",
      todaySectionTitle: isHi ? "आज का अपॉइंटमेंट शेड्यूल" : "Today's Appointments Schedule",
      todaySectionSub: isHi ? "आज के पंजीकृत परामर्श और मरीज की स्थिति" : "Scheduled consultations and patient status for today",
      noTodayAppts: isHi ? "आज कोई अपॉइंटमेंट नहीं है" : "No Appointments Scheduled Today",
      noTodayDesc: isHi ? "आपके पास आज के लिए कोई अपॉइंटमेंट नहीं है।" : "You currently have no patient appointments scheduled for today.",
      viewAllPatients: isHi ? "सभी मरीज देखें" : "View All Patients",
      viewPatient: isHi ? "मरीज देखें" : "View Patient",
      searchPatientsPlaceholder: isHi ? "नाम या आईडी से मरीज खोजें..." : "Search patients by name or ID...",
      patientSummaryTitle: isHi ? "मेरे मरीज की सूची" : "My Patient Registry",
      patientSummarySub: isHi ? "आपके साथ जुड़े मरीज" : "Patients with consultation history or upcoming bookings",
    };
  }, [language, user?.name]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

      {/* Doctor Statistics Cards */}
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={HiOutlineUsers}
          label={copy.myPatients}
          value={data?.myPatients?.length ?? 0}
          helper="Assigned patients"
          isLoading={isLoading}
        />
        <StatCard
          icon={HiOutlineCalendarDays}
          label={copy.todayAppts}
          value={todayAppointments.length}
          helper="Scheduled today"
          isLoading={isLoading}
        />
        <StatCard
          icon={HiOutlineClock}
          label={copy.upcomingAppts}
          value={upcomingAppointments.length}
          helper="Future bookings"
          isLoading={isLoading}
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label={copy.completedConsultations}
          value={completedConsultations.length}
          helper="Consultations done"
          isLoading={isLoading}
        />
        <StatCard
          icon={HiOutlineClipboardDocumentList}
          label={copy.pendingConsultations}
          value={pendingConsultations.length}
          helper="Awaiting completion"
          isLoading={isLoading}
        />
      </section>

      {/* Today's Appointments Section */}
      <Card title={copy.todaySectionTitle} subtitle={copy.todaySectionSub}>
        <div className="space-y-4">
          {todayAppointments.length ? (
            todayAppointments.map((appointment) => {
              const patient = appointment.patientId;
              const patientName = getFullName(patient);
              const patientId = getPatientCode(patient);
              const apptId = getAppointmentCode(appointment);
              const dateStr = formatDate(appointment.appointmentDate);
              const timeStr = appointment.appointmentTime || "-";
              const reasonStr = appointment.reasonForVisit || appointment.symptoms || "General Consultation";
              const currentStatus = appointment.status || "Scheduled";
              const pIdRaw = patient?._id || patient;

              return (
                <div
                  key={appointment._id}
                  className="flex flex-col gap-4 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-5 transition-all hover:border-[var(--teal-primary)] lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Patient Details</span>
                      <p className="mt-1 text-base font-bold text-[var(--text-primary)]">{patientName}</p>
                      <p className="text-xs font-medium text-[var(--text-muted)]">ID: {patientId}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Appointment Info</span>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Appt ID: {apptId}</p>
                      <p className="text-xs text-[var(--text-muted)]">{dateStr} at {timeStr}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Reason / Symptoms</span>
                      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{reasonStr}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 lg:border-l lg:border-[var(--border-color)] lg:pl-6 lg:pt-0">
                    <div className="w-40">
                      <select
                        value={currentStatus}
                        disabled={updatingStatusId === appointment._id}
                        onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-primary)]"
                      >
                        {APPOINTMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {pIdRaw ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => navigate(`/doctor/patients/${pIdRaw}`)}
                      >
                        <HiOutlineEye className="mr-1 h-4 w-4" />
                        {copy.viewPatient}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title={copy.noTodayAppts} description={copy.noTodayDesc} />
          )}
        </div>
      </Card>

      {/* My Patients Summary Section */}
      <Card
        title={copy.patientSummaryTitle}
        subtitle={copy.patientSummarySub}
        action={
          <Button type="button" variant="secondary" onClick={() => navigate("/doctor/patients")}>
            {copy.viewAllPatients}
            <HiOutlineArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      >
        <div className="space-y-4">
          <SearchInput
            value={patientSearch}
            onChange={setPatientSearch}
            placeholder={copy.searchPatientsPlaceholder}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.slice(0, 6).map((patient) => (
              <div
                key={patient._id}
                className="flex flex-col justify-between rounded-[20px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 hover:border-[var(--teal-primary)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[var(--text-primary)]">{getFullName(patient)}</p>
                    <Badge variant="info" className="text-[10px]">
                      {getPatientCode(patient)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {patient.gender || "Gender unstated"} • {patient.phone || "No phone"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-[var(--teal-dark)]"
                    onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                  >
                    {copy.viewPatient} &rarr;
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 ? (
            <EmptyState title="No patients found" description="No doctor-assigned patients match your search." />
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default DoctorDashboardPage;
