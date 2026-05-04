import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import InputField from "../../components/common/InputField";
import PageHeader from "../../components/common/PageHeader";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { createEntityService } from "../../services/entityService";
import { ensureSupplementData, getPatientSupplement } from "../../services/hmsSupplementService";

const patientService = createEntityService("patients");

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

function PatientsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const role = user?.workspaceRole || user?.role;
  const basePath = role === "doctor" ? "/doctor/patients" : role === "patient" ? "/patient/patients" : "/staff/patients";
  const tableBasePath = role === "super_admin" ? "/admin/patients" : basePath;
  const canRegister = role === "super_admin" || role === "receptionist";
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [query, setQuery] = useState("");

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const response = await patientService.list({ limit: 200 }, { force: true });
      ensureSupplementData({ patients: response.items });
      setItems(response.items);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((patient) =>
      `${patient.firstName} ${patient.lastName} ${patient.email || ""} ${patient.phone || ""}`.toLowerCase().includes(normalized)
    );
  }, [items, query]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await patientService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender,
        bloodType: form.bloodType || undefined,
        dob: form.dob || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        status: form.status,
        allergies: form.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        emergencyContact: {
          name: form.emergencyName || undefined,
          phone: form.emergencyPhone || undefined,
          relationship: form.emergencyRelationship || undefined,
        },
        insurance: {
          provider: form.insuranceProvider || undefined,
          policyNumber: form.insurancePolicyNumber || undefined,
        },
      });
      toast.success("Patient registered");
      setForm(defaultForm);
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
        eyebrow: "मरीज रजिस्ट्री",
        title: "मरीज",
        description: "लाइव मरीज रिकॉर्ड, रजिस्ट्रेशन फील्ड्स और प्रोफाइल एक्सेस।",
        registrationTitle: "मरीज रजिस्ट्रेशन",
        registrationSubtitle: "जनसांख्यिकी, इमरजेंसी संपर्क, इंश्योरेंस, ब्लड ग्रुप और एलर्जी",
        directoryTitle: "मरीज डायरेक्टरी",
        directorySubtitle: "मरीज खोजें और प्रोफाइल खोलें",
        search: "मरीज खोजें",
        register: "मरीज रजिस्टर करें",
        creating: "मरीज बनाया जा रहा है...",
        openProfile: "प्रोफाइल खोलें",
        noPatients: "कोई मरीज नहीं मिला",
        noPatientsDescription: "कोई और खोज शब्द आज़माएँ या नया मरीज जोड़ें।",
        firstName: "पहला नाम",
        lastName: "अंतिम नाम",
        email: "ईमेल",
        phone: "फोन",
        gender: "लिंग",
        bloodGroup: "ब्लड ग्रुप",
        dob: "जन्म तिथि",
        status: "स्थिति",
        address: "पता",
        city: "शहर",
        state: "राज्य",
        zip: "पिन कोड",
        allergies: "एलर्जी",
        emergencyName: "इमरजेंसी संपर्क नाम",
        emergencyPhone: "इमरजेंसी संपर्क फोन",
        emergencyRelation: "रिश्ता",
        insuranceProvider: "इंश्योरेंस प्रदाता",
        policyNumber: "पॉलिसी नंबर",
        patientId: "मरीज आईडी",
        copy: "कॉपी",
        noEmail: "ईमेल नहीं",
        noPhone: "फोन नहीं",
        pending: "ब्लड ग्रुप लंबित",
      }
    : {
        eyebrow: "Patient Registry",
        title: "Patients",
        description: "Live patient records with enhanced registration fields and direct profile access.",
        registrationTitle: "Patient Registration",
        registrationSubtitle: "Demographics, emergency contact, insurance, blood group, and allergies",
        directoryTitle: "Patient Directory",
        directorySubtitle: "Search active records and open the enhanced profile",
        search: "Search patient",
        register: "Register Patient",
        creating: "Creating patient...",
        openProfile: "Open Profile",
        noPatients: "No patients found",
        noPatientsDescription: "Try another search term or create a new patient record.",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phone: "Phone",
        gender: "Gender",
        bloodGroup: "Blood Group",
        dob: "Date of Birth",
        status: "Status",
        address: "Address",
        city: "City",
        state: "State",
        zip: "ZIP Code",
        allergies: "Allergies",
        emergencyName: "Emergency Contact Name",
        emergencyPhone: "Emergency Contact Phone",
        emergencyRelation: "Emergency Contact Relationship",
        insuranceProvider: "Insurance Provider",
        policyNumber: "Policy Number",
        patientId: "Patient ID",
        copy: "Copy",
        noEmail: "No email",
        noPhone: "No phone",
        pending: "Blood group pending",
      };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <section className={sectionClassName}>
        {canRegister ? (
          <Card title={copy.registrationTitle} subtitle={copy.registrationSubtitle}>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label={copy.firstName} value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
                <InputField label={copy.lastName} value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
                <InputField label={copy.email} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                <InputField label={copy.phone} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">{copy.gender}</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}>
                    {["Male", "Female", "Other"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <InputField label={copy.bloodGroup} value={form.bloodType} onChange={(event) => setForm((current) => ({ ...current, bloodType: event.target.value }))} />
                <InputField
                  label={copy.dob}
                  type="date"
                  min="1920-01-01"
                  max={new Date().toISOString().split("T")[0]}
                  value={form.dob}
                  onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                />
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">{copy.status}</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                    {["Active", "Inactive"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <div className="md:col-span-2">
                  <InputField label={copy.address} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
                </div>
                <InputField label={copy.city} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                <InputField label={copy.state} value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} />
                <InputField label={copy.zip} value={form.zipCode} onChange={(event) => setForm((current) => ({ ...current, zipCode: event.target.value }))} />
                <InputField label={copy.allergies} value={form.allergies} onChange={(event) => setForm((current) => ({ ...current, allergies: event.target.value }))} placeholder="Penicillin, Peanuts" />
                <InputField label={copy.emergencyName} value={form.emergencyName} onChange={(event) => setForm((current) => ({ ...current, emergencyName: event.target.value }))} />
                <InputField label={copy.emergencyPhone} value={form.emergencyPhone} onChange={(event) => setForm((current) => ({ ...current, emergencyPhone: event.target.value }))} />
                <InputField label={copy.emergencyRelation} value={form.emergencyRelationship} onChange={(event) => setForm((current) => ({ ...current, emergencyRelationship: event.target.value }))} />
                <InputField label={copy.insuranceProvider} value={form.insuranceProvider} onChange={(event) => setForm((current) => ({ ...current, insuranceProvider: event.target.value }))} />
                <InputField label={copy.policyNumber} value={form.insurancePolicyNumber} onChange={(event) => setForm((current) => ({ ...current, insurancePolicyNumber: event.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? copy.creating : copy.register}
              </Button>
            </form>
          </Card>
        ) : null}

        <Card
          title={copy.directoryTitle}
          subtitle={copy.directorySubtitle}
          action={<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm outline-none" />}
        >
          {isLoading ? (
            <div className="min-h-[220px]" />
          ) : filtered.length ? (
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
                        <p className="mt-2 text-sm text-[var(--text-muted)]">{patient.email || copy.noEmail} • {patient.phone || copy.noPhone} • {patient.bloodType || copy.pending}</p>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                          {copy.patientId}:{" "}
                          <span className="font-mono tracking-wider text-[var(--text-dim)]">
                            {supplement.patientCode || patient._id}
                          </span>
                          <button
                            type="button"
                            className="ml-2 text-xs text-[var(--teal)]"
                            onClick={() => navigator.clipboard?.writeText(String(supplement.patientCode || patient._id))}
                          >
                            {copy.copy}
                          </button>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`${tableBasePath}/${patient._id}`}>
                          <Button type="button">{copy.openProfile}</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title={copy.noPatients} description={copy.noPatientsDescription} />
          )}
        </Card>
      </section>
    </div>
  );
}

export default PatientsPage;

