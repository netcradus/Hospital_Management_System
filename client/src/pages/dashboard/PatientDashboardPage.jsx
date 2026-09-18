import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowDownTray, HiOutlineBell, HiOutlineCalendarDays, HiOutlineClipboardDocumentList, HiOutlineCreditCard, HiOutlineBeaker } from "react-icons/hi2";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import useLiveQuery from "../../hooks/useLiveQuery";
import { createEntityService } from "../../services/entityService";
import { ensureSupplementData, getNotificationsForUser, getPatientSupplement } from "../../services/hmsSupplementService";
import { printPrescription } from "../../utils/prescriptionPrint";

const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");
const doctorService = createEntityService("doctors");

const hospitalProfile = {
  name: "MEDICare HMS",
  address: "17 Care Avenue, Kolkata, India",
  contact: "+91 33 4000 2244 | care@medicare-hms.demo",
};

function PatientDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = language === "hi"
    ? {
        eyebrow: "मरीज डैशबोर्ड",
        welcome: "स्वागत है",
        description: "आगामी अपॉइंटमेंट, सक्रिय दवाइयाँ, टेस्ट रिजल्ट, बकाया बिल और नोटिफिकेशन एक जगह।",
        nextAppointment: "अगला अपॉइंटमेंट",
        activePrescriptions: "सक्रिय प्रिस्क्रिप्शन",
        recentTests: "हाल के टेस्ट रिजल्ट",
        pendingInvoices: "बकाया इनवॉइस",
      }
    : {
        eyebrow: "Patient Dashboard",
        welcome: "Welcome",
        description: "Upcoming care, active prescriptions, test results, pending invoices, and alerts in one place.",
        nextAppointment: "Next appointment",
        activePrescriptions: "Active prescriptions",
        recentTests: "Recent test results",
        pendingInvoices: "Pending invoices",
      };

  const loadDashboard = useCallback(async () => {
    const [patients, appointments, billing, doctors] = await Promise.all([
      patientService.list({ limit: 100 }, { force: true }),
      appointmentService.list({ limit: 200 }, { force: true }),
      billingService.list({ limit: 200 }, { force: true }),
      doctorService.list({ limit: 100 }, { force: true }),
    ]);

    const patientProfile =
      patients.items.find((patient) => String(patient.userId) === String(user?.id)) ||
      patients.items.find((patient) => patient.email?.toLowerCase() === user?.email?.toLowerCase()) ||
      patients.items[0];

    ensureSupplementData({
      patients: patients.items,
      doctors: doctors.items,
      appointments: appointments.items,
      billing: billing.items,
    });

    const patientAppointments = appointments.items.filter((item) => String(item.patientId?._id || item.patientId) === String(patientProfile?._id));
    const patientBilling = billing.items.filter((item) => String(item.patientId?._id || item.patientId) === String(patientProfile?._id));
    const supplement = getPatientSupplement(patientProfile?._id);

    return {
      patientProfile,
      appointments: patientAppointments,
      billing: patientBilling,
      doctors: doctors.items,
      supplement,
      notifications: getNotificationsForUser(user, { appointments: patientAppointments, billing: patientBilling, patients: patients.items, doctors: doctors.items }),
    };
  }, [user]);

  const { data, isLoading } = useLiveQuery(loadDashboard, {
    initialData: null,
    interval: 180000,
    errorMessage: "Unable to load patient dashboard",
  });

  const nextAppointment = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (data?.appointments || [])
      .filter((item) => item.status !== "Cancelled" && item.status !== "Completed" && new Date(item.appointmentDate) >= now)
      .sort((left, right) => new Date(left.appointmentDate) - new Date(right.appointmentDate))[0];
  }, [data?.appointments]);

  const nextAppointmentDoctor = useMemo(() => {
    if (!nextAppointment) return "";
    const docId = String(nextAppointment.doctorId?._id || nextAppointment.doctorId || "");
    const doctorObj = (data?.doctors || []).find((d) => String(d._id) === docId);
    if (doctorObj) {
      return `${doctorObj.firstName} ${doctorObj.lastName}`;
    }
    if (nextAppointment.doctorId?.firstName) {
      return `${nextAppointment.doctorId.firstName} ${nextAppointment.doctorId.lastName}`;
    }
    return "Doctor";
  }, [nextAppointment, data?.doctors]);

  const pendingInvoices = (data?.billing || []).filter((item) => item.paymentStatus !== "Paid");
  const recentTests = (data?.supplement?.tests || []).slice(0, 4);
  const activePrescriptions = (data?.supplement?.prescriptions || []).filter((item) => item.status === "Active");
  const lastPrescription = data?.supplement?.prescriptions?.[0];

  const handleDownloadPrescription = () => {
    if (!lastPrescription || !data?.patientProfile) {
      return;
    }

    const doctor = data.doctors.find((item) => item._id === lastPrescription.doctorId);
    printPrescription({
      hospital: hospitalProfile,
      doctor: {
        name: doctor ? `${doctor.firstName} ${doctor.lastName}` : "Doctor",
        qualifications: doctor?.qualifications?.join(", "),
        registrationNumber: doctor?.licenseNumber,
        specialization: doctor?.specialization,
      },
      patient: {
        name: `${data.patientProfile.firstName} ${data.patientProfile.lastName}`,
        age: "-",
        gender: data.patientProfile.gender,
        patientCode: data.patientProfile.patientId || data.supplement.patientCode || data.patientProfile._id,
      },
      prescription: lastPrescription,
      diagnosis: data.supplement.diagnoses.find((item) => item.id === lastPrescription.diagnosisId),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={`${copy.welcome}, ${data?.patientProfile?.firstName || user?.name || "Patient"}`}
        description={copy.description}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HiOutlineCalendarDays} label={copy.nextAppointment} value={nextAppointment ? new Date(nextAppointment.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not scheduled"} helper={nextAppointment?.appointmentTime || "Book when ready"} isLoading={isLoading} />
        <StatCard icon={HiOutlineClipboardDocumentList} label={copy.activePrescriptions} value={activePrescriptions.length} helper="Current medications" isLoading={isLoading} />
        <StatCard icon={HiOutlineBeaker} label={copy.recentTests} value={recentTests.length} helper="Latest lab updates" isLoading={isLoading} />
        <StatCard icon={HiOutlineCreditCard} label={copy.pendingInvoices} value={pendingInvoices.length} helper="Awaiting payment" isLoading={isLoading} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card title="Upcoming Appointment" subtitle="Your next scheduled doctor consultation">
          {nextAppointment ? (
            <div className="rounded-[28px] border border-[var(--border-color)] bg-gradient-to-r from-[rgba(26,188,156,0.12)] to-[rgba(41,128,232,0.08)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Upcoming Appointment Notification</p>
              <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                Your appointment with Dr. {nextAppointmentDoctor} is scheduled for{" "}
                <span className="font-bold text-brand-700">
                  {new Date(nextAppointment.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </span>{" "}
                at <span className="font-bold text-brand-700">{nextAppointment.appointmentTime}</span>.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-color)]/60 pt-3 text-xs text-[var(--text-muted)]">
                <span>Appointment ID: <strong className="font-mono text-[var(--text-primary)]">{nextAppointment.appointmentId || nextAppointment._id}</strong></span>
                <span>Reason: {nextAppointment.reasonForVisit || "Consultation"}</span>
                <span>Status: <Badge variant="success">{nextAppointment.status}</Badge></span>
              </div>
            </div>
          ) : (
            <EmptyState title="No upcoming appointment" description="Your next appointment will appear here once scheduled." />
          )}
        </Card>

        <Card title="Download Last Prescription" subtitle="Available for patient role">
          {lastPrescription ? (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                <p className="font-medium">{new Date(lastPrescription.date).toLocaleDateString("en-IN")}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{lastPrescription.medicines.map((item) => item.name).join(", ")}</p>
              </div>
              <Button type="button" className="w-full" onClick={handleDownloadPrescription}>
                <HiOutlineArrowDownTray className="mr-2 text-base" />
                Download Last Prescription
              </Button>
            </div>
          ) : (
            <EmptyState title="No prescription found" description="Your latest prescription will be available here after a doctor updates it." />
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Active Prescriptions" subtitle="Current medication summary">
          <div className="space-y-3">
            {activePrescriptions.length ? activePrescriptions.map((prescription) => (
              <div key={prescription.id} className="rounded-[24px] border border-[rgba(26,188,156,0.22)] bg-[rgba(26,188,156,0.08)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{new Date(prescription.date).toLocaleDateString("en-IN")}</p>
                  <Badge variant="success">{prescription.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{prescription.medicines.map((item) => `${item.name} (${item.dose})`).join(", ")}</p>
              </div>
            )) : <EmptyState title="No active prescriptions" description="Active prescription summaries will appear here." />}
          </div>
        </Card>

        <Card title="Recent Test Results" subtitle="Latest tests conducted">
          <div className="space-y-3">
            {recentTests.length ? recentTests.map((test) => (
              <div key={test.id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{test.testName}</p>
                  <Badge variant={test.status === "Reviewed" || test.status === "Completed" ? "success" : "warning"}>{test.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{test.resultValue || "Result pending"}</p>
              </div>
            )) : <EmptyState title="No test results" description="Completed lab results will show here." />}
          </div>
        </Card>

        <Card title="Billing & Payment Due" subtitle="Outstanding medical bills summary">
          {pendingInvoices.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-rose-200 bg-rose-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Payment Due</span>
                  <Badge variant="danger">Pending</Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-rose-600">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
                      pendingInvoices.reduce((sum, item) => sum + Math.max(0, Number(item.totalAmount || item.amount || 0) - Number(item.amountPaid || 0)), 0)
                    )}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                    {pendingInvoices[0].invoiceNumber || pendingInvoices[0]._id.slice(-6)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Doctor: Dr. {pendingInvoices[0].doctorId?.firstName || "Consultant"} &bull; {pendingInvoices[0].serviceDescription || "Medical Consultation"}
                </p>
              </div>
              <Button type="button" className="w-full" onClick={() => navigate("/patient/billing")}>
                <HiOutlineCreditCard className="mr-2 text-base" />
                Pay Now
              </Button>
            </div>
          ) : (
            <EmptyState title="No Pending Payment" description="All your medical invoices are fully paid and settled." />
          )}
        </Card>

        <Card title="Notification Center" subtitle="Latest in-app reminders and medical updates">
          <div className="space-y-3">
            {(data?.notifications || []).slice(0, 5).length ? (data.notifications || []).slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <div className="flex items-center gap-2">
                  <HiOutlineBell className="text-base text-[var(--teal-dark)]" />
                  <Badge variant={item.read ? "default" : "info"}>{item.category}</Badge>
                </div>
                <p className="mt-3 font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{item.detail}</p>
              </div>
            )) : <EmptyState title="No notifications" description="Appointment, billing, and test notifications will appear here." />}
          </div>
        </Card>
      </section>
    </div>
  );
}

export default PatientDashboardPage;
