import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineDocumentArrowDown,
  HiOutlinePlusCircle,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from "react-icons/hi2";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import Avatar from "../../components/common/Avatar";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { useLanguage } from "../../context/LanguageContext";
import useLiveQuery from "../../hooks/useLiveQuery";
import { createEntityService } from "../../services/entityService";
import { getLeaveRequests, updateLeaveRequestStatus } from "../../utils/leaveRequests";
import { buildDateRange, formatRelativeSeconds, getFullName, getPercentageChange, groupByDate } from "../../utils/dashboard";

const patientService = createEntityService("patients");
const doctorService = createEntityService("doctors");
const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");
const departmentService = createEntityService("departments");
const staffService = createEntityService("staff");

function downloadCsv(rows, filename) {
  const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { language, formatCurrency } = useLanguage();
  const [selectedBed, setSelectedBed] = useState(null);
  const [timeRange, setTimeRange] = useState("today");
  const [leaveRevision, setLeaveRevision] = useState(0);

  useEffect(() => {
    const handleLeaveUpdate = () => setLeaveRevision((currentValue) => currentValue + 1);
    window.addEventListener("hms:leave-requests-updated", handleLeaveUpdate);
    return () => window.removeEventListener("hms:leave-requests-updated", handleLeaveUpdate);
  }, []);

  const copy = useMemo(
    () =>
      language === "hi"
        ? {
            eyebrow: "हॉस्पिटल कमांड सेंटर",
            title: "ऑपरेशनल ओवरव्यू",
            description: "लाइव बैकएंड से एडमिशन, अपॉइंटमेंट, बिलिंग, वार्ड और स्टाफ गतिविधि मॉनिटर करें।",
            today: "आज",
            month: "इस महीने",
            refresh: "वार्ड और बिलिंग रिफ्रेश हर 3 मिनट",
            updated: "आखिरी अपडेट",
            totalPatients: "कुल मरीज",
            registeredToday: "आज पंजीकृत",
            registeredMonth: "इस महीने पंजीकृत",
            doctors: "डॉक्टर",
            activeLeave: "सक्रिय / अवकाश पर",
            appointmentsToday: "आज के अपॉइंटमेंट",
            pendingCompleted: "लंबित / पूर्ण",
            bedOccupancy: "बेड ऑक्यूपेंसी",
            occupiedBeds: "भरे हुए बेड",
            revenueToday: "आज की आय",
            revenueHelper: "आज बने बिलिंग रिकॉर्ड",
            staffCoverage: "स्टाफ कवरेज",
            activeSupport: "सक्रिय सपोर्ट स्टाफ",
            patientAdmissions: "मरीज एडमिशन",
            last30Days: "पिछले 30 दिन",
            departmentMix: "विभाग मिश्रण",
            departmentMixSub: "विभाग अनुसार अपॉइंटमेंट वितरण",
            noDepartmentMix: "अभी विभाग डेटा नहीं है",
            noDepartmentMixDesc: "जब अपॉइंटमेंट डॉक्टर और विभाग से जुड़े होंगे तब यह चार्ट भरेगा।",
            weeklyOutcomes: "साप्ताहिक अपॉइंटमेंट परिणाम",
            weeklyOutcomesSub: "निर्धारित बनाम पूर्ण बनाम रद्द",
            revenueTrend: "आय ट्रेंड",
            last7Days: "पिछले 7 दिन",
            queue: "लाइव अपॉइंटमेंट क्यू",
            queueSub: "आज का फ्रंट डेस्क फ्लो",
            queueEmpty: "क्यू साफ है",
            queueEmptyDesc: "आज के लिए कोई अपॉइंटमेंट नहीं मिला।",
            bedMap: "बेड उपलब्धता मानचित्र",
            bedMapSub: "मरीज देखने के लिए बेड चुनें",
            registrations: "हाल की रजिस्ट्रेशन",
            registrationsSub: "नवीनतम मरीज प्रोफाइल",
            surgeries: "आगामी सर्जरी",
            surgeriesSub: "आज की ओटी फीड",
            leaveRequests: "अवकाश अनुरोध",
            leaveRequestsSub: "डॉक्टरों द्वारा भेजे गए नवीनतम अनुरोध",
            noLeaveRequests: "अभी कोई अवकाश अनुरोध नहीं",
            noLeaveRequestsDesc: "डॉक्टर का अगला आवेदन यहां दिखाई देगा।",
            approve: "स्वीकृत करें",
            reject: "अस्वीकृत करें",
            pending: "लंबित",
            approved: "स्वीकृत",
            rejected: "अस्वीकृत",
            registerPatient: "नया मरीज दर्ज करें",
            scheduleAppointment: "अपॉइंटमेंट शेड्यूल करें",
            addDoctor: "डॉक्टर जोड़ें",
            generateReport: "रिपोर्ट बनाएं",
            bedDetails: "चयनित बेड की मरीज जानकारी",
            bedAvailable: "बेड उपलब्ध है",
            bedAvailableDesc: "इस बेड पर अभी कोई मरीज नहीं है。",
            name: "नाम",
            status: "स्थिति",
            city: "शहर",
            bloodType: "ब्लड टाइप",
            notProvided: "उपलब्ध नहीं",
            general: "जनरल",
            room: "कक्ष",
          }
        : {
            eyebrow: "Hospital command center",
            title: "Operational overview",
            description: "Monitor admissions, appointments, billing, wards, and staff activity from the live backend.",
            today: "Today",
            month: "This Month",
            refresh: "Ward and billing refresh every 3 min",
            updated: "Last updated",
            totalPatients: "Total patients",
            registeredToday: "Registered today",
            registeredMonth: "Registered this month",
            doctors: "Doctors",
            activeLeave: "active / on leave",
            appointmentsToday: "Appointments today",
            pendingCompleted: "pending / completed",
            bedOccupancy: "Bed occupancy",
            occupiedBeds: "Occupied beds",
            revenueToday: "Revenue today",
            revenueHelper: "Billing records created today",
            staffCoverage: "Staff coverage",
            activeSupport: "active support staff",
            patientAdmissions: "Patient admissions",
            last30Days: "Last 30 days",
            departmentMix: "Department mix",
            departmentMixSub: "Appointment distribution by department",
            noDepartmentMix: "No department mix yet",
            noDepartmentMixDesc: "This chart will populate once appointments are linked to doctors and departments.",
            weeklyOutcomes: "Weekly appointment outcomes",
            weeklyOutcomesSub: "Scheduled vs completed vs cancelled",
            revenueTrend: "Revenue trend",
            last7Days: "Last 7 days",
            queue: "Live appointment queue",
            queueSub: "Today's front-desk flow",
            queueEmpty: "Queue is clear",
            queueEmptyDesc: "No appointments were returned for today.",
            bedMap: "Bed availability map",
            bedMapSub: "Click a bed to inspect assigned patient",
            registrations: "Recent registrations",
            registrationsSub: "Latest patient profiles",
            surgeries: "Upcoming surgeries",
            surgeriesSub: "Scheduled OT feed for today",
            leaveRequests: "Leave requests",
            leaveRequestsSub: "Latest requests submitted by doctors",
            noLeaveRequests: "No leave requests yet",
            noLeaveRequestsDesc: "The next doctor leave application will show up here.",
            approve: "Approve",
            reject: "Reject",
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            registerPatient: "Register New Patient",
            scheduleAppointment: "Schedule Appointment",
            addDoctor: "Add Doctor",
            generateReport: "Generate Report",
            bedDetails: "Patient details for the selected bed",
            bedAvailable: "Bed available",
            bedAvailableDesc: "No patient is currently assigned to this bed.",
            name: "Name",
            status: "Status",
            city: "City",
            bloodType: "Blood Type",
            notProvided: "Not provided",
            general: "General",
            room: "Room",
          },
    [language]
  );

  const loadDashboard = useCallback(async () => {
    const [patients, doctors, appointments, billing, departments, staff] = await Promise.all([
      patientService.list({ limit: 60 }, { ttl: 240000 }),
      doctorService.list({ limit: 40 }, { ttl: 240000 }),
      appointmentService.list({ limit: 60 }, { ttl: 240000 }),
      billingService.list({ limit: 60 }, { ttl: 240000 }),
      departmentService.list({ limit: 40 }, { ttl: 240000 }),
      staffService.list({ limit: 40 }, { ttl: 240000 }),
    ]);

    const patientItems = patients.items ?? [];
    const doctorItems = doctors.items ?? [];
    const appointmentItems = appointments.items ?? [];
    const billingItems = billing.items ?? [];
    const departmentItems = departments.items ?? [];
    const staffItems = staff.items ?? [];
    const todayKey = new Date().toISOString().slice(0, 10);
    const monthKey = new Date().toISOString().slice(0, 7);
    const previousDayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const patientCountToday = patientItems.filter((item) => item.createdAt?.slice(0, 10) === todayKey).length;
    const patientCountMonth = patientItems.filter((item) => item.createdAt?.slice(0, 7) === monthKey).length;
    const previousPatientCount = patientItems.filter((item) => item.createdAt?.slice(0, 10) === previousDayKey).length;

    const todayAppointments = appointmentItems.filter((item) => item.appointmentDate?.slice(0, 10) === todayKey);
    const yesterdayAppointments = appointmentItems.filter((item) => item.appointmentDate?.slice(0, 10) === previousDayKey);
    const revenueToday = billingItems
      .filter((item) => item.createdAt?.slice(0, 10) === todayKey)
      .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    const revenueYesterday = billingItems
      .filter((item) => item.createdAt?.slice(0, 10) === previousDayKey)
      .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    const admissionsByDate = groupByDate(patientItems, (item) => item.createdAt || new Date().toISOString());
    const patientAdmissionsSeries = buildDateRange(30, (date) => {
      const key = date.toISOString().slice(0, 10);
      return {
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        value: admissionsByDate[key] || 0,
      };
    });

    const departmentDistribution = departmentItems
      .map((department) => ({
        name: department.name,
        value: appointmentItems.filter(
          (item) => String(item.doctorId?.departmentId?._id || item.doctorId?.departmentId) === String(department._id)
        ).length,
      }))
      .filter((item) => item.value > 0);

    const weeklyAppointments = buildDateRange(7, (date) => {
      const key = date.toISOString().slice(0, 10);
      const dayItems = appointmentItems.filter((item) => item.appointmentDate?.slice(0, 10) === key);
      return {
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        scheduled: dayItems.filter((item) => item.status === "Scheduled").length,
        completed: dayItems.filter((item) => item.status === "Completed").length,
        cancelled: dayItems.filter((item) => item.status === "Cancelled").length,
      };
    });

    const revenueTrend = buildDateRange(7, (date) => {
      const key = date.toISOString().slice(0, 10);
      return {
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        value: billingItems
          .filter((item) => item.createdAt?.slice(0, 10) === key)
          .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      };
    });

    const bedMap = Array.from({ length: 12 }, (_, index) => {
      const patient = patientItems[index] || null;
      const status = patient ? (index % 5 === 0 ? "Reserved" : "Occupied") : "Available";
      return {
        id: `B-${String(index + 1).padStart(2, "0")}`,
        status,
        patient,
      };
    });

    return {
      stats: {
        patients: {
          value: timeRange === "month" ? patientCountMonth : patientCountToday,
          trend: getPercentageChange(timeRange === "month" ? patientCountMonth : patientCountToday, previousPatientCount),
        },
        doctors: {
          total: doctorItems.length,
          active: doctorItems.filter((item) => item.status === "Active").length,
          onLeave: doctorItems.filter((item) => item.status !== "Active").length,
        },
        appointments: {
          total: todayAppointments.length,
          pending: todayAppointments.filter((item) => item.status === "Scheduled").length,
          completed: todayAppointments.filter((item) => item.status === "Completed").length,
          cancelled: todayAppointments.filter((item) => item.status === "Cancelled").length,
          trend: getPercentageChange(todayAppointments.length, yesterdayAppointments.length),
        },
        occupancy: {
          occupied: bedMap.filter((bed) => bed.status === "Occupied").length,
          total: bedMap.length,
        },
        revenue: {
          total: revenueToday,
          trend: getPercentageChange(revenueToday, revenueYesterday),
        },
        staff: {
          total: staffItems.length,
          active: staffItems.filter((item) => item.status === "Active").length,
        },
      },
      charts: {
        patientAdmissionsSeries,
        departmentDistribution,
        weeklyAppointments,
        revenueTrend,
      },
      live: {
        queue: todayAppointments.slice(0, 8),
        bedMap,
        registrations: patientItems.slice(0, 5),
        surgeries: todayAppointments.filter((item) => item.status !== "Cancelled").slice(0, 5),
        leaveRequests: getLeaveRequests().slice(0, 5),
      },
    };
  }, [leaveRevision, timeRange]);

  const { data, isLoading, lastUpdated } = useLiveQuery(loadDashboard, {
    initialData: null,
    interval: 180000,
    errorMessage: "Unable to load admin dashboard",
  });

  const chartColors = useMemo(() => ["#188f83", "#36a89a", "#62c3b7", "#d98927", "#0f5e57"], []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <Button type="button" variant={timeRange === "today" ? "primary" : "secondary"} onClick={() => setTimeRange("today")}>
              {copy.today}
            </Button>
            <Button type="button" variant={timeRange === "month" ? "primary" : "secondary"} onClick={() => setTimeRange("month")}>
              {copy.month}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Badge variant="info">{copy.refresh}</Badge>
        <p className="text-sm text-[var(--text-muted)]">{`${copy.updated}: ${formatRelativeSeconds(lastUpdated)}`}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={HiOutlineUsers} label={copy.totalPatients} value={data?.stats.patients.value ?? "-"} trend={{ value: data?.stats.patients.trend ?? 0 }} helper={timeRange === "month" ? copy.registeredMonth : copy.registeredToday} isLoading={isLoading} />
        <StatCard icon={HiOutlineUserGroup} label={copy.doctors} value={data?.stats.doctors.total ?? "-"} helper={language === "hi" ? `${data?.stats.doctors.active ?? 0} सक्रिय / ${data?.stats.doctors.onLeave ?? 0} अवकाश पर` : `${data?.stats.doctors.active ?? 0} active / ${data?.stats.doctors.onLeave ?? 0} on leave`} isLoading={isLoading} />
        <StatCard icon={HiOutlineCalendarDays} label={copy.appointmentsToday} value={data?.stats.appointments.total ?? "-"} trend={{ value: data?.stats.appointments.trend ?? 0 }} helper={`${data?.stats.appointments.pending ?? 0} ${copy.pending} / ${data?.stats.appointments.completed ?? 0} ${language === "hi" ? "पूर्ण" : "completed"}`} isLoading={isLoading} />
        <StatCard icon={HiOutlineSquares2X2} label={copy.bedOccupancy} value={`${data?.stats.occupancy.occupied ?? 0}/${data?.stats.occupancy.total ?? 0}`} progress={{ value: ((data?.stats.occupancy.occupied ?? 0) / Math.max(1, data?.stats.occupancy.total ?? 1)) * 100, label: copy.occupiedBeds }} isLoading={isLoading} />
        <StatCard icon={HiOutlineBanknotes} label={copy.revenueToday} value={formatCurrency(data?.stats.revenue.total || 0)} trend={{ value: data?.stats.revenue.trend ?? 0 }} helper={copy.revenueHelper} isLoading={isLoading} />
        <StatCard icon={HiOutlineUserGroup} label={copy.staffCoverage} value={data?.stats.staff.total ?? "-"} helper={`${data?.stats.staff.active ?? 0} ${copy.activeSupport}`} isLoading={isLoading} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title={copy.patientAdmissions} subtitle={copy.last30Days}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts.patientAdmissionsSeries || []}>
                <defs>
                  <linearGradient id="patientAdmissions" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#188f83" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#188f83" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#188f83" fill="url(#patientAdmissions)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={copy.departmentMix} subtitle={copy.departmentMixSub}>
          <div className="h-80">
            {data?.charts.departmentDistribution?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.charts.departmentDistribution || []} dataKey="value" innerRadius={72} outerRadius={110} paddingAngle={2} isAnimationActive={false}>
                    {(data?.charts.departmentDistribution || []).map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title={copy.noDepartmentMix} description={copy.noDepartmentMixDesc} />
            )}
          </div>
        </Card>

        <Card title={copy.weeklyOutcomes} subtitle={copy.weeklyOutcomesSub}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.weeklyAppointments || []}>
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="scheduled" fill="#188f83" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="completed" fill="#36a89a" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="cancelled" fill="#d98927" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={copy.revenueTrend} subtitle={copy.last7Days}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts.revenueTrend || []}>
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0f5e57" strokeWidth={3} dot={{ fill: "#0f5e57" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <Card title={copy.queue} subtitle={copy.queueSub}>
          <div className="space-y-3">
            {data?.live.queue?.length ? (
              data.live.queue.map((appointment) => (
                <div key={appointment._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{getFullName(appointment.patientId)}</p>
                      <p className="text-sm text-[var(--text-muted)]">{`${getFullName(appointment.doctorId)} | ${appointment.appointmentTime}`}</p>
                    </div>
                    <Badge variant={appointment.status === "Completed" ? "success" : appointment.status === "Cancelled" ? "danger" : "info"}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title={copy.queueEmpty} description={copy.queueEmptyDesc} />
            )}
          </div>
        </Card>

        <Card title={copy.bedMap} subtitle={copy.bedMapSub}>
          <div className="grid grid-cols-3 gap-3">
            {(data?.live.bedMap || []).map((bed) => (
              <button
                key={bed.id}
                type="button"
                onClick={() => setSelectedBed(bed)}
                className={`rounded-2xl border px-3 py-4 text-left transition hover:-translate-y-0.5 ${
                  bed.status === "Occupied"
                    ? "border-rose-200 bg-rose-500/10"
                    : bed.status === "Reserved"
                      ? "border-amber-200 bg-amber-500/10"
                      : "border-emerald-200 bg-emerald-500/10"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">{bed.id}</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{bed.status}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card title={copy.registrations} subtitle={copy.registrationsSub}>
          <div className="space-y-3">
            {(data?.live.registrations || []).map((patient) => (
              <div key={patient._id} className="flex items-center gap-3 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <Avatar name={getFullName(patient)} size="sm" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{getFullName(patient)}</p>
                  <p className="text-sm text-[var(--text-muted)]">{`${patient.city || "General"} | ${new Date(patient.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={copy.surgeries} subtitle={copy.surgeriesSub}>
          <div className="space-y-3">
            {(data?.live.surgeries || []).map((item) => (
              <div key={item._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{`${item.appointmentTime} - ${getFullName(item.patientId)}`}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{`${getFullName(item.doctorId)} | ${copy.room} ${Number.parseInt(item._id.slice(-2), 16) % 6 + 1}`}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title={copy.leaveRequests} subtitle={copy.leaveRequestsSub}>
          <div className="space-y-3">
            {(data?.live.leaveRequests || []).length ? (
              data.live.leaveRequests.map((request) => (
                <div key={request.id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{request.doctorName}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{`${request.from} - ${request.to}`}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{request.reason}</p>
                    </div>
                    <Badge variant={request.status === "Approved" ? "success" : request.status === "Rejected" ? "danger" : "warning"}>
                      {request.status === "Approved" ? copy.approved : request.status === "Rejected" ? copy.rejected : copy.pending}
                    </Badge>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => updateLeaveRequestStatus(request.id, "Approved")}>
                      {copy.approve}
                    </Button>
                    <Button type="button" variant="ghost" className="flex-1 text-rose-600" onClick={() => updateLeaveRequestStatus(request.id, "Rejected")}>
                      {copy.reject}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title={copy.noLeaveRequests} description={copy.noLeaveRequestsDesc} />
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Button type="button" className="w-full gap-2" onClick={() => navigate("/admin/patients")}>
          <HiOutlinePlusCircle className="text-lg" />
          {copy.registerPatient}
        </Button>
        <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => navigate("/admin/appointments")}>
          <HiOutlineCalendarDays className="text-lg" />
          {copy.scheduleAppointment}
        </Button>
        <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => navigate("/admin/doctors")}>
          <HiOutlineUserGroup className="text-lg" />
          {copy.addDoctor}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          onClick={() =>
            downloadCsv(
              [
                ["Metric", "Value"],
                ["Patients", String(data?.stats.patients.value ?? 0)],
                ["Doctors", String(data?.stats.doctors.total ?? 0)],
                ["Appointments Today", String(data?.stats.appointments.total ?? 0)],
                ["Revenue Today", String(data?.stats.revenue.total ?? 0)],
              ],
              "admin-dashboard-report.csv"
            )
          }
        >
          <HiOutlineDocumentArrowDown className="text-lg" />
          {copy.generateReport}
        </Button>
      </section>

      <Modal open={Boolean(selectedBed)} onClose={() => setSelectedBed(null)} title={selectedBed?.id} description={copy.bedDetails} size="md">
        {selectedBed?.patient ? (
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p><strong>{copy.name}:</strong> {getFullName(selectedBed.patient)}</p>
            <p><strong>{copy.status}:</strong> {selectedBed.status}</p>
            <p><strong>{copy.city}:</strong> {selectedBed.patient.city || copy.notProvided}</p>
            <p><strong>{copy.bloodType}:</strong> {selectedBed.patient.bloodType || copy.notProvided}</p>
          </div>
        ) : (
          <EmptyState title={copy.bedAvailable} description={copy.bedAvailableDesc} />
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboardPage;
