import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { HiOutlineArrowDownTray, HiOutlineCalendarDays, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlinePlus } from "react-icons/hi2";
import { toast } from "sonner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { createEntityService } from "../../services/entityService";
import {
  addDiagnosis,
  ensureSupplementData,
  getPatientSupplement,
  saveDiagnosisNote,
  savePrescription,
  saveTestResult,
} from "../../services/hmsSupplementService";
import { printPrescription } from "../../utils/prescriptionPrint";

const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");
const doctorService = createEntityService("doctors");
const billingService = createEntityService("billing");

const hospitalProfile = {
  name: "MEDICare HMS",
  address: "17 Care Avenue, Kolkata, India",
  contact: "+91 33 4000 2244 | care@medicare-hms.demo",
};

function calculateAge(dob) {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

function buildCalendarDays(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

function severityVariant(value) {
  return value === "Severe" ? "danger" : value === "Moderate" ? "warning" : "success";
}

function statusVariant(value) {
  if (["Active", "Completed", "Reviewed"].includes(value)) {
    return "success";
  }
  if (["Pending", "Follow-up Required"].includes(value)) {
    return "warning";
  }
  if (["Discontinued", "Inactive", "Urgent"].includes(value)) {
    return "danger";
  }
  return "info";
}

function visitKind(appointment) {
  const type = String(appointment.appointmentType || "").toLowerCase();
  const reason = String(appointment.reasonForVisit || "").toLowerCase();
  if (type.includes("emergency") || reason.includes("emergency")) {
    return "emergency";
  }
  if (type.includes("follow") || reason.includes("follow")) {
    return "follow-up";
  }
  return "routine";
}

function PatientProfilePage() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedVisitKey, setSelectedVisitKey] = useState("");
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [reportModal, setReportModal] = useState(null);
  const [prescriptionPage, setPrescriptionPage] = useState(1);
  const [diagnosisForm, setDiagnosisForm] = useState({
    diseaseName: "",
    icd10: "",
    dateDiagnosed: new Date().toISOString().slice(0, 10),
    severity: "Mild",
    currentStatus: "Active",
    doctorId: "",
  });
  const [noteForm, setNoteForm] = useState({
    tag: "Observation",
    diagnosisId: "",
    appointmentId: "",
    content: "",
  });
  const [showPrescriptionHint, setShowPrescriptionHint] = useState(false);

  const loadProfile = useCallback(async () => {
    const [patient, appointmentsResponse, doctorsResponse, patientsResponse, billingResponse] = await Promise.all([
      patientService.getById(patientId),
      appointmentService.list({ limit: 200 }, { force: true }),
      doctorService.list({ limit: 100 }, { force: true }),
      patientService.list({ limit: 200 }, { force: true }),
      billingService.list({ limit: 200 }, { force: true }),
    ]);

    ensureSupplementData({
      patients: patientsResponse.items,
      doctors: doctorsResponse.items,
      appointments: appointmentsResponse.items,
      billing: billingResponse.items,
    });

    const patientAppointments = appointmentsResponse.items
      .filter((item) => String(item.patientId?._id || item.patientId) === String(patientId))
      .sort((left, right) => new Date(right.appointmentDate) - new Date(left.appointmentDate));
    const supplement = getPatientSupplement(patientId);

    setDiagnosisForm((current) => ({
      ...current,
      doctorId: current.doctorId || doctorsResponse.items[0]?._id || "",
    }));
    setNoteForm((current) => ({
      ...current,
      diagnosisId: current.diagnosisId || supplement.diagnoses[0]?.id || "",
      appointmentId: current.appointmentId || patientAppointments[0]?._id || "",
    }));
    setSelectedVisitKey(patientAppointments[0]?.appointmentDate?.slice(0, 10) || "");
    setData({
      patient,
      doctors: doctorsResponse.items,
      appointments: patientAppointments,
      supplement,
    });
  }, [patientId]);

  useEffect(() => {
    loadProfile();
    const refresh = () => loadProfile();
    window.addEventListener("hms:supplement-updated", refresh);
    return () => window.removeEventListener("hms:supplement-updated", refresh);
  }, [loadProfile]);

  const age = useMemo(() => calculateAge(data?.patient?.dob), [data?.patient?.dob]);
  const visitsByDay = useMemo(() => {
    return (data?.appointments || []).reduce((accumulator, appointment) => {
      accumulator[new Date(appointment.appointmentDate).toISOString().slice(0, 10)] = appointment;
      return accumulator;
    }, {});
  }, [data?.appointments]);
  const selectedVisit = selectedVisitKey ? visitsByDay[selectedVisitKey] : null;
  const currentMonthDays = useMemo(() => buildCalendarDays(monthCursor), [monthCursor]);
  const totalVisits = data?.appointments?.length || 0;
  const lastVisit = data?.appointments?.find((item) => new Date(item.appointmentDate) <= new Date());
  const nextVisit = [...(data?.appointments || [])].reverse().find((item) => new Date(item.appointmentDate) >= new Date());
  const allPrescriptions = data?.supplement?.prescriptions || [];
  const activePrescriptions = allPrescriptions.filter((item) => item.status === "Active");
  const lastPrescription = allPrescriptions[0];
  const prescriptionsPerPage = 10;
  const totalPrescriptionPages = Math.max(1, Math.ceil(allPrescriptions.length / prescriptionsPerPage));
  const paginatedPrescriptions = allPrescriptions.slice((prescriptionPage - 1) * prescriptionsPerPage, prescriptionPage * prescriptionsPerPage);
  const canEditNotes = user?.role === "doctor" || user?.role === "super_admin";
  const canUploadResult = user?.role === "lab_staff" || user?.role === "super_admin";
  const canAddDiagnosis = user?.role === "doctor" || user?.role === "super_admin";

  if (!data) {
    return <div className="min-h-[40vh]" />;
  }

  const doctorLookup = new Map(data.doctors.map((doctor) => [doctor._id, doctor]));
  const diagnosisLookup = new Map(data.supplement.diagnoses.map((diagnosis) => [diagnosis.id, diagnosis]));

  const downloadPrescription = (prescription) => {
    const doctor = doctorLookup.get(prescription.doctorId);
    const diagnosis = diagnosisLookup.get(prescription.diagnosisId);
    printPrescription({
      hospital: hospitalProfile,
      doctor: {
        name: doctor ? `${doctor.firstName} ${doctor.lastName}` : "Doctor",
        qualifications: doctor?.qualifications?.join(", "),
        registrationNumber: doctor?.licenseNumber,
        specialization: doctor?.specialization,
      },
      patient: {
        name: `${data.patient.firstName} ${data.patient.lastName}`,
        age,
        gender: data.patient.gender,
        patientCode: data.supplement.patientCode || data.patient._id,
      },
      prescription,
      diagnosis,
    });
  };

  const submitDiagnosis = () => {
    if (!diagnosisForm.diseaseName.trim()) {
      toast.error("Disease name is required");
      return;
    }

    addDiagnosis(
      {
        ...diagnosisForm,
        patientId,
        dateDiagnosed: new Date(diagnosisForm.dateDiagnosed).toISOString(),
      },
      user
    );
    toast.success("Diagnosis added");
    setDiagnosisModalOpen(false);
  };

  const submitNote = () => {
    if (!noteForm.content.trim()) {
      toast.error("Add note content first");
      return;
    }

    saveDiagnosisNote(
      {
        ...noteForm,
        patientId,
        doctorId: data.doctors.find((doctor) => doctor.email?.toLowerCase() === user?.email?.toLowerCase())?._id || data.doctors[0]?._id,
      },
      user
    );
    toast.success("Diagnosis note saved");
    setNoteForm((current) => ({ ...current, content: "" }));
  };

  const uploadResult = (test) => {
    saveTestResult(
      {
        ...test,
        status: "Completed",
        resultValue: test.resultValue || "Result uploaded",
        fileName: test.fileName || `${test.testName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      },
      user
    );
    toast.success("Test result updated");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Profile"
        title={`${data.patient.firstName} ${data.patient.lastName}`}
        description="Enhanced patient detail page with diagnoses, visits, prescriptions, notes, and tests."
      />

      <Card>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-3xl font-semibold text-white">
            {`${data.patient.firstName?.[0] || ""}${data.patient.lastName?.[0] || ""}`}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Full Name</p>
              <p className="text-xl font-semibold">{`${data.patient.firstName} ${data.patient.lastName}`}</p>
              <p className="text-sm text-[var(--text-muted)]">{age || "-"} years • {data.patient.gender || "-"} • {data.patient.bloodType || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Contact</p>
              <p>{data.patient.phone || "-"}</p>
              <p className="text-sm text-[var(--text-muted)]">{data.patient.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Address</p>
              <p>{data.patient.address || [data.patient.city, data.patient.state, data.patient.zipCode].filter(Boolean).join(", ") || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Emergency Contact</p>
              <p>{data.patient.emergencyContact?.name || "-"}</p>
              <p className="text-sm text-[var(--text-muted)]">{data.patient.emergencyContact?.relationship || "-"} • {data.patient.emergencyContact?.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Insurance</p>
              <p>{data.patient.insurance?.provider || "-"}</p>
              <p className="text-sm text-[var(--text-muted)]">Policy #{data.patient.insurance?.policyNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Allergies</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(data.patient.allergies?.length ? data.patient.allergies : ["No known allergies"]).map((item) => (
                  <span key={item} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Badge variant={data.patient.status === "Active" ? "success" : "danger"}>{data.patient.status}</Badge>
            <div className="rounded-[22px] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--text-muted)]">
              Patient ID:{" "}
              <span className="font-mono tracking-wider text-[var(--text-dim)]">{data.supplement.patientCode || data.patient._id}</span>
              <button
                type="button"
                className="ml-2 text-xs text-[var(--teal)]"
                onClick={() => navigator.clipboard?.writeText(String(data.supplement.patientCode || data.patient._id))}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card
          title="Disease & Diagnosis History"
          subtitle="Timeline of diagnosed conditions"
          action={
            canAddDiagnosis ? (
              <Button type="button" onClick={() => setDiagnosisModalOpen(true)}>
                <HiOutlinePlus className="mr-2 text-base" />
                Add Diagnosis
              </Button>
            ) : null
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                  <th className="py-3 pr-4">Disease</th>
                  <th className="py-3 pr-4">ICD-10</th>
                  <th className="py-3 pr-4">Date Diagnosed</th>
                  <th className="py-3 pr-4">Severity</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Doctor</th>
                </tr>
              </thead>
              <tbody>
                {data.supplement.diagnoses.length ? data.supplement.diagnoses.map((diagnosis) => {
                  const doctor = doctorLookup.get(diagnosis.doctorId);
                  return (
                    <tr key={diagnosis.id} className="border-b border-[var(--border-color)]/70">
                      <td className="py-3 pr-4 font-medium">{diagnosis.diseaseName}</td>
                      <td className="py-3 pr-4">{diagnosis.icd10}</td>
                      <td className="py-3 pr-4">{formatDate(diagnosis.dateDiagnosed)}</td>
                      <td className="py-3 pr-4"><Badge variant={severityVariant(diagnosis.severity)}>{diagnosis.severity}</Badge></td>
                      <td className="py-3 pr-4"><Badge variant={statusVariant(diagnosis.currentStatus)}>{diagnosis.currentStatus}</Badge></td>
                      <td className="py-3">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "-"}</td>
                    </tr>
                  );
                }) : (
                  <tr><td className="py-4 text-[var(--text-muted)]" colSpan={6}>No diagnoses recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Visit Calendar" subtitle="2-year visit navigation and summary">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Total Visits</p>
              <p className="mt-2 text-2xl font-semibold">{totalVisits}</p>
            </div>
            <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Last Visit</p>
              <p className="mt-2 text-base font-semibold">{formatDate(lastVisit?.appointmentDate)}</p>
            </div>
            <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Next Appointment</p>
              <p className="mt-2 text-base font-semibold">{formatDate(nextVisit?.appointmentDate)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setMonthCursor((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}>
                <HiOutlineChevronLeft />
              </Button>
              <div className="rounded-[20px] bg-[var(--panel-muted)] px-4 py-2 font-semibold">
                {monthCursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </div>
              <Button type="button" variant="secondary" onClick={() => setMonthCursor((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}>
                <HiOutlineChevronRight />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant={viewMode === "calendar" ? "primary" : "secondary"} onClick={() => setViewMode("calendar")}>Calendar</Button>
              <Button type="button" variant={viewMode === "list" ? "primary" : "secondary"} onClick={() => setViewMode("list")}>List</Button>
            </div>
          </div>

          {viewMode === "calendar" ? (
            <div className="mt-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => <span key={label}>{label}</span>)}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {currentMonthDays.map((date) => {
                  const key = date.toISOString().slice(0, 10);
                  const visit = visitsByDay[key];
                  const variant = visit ? visitKind(visit) : null;
                  const dotClass = variant === "emergency" ? "bg-rose-500" : variant === "follow-up" ? "bg-amber-500" : variant ? "bg-emerald-500" : "";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => visit && setSelectedVisitKey(key)}
                      className={`min-h-[74px] rounded-[20px] border p-2 text-left transition ${date.getMonth() === monthCursor.getMonth() ? "" : "opacity-45"} ${visit ? "border-[rgba(26,188,156,0.24)] bg-[var(--panel-muted)]" : "border-[var(--border-color)] bg-[var(--panel-bg)]"} ${selectedVisitKey === key ? "ring-2 ring-[rgba(26,188,156,0.32)]" : ""}`}
                    >
                      <span className="text-sm font-semibold">{date.getDate()}</span>
                      {visit ? <span className={`mt-4 block h-2.5 w-2.5 rounded-full ${dotClass}`} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.appointments.length ? data.appointments.map((appointment) => (
                <button key={appointment._id} type="button" onClick={() => setSelectedVisitKey(appointment.appointmentDate.slice(0, 10))} className="w-full rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{formatDate(appointment.appointmentDate)} • {appointment.appointmentTime}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{appointment.reasonForVisit || "Visit recorded"}</p>
                    </div>
                    <Badge variant={statusVariant(visitKind(appointment) === "emergency" ? "Urgent" : visitKind(appointment) === "follow-up" ? "Follow-up Required" : "Active")}>
                      {visitKind(appointment)}
                    </Badge>
                  </div>
                </button>
              )) : <EmptyState title="No visits recorded" description="Visit history will appear here once appointments exist." />}
            </div>
          )}

          <div className="mt-4 rounded-[24px] bg-[var(--panel-muted)] p-4">
            {selectedVisit ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--teal-dark)]">
                  <HiOutlineCalendarDays />
                  Visit summary
                </div>
                <p className="mt-3 font-medium">{`${selectedVisit.doctorId?.firstName || ""} ${selectedVisit.doctorId?.lastName || ""}`.trim() || "Doctor unavailable"}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedVisit.reasonForVisit || "Visit reason not available"}</p>
                <p className="mt-3 text-sm">Duration: {selectedVisit.duration || 30} min</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedVisit.notes || "No visit notes recorded."}</p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Select a visit date to view the summary.</p>
            )}
          </div>
        </Card>
      </section>

      <Card
        title="Prescriptions"
        subtitle="Historical and active medication lists"
        action={
          canEditNotes ? (
            <Button type="button" variant="secondary" onClick={() => setShowPrescriptionHint(true)}>
              Add Prescription
            </Button>
          ) : null
        }
      >
        {lastPrescription ? (
          <div className="mb-5 rounded-[28px] bg-gradient-to-r from-[rgba(26,188,156,0.12)] to-[rgba(41,128,232,0.08)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal-dark)]">Last Prescription Note</p>
                <p className="mt-3 text-lg font-semibold">{(diagnosisLookup.get(lastPrescription.diagnosisId)?.diseaseName) || "Recent prescription"}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{formatDate(lastPrescription.date)}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {lastPrescription.medicines.map((medicine) => (
                    <p key={`${lastPrescription.id}-${medicine.name}`}>{medicine.name} • {medicine.dose} • {medicine.frequency} • {medicine.duration}</p>
                  ))}
                </div>
              </div>
              <Button type="button" className="min-w-[220px]" onClick={() => downloadPrescription(lastPrescription)}>
                <HiOutlineArrowDownTray className="mr-2 text-base" />
                Download
              </Button>
            </div>
          </div>
        ) : null}

        {activePrescriptions.length ? (
          <div className="mb-5 rounded-[24px] border border-[rgba(26,188,156,0.22)] bg-[rgba(26,188,156,0.08)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal-dark)]">Current Active Prescriptions</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {activePrescriptions.map((prescription) => (
                <div key={prescription.id} className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
                  {prescription.medicines.map((medicine) => medicine.name).join(", ")}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {paginatedPrescriptions.length ? paginatedPrescriptions.map((prescription) => {
            const doctor = doctorLookup.get(prescription.doctorId);
            return (
              <div key={prescription.id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold">{formatDate(prescription.date)}</p>
                      <Badge variant={statusVariant(prescription.status)}>{prescription.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "Doctor"} • {(diagnosisLookup.get(prescription.diagnosisId)?.diseaseName) || "Diagnosis pending"}</p>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {prescription.medicines.map((medicine) => (
                        <div key={`${prescription.id}-${medicine.name}`} className="rounded-[18px] bg-white/85 px-4 py-3 text-sm">
                          <p className="font-medium">{medicine.name}</p>
                          <p className="text-[var(--text-muted)]">{medicine.dose} • {medicine.frequency}</p>
                          <p className="text-[var(--text-muted)]">{medicine.duration}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-[var(--text-muted)]">{prescription.notes}</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => downloadPrescription(prescription)}>
                    <HiOutlineArrowDownTray className="mr-2 text-base" />
                    Download Prescription
                  </Button>
                </div>
              </div>
            );
          }) : <EmptyState title="No prescriptions yet" description="Prescription cards will appear here once medicines are recorded." />}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">Page {prescriptionPage} of {totalPrescriptionPages}</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={prescriptionPage === 1} onClick={() => setPrescriptionPage((value) => value - 1)}>Prev</Button>
            <Button type="button" variant="secondary" disabled={prescriptionPage === totalPrescriptionPages} onClick={() => setPrescriptionPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      <section className="space-y-6">
        <Card title="Diagnosis Notes" subtitle={canEditNotes ? "Doctors can add/edit notes. Patients can only read." : "Read-only notes"}>
          {canEditNotes ? (
            <div className="mb-4 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--text-muted)]">Tag</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-white px-4" value={noteForm.tag} onChange={(event) => setNoteForm((current) => ({ ...current, tag: event.target.value }))}>
                    {["Observation", "Follow-up Required", "Referred", "Urgent"].map((tag) => <option key={tag}>{tag}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--text-muted)]">Diagnosis</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-white px-4" value={noteForm.diagnosisId} onChange={(event) => setNoteForm((current) => ({ ...current, diagnosisId: event.target.value }))}>
                    {data.supplement.diagnoses.map((diagnosis) => <option key={diagnosis.id} value={diagnosis.id}>{diagnosis.diseaseName}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--text-muted)]">Visit</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-white px-4" value={noteForm.appointmentId} onChange={(event) => setNoteForm((current) => ({ ...current, appointmentId: event.target.value }))}>
                    {data.appointments.map((appointment) => <option key={appointment._id} value={appointment._id}>{formatDate(appointment.appointmentDate)} • {appointment.reasonForVisit || "Visit"}</option>)}
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-sm">
                <span className="mb-2 block text-[var(--text-muted)]">Rich text notes</span>
                <textarea
                  rows={5}
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-white px-4 py-3"
                  value={noteForm.content}
                  onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))}
                  placeholder="Write observations, follow-up instructions, or referral notes..."
                />
              </label>
              <div className="mt-3 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!noteForm.appointmentId) {
                      toast.error("Select a visit first");
                      return;
                    }
                    savePrescription(
                      {
                        patientId,
                        appointmentId: noteForm.appointmentId,
                        diagnosisId: noteForm.diagnosisId,
                        doctorId: data.doctors.find((doctor) => doctor.email?.toLowerCase() === user?.email?.toLowerCase())?._id || data.doctors[0]?._id,
                        status: "Active",
                        notes: noteForm.content || "Prescription note saved from diagnosis workspace.",
                        medicines: [
                          { name: "Review medication", dose: "As advised", frequency: "Daily", duration: "14 days", instructions: "See detailed notes" },
                        ],
                      },
                      user
                    );
                    toast.success("Prescription draft added");
                    setShowPrescriptionHint(false);
                  }}
                >
                  Add Prescription
                </Button>
                <Button type="button" onClick={submitNote}>Save Note</Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {data.supplement.diagnosisNotes.length ? data.supplement.diagnosisNotes.map((note) => {
              const doctor = doctorLookup.get(note.doctorId);
              return (
                <div key={note.id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "Doctor"}</p>
                      <p className="text-sm text-[var(--text-muted)]">{formatDate(note.timestamp)}</p>
                    </div>
                    <Badge variant={statusVariant(note.tag)}>{note.tag}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{note.content}</p>
                </div>
              );
            }) : <EmptyState title="No diagnosis notes" description="Doctors can add notes here and patients can review them." />}
          </div>
        </Card>

        <Card title="Tests Conducted" subtitle="Lab reports and ordered tests">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                  <th className="py-3 pr-4">Test Name</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Ordered By</th>
                  <th className="py-3 pr-4">Lab / Department</th>
                  <th className="py-3 pr-4">Result Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.supplement.tests.length ? data.supplement.tests.map((test) => {
                  const doctor = doctorLookup.get(test.doctorId);
                  return (
                    <tr key={test.id} className="border-b border-[var(--border-color)]/70">
                      <td className="py-3 pr-4 font-medium">{test.testName}</td>
                      <td className="py-3 pr-4">{formatDate(test.date)}</td>
                      <td className="py-3 pr-4">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "-"}</td>
                      <td className="py-3 pr-4">{test.department}</td>
                      <td className="py-3 pr-4"><Badge variant={statusVariant(test.status)}>{test.status}</Badge></td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {canUploadResult ? <Button type="button" variant="secondary" onClick={() => uploadResult(test)}>Upload Result</Button> : null}
                          <Button type="button" variant="secondary" onClick={() => setReportModal(test)}>View Report</Button>
                          <Button type="button" variant="secondary" onClick={() => window.print()}>
                            <HiOutlineArrowDownTray className="mr-2 text-base" />
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td className="py-4 text-[var(--text-muted)]" colSpan={6}>No tests recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Modal open={diagnosisModalOpen} onClose={() => setDiagnosisModalOpen(false)} title="Add Diagnosis" description="Create a new diagnosis entry." size="md">
        <div className="space-y-4">
          <InputField label="Disease Name" value={diagnosisForm.diseaseName} onChange={(event) => setDiagnosisForm((current) => ({ ...current, diseaseName: event.target.value }))} />
          <InputField label="ICD-10 Code" value={diagnosisForm.icd10} onChange={(event) => setDiagnosisForm((current) => ({ ...current, icd10: event.target.value }))} />
          <InputField
            label="Date Diagnosed"
            type="date"
            min="1920-01-01"
            max={new Date().toISOString().split("T")[0]}
            value={diagnosisForm.dateDiagnosed}
            onChange={(event) => setDiagnosisForm((current) => ({ ...current, dateDiagnosed: event.target.value }))}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">Severity</span>
              <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={diagnosisForm.severity} onChange={(event) => setDiagnosisForm((current) => ({ ...current, severity: event.target.value }))}>
                {["Mild", "Moderate", "Severe"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">Status</span>
              <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={diagnosisForm.currentStatus} onChange={(event) => setDiagnosisForm((current) => ({ ...current, currentStatus: event.target.value }))}>
                {["Active", "Resolved", "Chronic"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">Doctor</span>
              <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={diagnosisForm.doctorId} onChange={(event) => setDiagnosisForm((current) => ({ ...current, doctorId: event.target.value }))}>
                {data.doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{`${doctor.firstName} ${doctor.lastName}`}</option>)}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setDiagnosisModalOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitDiagnosis}>Save Diagnosis</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(reportModal)} onClose={() => setReportModal(null)} title={reportModal?.testName} description="Result preview" size="md">
        {reportModal ? (
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p><strong>Status:</strong> {reportModal.status}</p>
            <p><strong>Result:</strong> {reportModal.resultValue || "No result uploaded yet"}</p>
            <p><strong>File:</strong> {reportModal.fileName || "No file attached"}</p>
          </div>
        ) : null}
      </Modal>

      <Modal open={showPrescriptionHint} onClose={() => setShowPrescriptionHint(false)} title="Add Prescription" description="Use the diagnosis notes form to create a prescription draft.">
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p>1. Select the diagnosis and visit in the Diagnosis Notes card.</p>
          <p>2. Write the prescription or advice in the notes area.</p>
          <p>3. Click <strong>Add Prescription</strong> to create the draft.</p>
          <p>4. The new prescription will appear in the prescriptions section above and can be downloaded immediately.</p>
        </div>
      </Modal>
    </div>
  );
}

export default PatientProfilePage;
