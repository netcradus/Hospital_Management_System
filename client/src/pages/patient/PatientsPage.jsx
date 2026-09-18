import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HiOutlineEye, HiOutlineMagnifyingGlass, HiOutlineFunnel } from "react-icons/hi2";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import InputField from "../../components/common/InputField";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/common/SelectField";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { createEntityService } from "../../services/entityService";
import { ensureSupplementData, getPatientSupplement } from "../../services/hmsSupplementService";
import { canAccess } from "../../config/rbac";

const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const defaultForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "Male",
  bloodType: "",
  dob: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  status: "Active",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  allergies: "",
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

function PatientsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const role = user?.workspaceRole || user?.role;
  const isDoctor = role === "doctor";
  const basePath = isDoctor ? "/doctor/patients" : role === "patient" ? "/patient/patients" : "/staff/patients";
  const tableBasePath = role === "super_admin" || role === "admin" ? "/admin/patients" : basePath;
  const canRegister = canAccess(role, "patients", "create");
  
  const [items, setItems] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultForm,
    mode: "onTouched",
  });

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      if (isDoctor) {
        const [pResponse, aResponse] = await Promise.all([
          patientService.list({ limit: 300 }, { force: true }),
          appointmentService.list({ limit: 300 }, { force: true }),
        ]);
        ensureSupplementData({ patients: pResponse.items, appointments: aResponse.items });
        setItems(pResponse.items);
        setDoctorAppointments(aResponse.items);
      } else {
        const response = await patientService.list({ limit: 300 }, { force: true });
        ensureSupplementData({ patients: response.items });
        setItems(response.items);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [role]);

  // Build doctor patient map with appointment analytics
  const patientDataList = useMemo(() => {
    if (!isDoctor) return items;

    const now = new Date();
    return items.map((patient) => {
      const pIdStr = String(patient._id);
      const pAppointments = doctorAppointments.filter((a) => {
        const apptPatientId = String(a.patientId?._id || a.patientId);
        return apptPatientId === pIdStr;
      }).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

      const pastAppts = pAppointments.filter((a) => new Date(a.appointmentDate) <= now);
      const upcomingAppts = pAppointments.filter((a) => new Date(a.appointmentDate) > now && a.status !== "Cancelled");

      const lastAppointment = pastAppts[0]?.appointmentDate || pAppointments[0]?.appointmentDate || null;
      const nextAppointment = upcomingAppts[upcomingAppts.length - 1]?.appointmentDate || null;
      const appointmentCount = pAppointments.length;
      const latestApptStatus = pAppointments[0]?.status || patient.status || "Active";

      const appointmentCodes = pAppointments.map(getAppointmentCode).concat(pAppointments.map((a) => a._id));

      return {
        ...patient,
        appointments: pAppointments,
        lastAppointment,
        nextAppointment,
        appointmentCount,
        latestApptStatus,
        appointmentCodes,
      };
    });
  }, [items, doctorAppointments, isDoctor]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    
    return patientDataList.filter((patient) => {
      const pCode = getPatientCode(patient).toLowerCase();
      const pName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const apptMatch = patient.appointmentCodes ? patient.appointmentCodes.some((code) => String(code).toLowerCase().includes(normalized)) : false;

      const matchesSearch = !normalized || pName.includes(normalized) || pCode.includes(normalized) || (patient.phone && patient.phone.includes(normalized)) || apptMatch;

      if (!matchesSearch) return false;

      if (!isDoctor || statusFilter === "All") return true;

      if (statusFilter === "Upcoming") {
        return patient.nextAppointment !== null || patient.appointments?.some((a) => a.status === "Scheduled" || a.status === "Confirmed");
      }
      if (statusFilter === "Completed") {
        return patient.appointments?.some((a) => a.status === "Completed");
      }
      if (statusFilter === "Pending") {
        return patient.appointments?.some((a) => a.status === "Scheduled" || a.status === "Confirmed" || a.status === "In Consultation");
      }
      if (statusFilter === "Cancelled") {
        return patient.appointments?.some((a) => a.status === "Cancelled");
      }

      return true;
    });
  }, [patientDataList, query, statusFilter, isDoctor]);

  const handleCreate = async (values) => {
    setIsSubmitting(true);
    try {
      const trimmedFirstName = values.firstName.trim();
      const trimmedLastName = values.lastName ? values.lastName.trim() : "";
      const trimmedEmail = values.email.trim();
      const trimmedPhone = values.phone.trim();
      const trimmedAddress = values.address.trim();
      const trimmedCity = values.city.trim();
      const trimmedState = values.state.trim();
      const trimmedZipCode = values.zipCode.trim();
      const trimmedBloodType = values.bloodType ? values.bloodType.trim().toUpperCase() : undefined;
      const trimmedEmergencyName = values.emergencyName.trim();
      const trimmedEmergencyPhone = values.emergencyPhone.trim();
      const trimmedEmergencyRelationship = values.emergencyRelationship?.trim();
      const trimmedInsuranceProvider = values.insuranceProvider?.trim();
      const trimmedInsurancePolicyNumber = values.insurancePolicyNumber?.trim();
      const parsedAllergies = values.allergies
        ? values.allergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      await patientService.create({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        phone: trimmedPhone,
        gender: values.gender,
        bloodType: trimmedBloodType || undefined,
        dob: values.dob,
        address: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        zipCode: trimmedZipCode,
        status: values.status,
        allergies: parsedAllergies,
        emergencyContact: {
          name: trimmedEmergencyName,
          phone: trimmedEmergencyPhone,
          relationship: trimmedEmergencyRelationship || undefined,
        },
        insurance: {
          provider: trimmedInsuranceProvider || undefined,
          policyNumber: trimmedInsurancePolicyNumber || undefined,
        },
      });
      toast.success("Patient registered");
      reset(defaultForm);
      await loadPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to register patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionClassName = canRegister ? "grid gap-6 xl:grid-cols-[0.92fr_1.08fr]" : "grid gap-6";

  const copy = language === "hi"
    ? {
        eyebrow: isDoctor ? "डॉक्टर वर्कस्पेस" : "मरीज रजिस्ट्री",
        title: isDoctor ? "मेरे मरीज (My Patients)" : "मरीज",
        description: isDoctor ? "केवल आपके साथ अपॉइंटमेंट वाले मरीज प्रदर्शित हैं।" : "लाइव मरीज रिकॉर्ड, रजिस्ट्रेशन फील्ड्स और प्रोफाइल एक्सेस।",
        directoryTitle: isDoctor ? "डॉक्टर मरीज सूची" : "मरीज डायरेक्टरी",
        directorySubtitle: isDoctor ? "मरीज नाम, आईडी या अपॉइंटमेंट से खोजें" : "मरीज खोजें और प्रोफाइल खोलें",
        search: "मरीज या अपॉइंटमेंट आईडी खोजें...",
        noPatients: "कोई मरीज नहीं मिला",
        noPatientsDescription: "आपके चयन से मेल खाता कोई मरीज नहीं है।",
      }
    : {
        eyebrow: isDoctor ? "Doctor Clinical Portal" : "Patient Registry",
        title: isDoctor ? "My Patients" : "Patients",
        description: isDoctor ? "Showing only patients with appointment records for the logged-in doctor." : "Live patient records with registration fields and profile access.",
        directoryTitle: isDoctor ? "Assigned Patients Directory" : "Patient Directory",
        directorySubtitle: isDoctor ? "Search by Patient Name, Patient ID, or Appointment ID" : "Search active records and open profile",
        search: "Search Patient Name, ID, or Appointment ID...",
        noPatients: "No assigned patients found",
        noPatientsDescription: "No patient records match the applied search and filter criteria.",
      };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

      <section className={sectionClassName}>
        {canRegister ? (
          <Card title="Patient Registration" subtitle="Demographics and contact details">
            <form className="space-y-4" onSubmit={handleSubmit(handleCreate)} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="First Name"
                  error={errors.firstName?.message}
                  maxLength={50}
                  {...register("firstName", {
                    required: "First Name is required",
                    maxLength: { value: 50, message: "First Name cannot exceed 50 characters" },
                  })}
                />
                <InputField
                  label="Last Name"
                  error={errors.lastName?.message}
                  maxLength={50}
                  {...register("lastName")}
                />
                <InputField
                  label="Email"
                  type="email"
                  error={errors.email?.message}
                  {...register("email", { required: "Email is required" })}
                />
                <InputField
                  label="Phone"
                  error={errors.phone?.message}
                  maxLength={10}
                  {...register("phone", { required: "Phone number is required" })}
                />
                <SelectField
                  label="Gender"
                  options={["Male", "Female", "Other"]}
                  {...register("gender")}
                />
                <InputField
                  label="Blood Group"
                  maxLength={3}
                  {...register("bloodType")}
                />
                <InputField
                  label="Date of Birth"
                  type="date"
                  {...register("dob", { required: "DOB is required" })}
                />
                <SelectField
                  label="Status"
                  options={["Active", "Inactive"]}
                  {...register("status")}
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Address"
                    {...register("address", { required: "Address is required" })}
                  />
                </div>
                <InputField label="City" {...register("city", { required: "City is required" })} />
                <InputField label="State" {...register("state", { required: "State is required" })} />
                <InputField label="ZIP Code" maxLength={6} {...register("zipCode", { required: "ZIP is required" })} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Patient"}
              </Button>
            </form>
          </Card>
        ) : null}

        <Card
          title={copy.directoryTitle}
          subtitle={copy.directorySubtitle}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.search}
                className="min-h-[44px] min-w-[280px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm outline-none focus:border-[var(--teal-primary)]"
              />

              {isDoctor ? (
                <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-1">
                  {["All", "Upcoming", "Completed", "Pending", "Cancelled"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStatusFilter(f)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                        statusFilter === f
                          ? "bg-[var(--teal-primary)] text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          }
        >
          {isLoading ? (
            <div className="min-h-[220px]" />
          ) : filtered.length ? (
            isDoctor ? (
              /* Doctor-Specific My Patients Table / Card Grid */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wider text-[var(--teal-dark)]">
                      <th className="pb-3 pt-2 font-semibold">Patient ID</th>
                      <th className="pb-3 pt-2 font-semibold">Patient Name</th>
                      <th className="pb-3 pt-2 font-semibold">Age / Gender</th>
                      <th className="pb-3 pt-2 font-semibold">Phone</th>
                      <th className="pb-3 pt-2 font-semibold">Last Appt</th>
                      <th className="pb-3 pt-2 font-semibold">Next Appt</th>
                      <th className="pb-3 pt-2 font-semibold">Appts</th>
                      <th className="pb-3 pt-2 font-semibold">Status</th>
                      <th className="pb-3 pt-2 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {filtered.map((patient) => {
                      const pCode = getPatientCode(patient);
                      const pName = `${patient.firstName} ${patient.lastName}`;
                      const age = calculateAge(patient.dob);
                      const ageGenderStr = `${age ? `${age} yrs` : "-"} / ${patient.gender || "-"}`;
                      const phoneStr = patient.phone || "-";
                      const lastApptStr = formatDate(patient.lastAppointment);
                      const nextApptStr = formatDate(patient.nextAppointment);
                      const apptCount = patient.appointmentCount || 0;
                      const statusVal = patient.latestApptStatus || "Active";

                      return (
                        <tr key={patient._id} className="hover:bg-[var(--panel-muted)]">
                          <td className="py-4 font-mono text-xs font-bold text-[var(--teal-dark)]">{pCode}</td>
                          <td className="py-4 font-semibold text-[var(--text-primary)]">{pName}</td>
                          <td className="py-4 text-xs text-[var(--text-muted)]">{ageGenderStr}</td>
                          <td className="py-4 text-xs text-[var(--text-muted)]">{phoneStr}</td>
                          <td className="py-4 text-xs text-[var(--text-muted)]">{lastApptStr}</td>
                          <td className="py-4 text-xs font-medium text-[var(--teal-dark)]">{nextApptStr}</td>
                          <td className="py-4 text-xs font-bold text-[var(--text-primary)]">{apptCount}</td>
                          <td className="py-4">
                            <Badge
                              variant={
                                statusVal === "Completed"
                                  ? "success"
                                  : statusVal === "Cancelled"
                                  ? "danger"
                                  : "info"
                              }
                              className="text-[10px]"
                            >
                              {statusVal}
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <Button
                              type="button"
                              variant="secondary"
                              className="text-xs"
                              onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                            >
                              <HiOutlineEye className="mr-1 h-3.5 w-3.5" />
                              View Patient
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Admin / Staff Standard Patient List */
              <div className="space-y-4">
                {filtered.map((patient) => {
                  const supplement = getPatientSupplement(patient._id);
                  return (
                    <div key={patient._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-lg font-semibold">{patient.firstName} {patient.lastName}</p>
                            <Badge variant={patient.status === "Active" ? "success" : "danger"}>{patient.status}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-[var(--text-muted)]">{patient.email || "No email"} • {patient.phone || "No phone"} • {patient.bloodType || "Blood group pending"}</p>
                          <p className="mt-2 text-sm text-[var(--text-muted)]">
                            Patient ID:{" "}
                            <span className="font-mono tracking-wider text-[var(--text-dim)]">
                              {patient.patientId || supplement.patientCode || patient._id}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link to={`${tableBasePath}/${patient._id}`}>
                            <Button type="button">Open Profile</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <EmptyState title={copy.noPatients} description={copy.noPatientsDescription} />
          )}
        </Card>
      </section>
    </div>
  );
}

export default PatientsPage;
