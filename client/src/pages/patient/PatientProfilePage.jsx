import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowDownTray,
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlinePrinter,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
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
  if (!dob) return null;
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

function PatientProfilePage() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.workspaceRole || user?.role;
  const isDoctor = role === "doctor";

  const [data, setData] = useState(null);
  const [updatingApptId, setUpdatingApptId] = useState(null);
  
  // Modals
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [createRxModalOpen, setCreateRxModalOpen] = useState(false);
  const [viewRxModal, setViewRxModal] = useState(null);
  const [reportModal, setReportModal] = useState(null);

  // Diagnosis Form State
  const [diagnosisForm, setDiagnosisForm] = useState({
    diseaseName: "",
    icd10: "",
    symptoms: "",
    clinicalNotes: "",
    treatmentRecommendation: "",
    followUpInstructions: "",
    dateDiagnosed: new Date().toISOString().slice(0, 10),
    severity: "Mild",
    currentStatus: "Active",
    appointmentId: "",
  });

  // Prescription Form State (Multi-Medicine)
  const [rxForm, setRxForm] = useState({
    appointmentId: "",
    diagnosisId: "",
    notes: "",
    followUpDate: "",
    medicines: [
      { name: "Paracetamol 500mg", dose: "1 tablet", frequency: "Twice daily", duration: "5 days", instructions: "After food" },
    ],
  });

  const loadProfile = useCallback(async () => {
    const [patient, appointmentsResponse, doctorsResponse, patientsResponse, billingResponse] = await Promise.all([
      patientService.getById(patientId),
      appointmentService.list({ limit: 300 }, { force: true }),
      doctorService.list({ limit: 100 }, { force: true }),
      patientService.list({ limit: 300 }, { force: true }),
      billingService.list({ limit: 300 }, { force: true }),
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

    setData({
      patient,
      doctors: doctorsResponse.items,
      appointments: patientAppointments,
      supplement,
    });

    if (patientAppointments.length) {
      setRxForm((prev) => ({
        ...prev,
        appointmentId: prev.appointmentId || patientAppointments[0]._id,
      }));
      setDiagnosisForm((prev) => ({
        ...prev,
        appointmentId: prev.appointmentId || patientAppointments[0]._id,
      }));
    }
  }, [patientId]);

  useEffect(() => {
    loadProfile();
    const refresh = () => loadProfile();
    window.addEventListener("hms:supplement-updated", refresh);
    return () => window.removeEventListener("hms:supplement-updated", refresh);
  }, [loadProfile]);

  const doctorLookup = useMemo(
    () => new Map((data?.doctors || []).map((doc) => [doc._id, doc])),
    [data?.doctors]
  );
  const diagnosisLookup = useMemo(
    () => new Map((data?.supplement?.diagnoses || []).map((diag) => [diag.id, diag])),
    [data?.supplement?.diagnoses]
  );
  const currentDoctorDoc = useMemo(
    () => (data?.doctors || []).find((d) => String(d.userId || d._id) === String(user?._id || user?.id)) || (data?.doctors || [])[0],
    [data?.doctors, user]
  );

  const age = useMemo(() => calculateAge(data?.patient?.dob), [data?.patient?.dob]);

  // Appointments split
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (data?.appointments || []).filter(
      (a) => new Date(a.appointmentDate) >= now && a.status !== "Completed" && a.status !== "Cancelled"
    );
  }, [data?.appointments]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (data?.appointments || []).filter(
      (a) => new Date(a.appointmentDate) < now || a.status === "Completed" || a.status === "Cancelled"
    );
  }, [data?.appointments]);

  // Handle inline status update for doctor's appointments
  const handleUpdateApptStatus = async (apptId, newStatus) => {
    setUpdatingApptId(apptId);
    try {
      await appointmentService.update(apptId, { status: newStatus });
      toast.success(`Appointment status updated to ${newStatus}`);
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update appointment status");
    } finally {
      setUpdatingApptId(null);
    }
  };

  // Diagnosis Handlers
  const handleAddDiagnosis = () => {
    if (!diagnosisForm.diseaseName.trim()) {
      toast.error("Disease name / diagnosis is required");
      return;
    }

    addDiagnosis(
      {
        ...diagnosisForm,
        patientId,
        doctorId: currentDoctorDoc?._id,
        dateDiagnosed: new Date(diagnosisForm.dateDiagnosed).toISOString(),
      },
      user
    );

    toast.success("Diagnosis record added");
    setDiagnosisModalOpen(false);
    setDiagnosisForm({
      diseaseName: "",
      icd10: "",
      symptoms: "",
      clinicalNotes: "",
      treatmentRecommendation: "",
      followUpInstructions: "",
      dateDiagnosed: new Date().toISOString().slice(0, 10),
      severity: "Mild",
      currentStatus: "Active",
      appointmentId: data?.appointments[0]?._id || "",
    });
  };

  // Prescription Handlers (Multi-Medicine)
  const handleAddMedicineRow = () => {
    setRxForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { name: "", dose: "1 tablet", frequency: "Twice daily", duration: "5 days", instructions: "After food" },
      ],
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    setRxForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setRxForm((prev) => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const handleSavePrescription = (andPrint = false) => {
    const validMedicines = rxForm.medicines.filter((m) => m.name.trim().length > 0);
    if (!validMedicines.length) {
      toast.error("Please add at least one medicine with a valid name.");
      return;
    }

    const payload = {
      patientId,
      appointmentId: rxForm.appointmentId,
      diagnosisId: rxForm.diagnosisId,
      doctorId: currentDoctorDoc?._id,
      status: "Active",
      notes: rxForm.notes,
      followUpDate: rxForm.followUpDate,
      medicines: validMedicines,
    };

    const updatedData = savePrescription(payload, user);
    toast.success("Prescription created successfully");
    setCreateRxModalOpen(false);

    if (andPrint) {
      const latestRx = updatedData.prescriptions[0];
      handlePrintPrescription(latestRx);
    }
  };

  const handlePrintPrescription = (prescription) => {
    const doctor = doctorLookup.get(prescription.doctorId) || currentDoctorDoc;
    const diagnosis = diagnosisLookup.get(prescription.diagnosisId);
    
    printPrescription({
      hospital: hospitalProfile,
      doctor: {
        name: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : (user?.name || "Doctor"),
        qualifications: doctor?.qualifications?.join(", ") || "MBBS, MD",
        registrationNumber: doctor?.licenseNumber || doctor?.registrationNumber || "REG-DOC-1024",
        specialization: doctor?.specialization || "General Medicine",
      },
      patient: {
        name: `${data.patient.firstName} ${data.patient.lastName}`,
        age: age || "-",
        gender: data.patient.gender || "-",
        patientCode: getPatientCode(data.patient),
      },
      prescription,
      diagnosis,
    });
  };

  // Timeline events generator
  const timelineEvents = useMemo(() => {
    if (!data) return [];

    const events = [];

    // Add Appointments
    (data.appointments || []).forEach((appt) => {
      events.push({
        date: appt.appointmentDate,
        title: `Appointment ${getAppointmentCode(appt)}`,
        type: "appointment",
        status: appt.status,
        detail: `${appt.appointmentTime} • ${appt.reasonForVisit || "Consultation"}`,
        raw: appt,
      });
    });

    // Add Diagnoses
    (data.supplement?.diagnoses || []).forEach((diag) => {
      events.push({
        date: diag.dateDiagnosed,
        title: `Diagnosis Added: ${diag.diseaseName}`,
        type: "diagnosis",
        status: diag.currentStatus || "Active",
        detail: `Severity: ${diag.severity} • ICD10: ${diag.icd10 || "-"}`,
        raw: diag,
      });
    });

    // Add Prescriptions
    (data.supplement?.prescriptions || []).forEach((rx) => {
      events.push({
        date: rx.date,
        title: `Prescription Issued (${rx.medicines?.length || 0} Medicines)`,
        type: "prescription",
        status: rx.status || "Active",
        detail: rx.medicines?.map((m) => m.name).join(", ") || "Medication prescribed",
        raw: rx,
      });
    });

    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data]);

  if (!data) {
    return <div className="min-h-[40vh]" />;
  }

  const patientCodeStr = getPatientCode(data.patient);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical Patient Workspace"
        title={`${data.patient.firstName} ${data.patient.lastName}`}
        description="Comprehensive patient profile, medical history, consultations, diagnosis, and digital prescriptions."
      />

      {/* 1. Patient Information Header Card */}
      <Card>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[var(--teal-dark)] to-[var(--teal-primary)] text-3xl font-bold text-white shadow-md">
            {`${data.patient.firstName?.[0] || ""}${data.patient.lastName?.[0] || ""}`}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Full Name & Demographics</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{`${data.patient.firstName} ${data.patient.lastName}`}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {age ? `${age} yrs` : "Age unavailable"} • {data.patient.gender || "Unstated"} • Blood Group: <span className="font-semibold text-[var(--teal-dark)]">{data.patient.bloodType || "N/A"}</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Contact Details</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{data.patient.phone || "No phone provided"}</p>
              <p className="text-xs text-[var(--text-muted)]">{data.patient.email || "No email"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Address</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {data.patient.address || [data.patient.city, data.patient.state, data.patient.zipCode].filter(Boolean).join(", ") || "No address on record"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Emergency Contact</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{data.patient.emergencyContact?.name || "-"}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {data.patient.emergencyContact?.relationship || "Contact"} • {data.patient.emergencyContact?.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Insurance Info</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{data.patient.insurance?.provider || "None"}</p>
              <p className="text-xs text-[var(--text-muted)]">Policy: {data.patient.insurance?.policyNumber || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-dark)]">Allergies</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(data.patient.allergies?.length ? data.patient.allergies : ["No known allergies"]).map((item) => (
                  <span key={item} className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-semibold text-rose-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 border-t pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <Badge variant={data.patient.status === "Active" ? "success" : "danger"}>{data.patient.status || "Active"}</Badge>
            <div className="rounded-[18px] bg-[var(--panel-muted)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">
              Patient ID: <span className="font-mono text-sm text-[var(--teal-dark)]">{patientCodeStr}</span>
            </div>
            {isDoctor ? (
              <Button type="button" className="w-full text-xs" onClick={() => setCreateRxModalOpen(true)}>
                <HiOutlinePlus className="mr-1.5 text-sm" />
                Create Prescription
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* 2. Appointments Section (Upcoming & Past) */}
      <Card title="Appointment History (With Currently Logged-in Doctor)" subtitle="Upcoming and past consultation appointments">
        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--teal-dark)]">Upcoming Appointments</h4>
            <div className="mt-3 space-y-3">
              {upcomingAppointments.length ? (
                upcomingAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="flex flex-col gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[var(--teal-dark)]">{getAppointmentCode(appt)}</span>
                        <p className="font-bold text-[var(--text-primary)]">{formatDate(appt.appointmentDate)} at {appt.appointmentTime}</p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Reason/Symptoms: <span className="font-medium text-[var(--text-primary)]">{appt.reasonForVisit || appt.symptoms || "Consultation"}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isDoctor ? (
                        <select
                          value={appt.status}
                          disabled={updatingApptId === appt._id}
                          onChange={(e) => handleUpdateApptStatus(appt._id, e.target.value)}
                          className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                        >
                          {APPOINTMENT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={appt.status === "Completed" ? "success" : "info"}>{appt.status}</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--text-muted)]">No upcoming appointments scheduled.</p>
              )}
            </div>
          </div>

          {/* Past Appointments */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--teal-dark)]">Past Appointments</h4>
            <div className="mt-3 space-y-3">
              {pastAppointments.length ? (
                pastAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="flex flex-col gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[var(--text-muted)]">{getAppointmentCode(appt)}</span>
                        <p className="font-semibold text-[var(--text-primary)]">{formatDate(appt.appointmentDate)} at {appt.appointmentTime}</p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Reason/Symptoms: <span className="font-medium text-[var(--text-primary)]">{appt.reasonForVisit || appt.symptoms || "Consultation"}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isDoctor ? (
                        <select
                          value={appt.status}
                          disabled={updatingApptId === appt._id}
                          onChange={(e) => handleUpdateApptStatus(appt._id, e.target.value)}
                          className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                        >
                          {APPOINTMENT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={appt.status === "Completed" ? "success" : appt.status === "Cancelled" ? "danger" : "info"}>
                          {appt.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--text-muted)]">No past appointment history.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Diagnosis & Medical History Section */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card
          title="Diagnoses & Clinical Conditions"
          subtitle="Diagnosed diseases, ICD codes, and status"
          action={
            isDoctor ? (
              <Button type="button" onClick={() => setDiagnosisModalOpen(true)}>
                <HiOutlinePlus className="mr-1.5 text-base" />
                Add Diagnosis
              </Button>
            ) : null
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-xs uppercase text-[var(--teal-dark)]">
                  <th className="pb-3 pt-2 font-semibold">Disease Name</th>
                  <th className="pb-3 pt-2 font-semibold">ICD-10</th>
                  <th className="pb-3 pt-2 font-semibold">Diagnosed Date</th>
                  <th className="pb-3 pt-2 font-semibold">Severity</th>
                  <th className="pb-3 pt-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {(data.supplement?.diagnoses || []).length ? (
                  data.supplement.diagnoses.map((diag) => (
                    <tr key={diag.id}>
                      <td className="py-3 font-semibold text-[var(--text-primary)]">{diag.diseaseName}</td>
                      <td className="py-3 font-mono text-xs">{diag.icd10 || "-"}</td>
                      <td className="py-3 text-xs text-[var(--text-muted)]">{formatDate(diag.dateDiagnosed)}</td>
                      <td className="py-3">
                        <Badge variant={diag.severity === "Severe" ? "danger" : diag.severity === "Moderate" ? "warning" : "success"}>
                          {diag.severity}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={diag.currentStatus === "Active" ? "info" : "success"}>{diag.currentStatus}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-xs text-[var(--text-muted)]">
                      No diagnosis records added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Patient Interactive Timeline */}
        <Card title="Patient History Timeline" subtitle="Chronological clinical events">
          <div className="relative space-y-4 border-l-2 border-[var(--teal-primary)] pl-4">
            {timelineEvents.length ? (
              timelineEvents.slice(0, 10).map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-[var(--teal-primary)] ring-4 ring-[var(--panel-bg)]" />
                  <p className="text-xs font-bold text-[var(--teal-dark)]">{formatDate(event.date)}</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{event.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{event.detail}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No timeline events recorded yet.</p>
            )}
          </div>
        </Card>
      </section>

      {/* 4. Prescription History Section */}
      <Card
        title="Prescription History"
        subtitle="Digital prescriptions issued for this patient"
        action={
          isDoctor ? (
            <Button type="button" onClick={() => setCreateRxModalOpen(true)}>
              <HiOutlinePlus className="mr-1.5 text-base" />
              Create Prescription
            </Button>
          ) : null
        }
      >
        <div className="space-y-4">
          {(data.supplement?.prescriptions || []).length ? (
            (data.supplement.prescriptions || []).map((rx) => {
              const doctor = doctorLookup.get(rx.doctorId) || currentDoctorDoc;
              const diag = diagnosisLookup.get(rx.diagnosisId);
              const medCount = rx.medicines?.length || 0;

              return (
                <div
                  key={rx.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-5 transition-all hover:border-[var(--teal-primary)] lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[var(--teal-dark)]">Rx ID: {rx.id}</span>
                      <p className="text-sm font-bold text-[var(--text-primary)]">Issued: {formatDate(rx.date)}</p>
                      <Badge variant={rx.status === "Active" ? "success" : "info"}>{rx.status || "Active"}</Badge>
                    </div>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Doctor: <span className="font-semibold text-[var(--text-primary)]">{doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Doctor"}</span> • Diagnosis: <span className="font-semibold text-[var(--text-primary)]">{diag?.diseaseName || "General Advice"}</span>
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {rx.medicines?.map((med, mIdx) => (
                        <span key={mIdx} className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                          {med.name} ({med.dose}) • {med.frequency}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 lg:border-l lg:border-[var(--border-color)] lg:pl-6 lg:pt-0">
                    <Button type="button" variant="secondary" className="text-xs" onClick={() => setViewRxModal(rx)}>
                      <HiOutlineEye className="mr-1.5 h-3.5 w-3.5" />
                      View Details
                    </Button>
                    <Button type="button" className="text-xs" onClick={() => handlePrintPrescription(rx)}>
                      <HiOutlinePrinter className="mr-1.5 h-3.5 w-3.5" />
                      Print / Download
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title="No prescriptions created" description="Click Create Prescription to prescribe medicines for this patient." />
          )}
        </div>
      </Card>

      {/* MODAL 1: Add Diagnosis Modal */}
      <Modal open={diagnosisModalOpen} onClose={() => setDiagnosisModalOpen(false)} title="Add Clinical Diagnosis" size="lg">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Disease / Diagnosis Name *"
              placeholder="e.g. Type 2 Diabetes Mellitus"
              value={diagnosisForm.diseaseName}
              onChange={(e) => setDiagnosisForm((p) => ({ ...p, diseaseName: e.target.value }))}
            />
            <InputField
              label="ICD-10 Code"
              placeholder="e.g. E11.9"
              value={diagnosisForm.icd10}
              onChange={(e) => setDiagnosisForm((p) => ({ ...p, icd10: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InputField
              label="Diagnosed Date"
              type="date"
              value={diagnosisForm.dateDiagnosed}
              onChange={(e) => setDiagnosisForm((p) => ({ ...p, dateDiagnosed: e.target.value }))}
            />
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--teal-dark)]">Severity</label>
              <select
                value={diagnosisForm.severity}
                onChange={(e) => setDiagnosisForm((p) => ({ ...p, severity: e.target.value }))}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-sm"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--teal-dark)]">Status</label>
              <select
                value={diagnosisForm.currentStatus}
                onChange={(e) => setDiagnosisForm((p) => ({ ...p, currentStatus: e.target.value }))}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
                <option value="Chronic">Chronic</option>
              </select>
            </div>
          </div>

          <InputField
            label="Symptoms / Observations"
            placeholder="Key symptoms observed during consultation..."
            value={diagnosisForm.symptoms}
            onChange={(e) => setDiagnosisForm((p) => ({ ...p, symptoms: e.target.value }))}
          />
          <InputField
            label="Treatment Recommendation & Clinical Notes"
            placeholder="Diagnostic recommendations, dietary guidelines, advice..."
            value={diagnosisForm.treatmentRecommendation}
            onChange={(e) => setDiagnosisForm((p) => ({ ...p, treatmentRecommendation: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDiagnosisModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddDiagnosis}>
              Save Diagnosis
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Create Prescription Modal (Multi-Medicine) */}
      <Modal open={createRxModalOpen} onClose={() => setCreateRxModalOpen(false)} title="Create Digital Prescription" size="xl">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--teal-dark)]">Link Appointment</label>
              <select
                value={rxForm.appointmentId}
                onChange={(e) => setRxForm((p) => ({ ...p, appointmentId: e.target.value }))}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-sm"
              >
                {(data.appointments || []).map((a) => (
                  <option key={a._id} value={a._id}>
                    {getAppointmentCode(a)} • {formatDate(a.appointmentDate)} ({a.appointmentTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--teal-dark)]">Link Diagnosis</label>
              <select
                value={rxForm.diagnosisId}
                onChange={(e) => setRxForm((p) => ({ ...p, diagnosisId: e.target.value }))}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-sm"
              >
                <option value="">General Advice / No Specific Diagnosis</option>
                {(data.supplement?.diagnoses || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.diseaseName} ({d.severity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medicines Multi-Item Table */}
          <div>
            <div className="flex items-center justify-between pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--teal-dark)]">Medicines Prescribed</h4>
              <Button type="button" variant="secondary" className="text-xs" onClick={handleAddMedicineRow}>
                <HiOutlinePlus className="mr-1 h-3.5 w-3.5" />
                Add Medicine
              </Button>
            </div>

            <div className="space-y-3">
              {rxForm.medicines.map((med, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-3 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Medicine Name & Strength *</label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol 500mg"
                      value={med.name}
                      onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1.5 text-xs font-medium outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 tablet"
                      value={med.dose}
                      onChange={(e) => handleMedicineChange(index, "dose", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1.5 text-xs outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. Twice daily"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1.5 text-xs outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 days"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1.5 text-xs outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-1">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Instructions</label>
                      <input
                        type="text"
                        placeholder="After food"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(index, "instructions", e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-1.5 text-xs outline-none"
                      />
                    </div>

                    {rxForm.medicines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(index)}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Doctor Advice / Instructions"
              placeholder="e.g. Rest, drink plenty of water, avoid spicy food..."
              value={rxForm.notes}
              onChange={(e) => setRxForm((p) => ({ ...p, notes: e.target.value }))}
            />
            <InputField
              label="Follow-up Date"
              type="date"
              value={rxForm.followUpDate}
              onChange={(e) => setRxForm((p) => ({ ...p, followUpDate: e.target.value }))}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setCreateRxModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleSavePrescription(false)}>
              Save Prescription
            </Button>
            <Button type="button" onClick={() => handleSavePrescription(true)}>
              <HiOutlinePrinter className="mr-1.5 text-base" />
              Save & Print Prescription
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: View Prescription Details Modal */}
      <Modal open={Boolean(viewRxModal)} onClose={() => setViewRxModal(null)} title="Prescription Details" size="lg">
        {viewRxModal ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Prescription ID: <span className="font-mono font-bold text-[var(--teal-dark)]">{viewRxModal.id}</span></p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Date: {formatDate(viewRxModal.date)}</p>
              </div>
              <Badge variant="success">{viewRxModal.status || "Active"}</Badge>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[var(--teal-dark)]">Prescribed Medicines</p>
              <div className="mt-2 space-y-2">
                {viewRxModal.medicines?.map((med, idx) => (
                  <div key={idx} className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-3 text-xs">
                    <p className="font-bold text-[var(--text-primary)]">{med.name}</p>
                    <p className="text-[var(--text-muted)]">Dose: {med.dose} • Frequency: {med.frequency} • Duration: {med.duration}</p>
                    {med.instructions ? <p className="text-[var(--teal-dark)]">Instructions: {med.instructions}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            {viewRxModal.notes ? (
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--teal-dark)]">Doctor Advice / Notes</p>
                <p className="mt-1 text-xs text-[var(--text-primary)]">{viewRxModal.notes}</p>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="secondary" onClick={() => setViewRxModal(null)}>
                Close
              </Button>
              <Button type="button" onClick={() => handlePrintPrescription(viewRxModal)}>
                <HiOutlinePrinter className="mr-1.5 h-4 w-4" />
                Print / Download
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default PatientProfilePage;
