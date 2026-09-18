import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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

function PatientsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const role = user?.workspaceRole || user?.role;
  const basePath = role === "doctor" ? "/doctor/patients" : role === "patient" ? "/patient/patients" : "/staff/patients";
  const tableBasePath = role === "super_admin" || role === "admin" ? "/admin/patients" : basePath;
  const canRegister = canAccess(role, "patients", "create");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");

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
      `${patient.firstName} ${patient.lastName} ${patient.patientId || ""} ${patient.email || ""} ${patient.phone || ""}`.toLowerCase().includes(normalized)
    );
  }, [items, query]);

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
            <form className="space-y-4" onSubmit={handleSubmit(handleCreate)} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label={copy.firstName}
                  error={errors.firstName?.message}
                  maxLength={50}
                  {...register("firstName", {
                    required: "First Name is required",
                    maxLength: { value: 50, message: "First Name cannot exceed 50 characters" },
                    validate: {
                      noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "First Name must be at least 2 characters",
                      onlyAlphaSpace: (val) => /^[A-Za-z\s]+$/.test(val?.trim() || "") || "First Name can only contain letters and spaces",
                    },
                  })}
                />
                <InputField
                  label={copy.lastName}
                  error={errors.lastName?.message}
                  maxLength={50}
                  {...register("lastName", {
                    maxLength: { value: 50, message: "Last Name cannot exceed 50 characters" },
                    validate: {
                      minLengthIfProvided: (val) =>
                        !val || !val.trim() || val.trim().length >= 2 || "Last Name must be at least 2 characters",
                      onlyAlphaSpace: (val) =>
                        !val || !val.trim() || /^[A-Za-z\s]+$/.test(val.trim()) || "Last Name can only contain letters and spaces",
                    },
                  })}
                />
                <InputField
                  label={copy.email}
                  type="email"
                  error={errors.email?.message}
                  maxLength={100}
                  {...register("email", {
                    required: "Email is required",
                    maxLength: { value: 100, message: "Email cannot exceed 100 characters" },
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Please enter a valid email address",
                    },
                    validate: {
                      notEmpty: (val) => (val && val.trim().length > 0) || "Email is required",
                    },
                  })}
                />
                <InputField
                  label={copy.phone}
                  error={errors.phone?.message}
                  maxLength={10}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  }}
                  {...register("phone", {
                    required: "Phone number is required",
                    maxLength: { value: 10, message: "Phone number must be exactly 10 digits" },
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: "Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9",
                    },
                  })}
                />
                <SelectField
                  label={copy.gender}
                  options={["Male", "Female", "Other"]}
                  error={errors.gender?.message}
                  {...register("gender", {
                    required: "Gender is required",
                    validate: (val) => ["Male", "Female", "Other"].includes(val) || "Please select a valid gender",
                  })}
                />
                <InputField
                  label={copy.bloodGroup}
                  error={errors.bloodType?.message}
                  maxLength={3}
                  placeholder="e.g. O+, A+, B-"
                  {...register("bloodType", {
                    maxLength: { value: 3, message: "Blood Group cannot exceed 3 characters" },
                    validate: (val) => {
                      if (!val || !val.trim()) return true;
                      return (
                        VALID_BLOOD_GROUPS.includes(val.trim().toUpperCase()) ||
                        "Invalid blood group (Allowed: A+, A-, B+, B-, AB+, AB-, O+, O-)"
                      );
                    },
                  })}
                />
                <InputField
                  label={copy.dob}
                  type="date"
                  min="1900-01-01"
                  max={todayStr}
                  error={errors.dob?.message}
                  {...register("dob", {
                    required: "Date of Birth is required",
                    validate: {
                      validDate: (val) => !isNaN(Date.parse(val)) || "Please enter a valid date",
                      noFuture: (val) => new Date(val) <= new Date() || "Date of Birth cannot be in the future",
                    },
                  })}
                />
                <SelectField
                  label={copy.status}
                  options={["Active", "Inactive"]}
                  error={errors.status?.message}
                  {...register("status", {
                    required: "Status is required",
                    validate: (val) => ["Active", "Inactive"].includes(val) || "Please select a valid status",
                  })}
                />
                <div className="md:col-span-2">
                  <InputField
                    label={copy.address}
                    error={errors.address?.message}
                    maxLength={200}
                    {...register("address", {
                      required: "Address is required",
                      maxLength: { value: 200, message: "Address cannot exceed 200 characters" },
                      validate: {
                        noWhitespaceOnly: (val) => (val && val.trim().length >= 5) || "Address must be at least 5 characters long",
                      },
                    })}
                  />
                </div>
                <InputField
                  label={copy.city}
                  error={errors.city?.message}
                  maxLength={50}
                  {...register("city", {
                    required: "City is required",
                    maxLength: { value: 50, message: "City cannot exceed 50 characters" },
                    validate: {
                      noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "City must be at least 2 characters",
                      onlyAlphaSpace: (val) => /^[A-Za-z\s]+$/.test(val?.trim() || "") || "City can only contain letters and spaces",
                    },
                  })}
                />
                <InputField
                  label={copy.state}
                  error={errors.state?.message}
                  maxLength={50}
                  {...register("state", {
                    required: "State is required",
                    maxLength: { value: 50, message: "State cannot exceed 50 characters" },
                    validate: {
                      noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "State must be at least 2 characters",
                      onlyAlphaSpace: (val) => /^[A-Za-z\s]+$/.test(val?.trim() || "") || "State can only contain letters and spaces",
                    },
                  })}
                />
                <InputField
                  label={copy.zip}
                  error={errors.zipCode?.message}
                  maxLength={6}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  }}
                  {...register("zipCode", {
                    required: "ZIP Code is required",
                    maxLength: { value: 6, message: "ZIP Code must be exactly 6 digits" },
                    pattern: {
                      value: /^\d{6}$/,
                      message: "ZIP Code must be exactly 6 digits",
                    },
                  })}
                />
                <InputField
                  label={copy.allergies}
                  error={errors.allergies?.message}
                  maxLength={200}
                  placeholder="Penicillin, Peanuts"
                  {...register("allergies", {
                    maxLength: { value: 200, message: "Allergies cannot exceed 200 characters" },
                    validate: (val) => !val || val.length <= 200 || "Allergies cannot exceed 200 characters",
                  })}
                />
                <InputField
                  label={copy.emergencyName}
                  error={errors.emergencyName?.message}
                  maxLength={100}
                  {...register("emergencyName", {
                    required: "Emergency Contact Name is required",
                    maxLength: { value: 100, message: "Emergency Contact Name cannot exceed 100 characters" },
                    validate: {
                      noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "Emergency Contact Name must be at least 2 characters",
                      onlyAlphaSpace: (val) => /^[A-Za-z\s]+$/.test(val?.trim() || "") || "Emergency Contact Name can only contain letters and spaces",
                    },
                  })}
                />
                <InputField
                  label={copy.emergencyPhone}
                  error={errors.emergencyPhone?.message}
                  maxLength={10}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  }}
                  {...register("emergencyPhone", {
                    required: "Emergency Contact Phone is required",
                    maxLength: { value: 10, message: "Emergency Contact Phone must be exactly 10 digits" },
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: "Emergency Contact Phone must be a valid 10-digit number starting with 6, 7, 8, or 9",
                    },
                  })}
                />
                <InputField
                  label={copy.emergencyRelation}
                  error={errors.emergencyRelationship?.message}
                  maxLength={50}
                  {...register("emergencyRelationship", {
                    maxLength: { value: 50, message: "Relationship cannot exceed 50 characters" },
                  })}
                />
                <InputField
                  label={copy.insuranceProvider}
                  error={errors.insuranceProvider?.message}
                  maxLength={100}
                  {...register("insuranceProvider", {
                    maxLength: { value: 100, message: "Insurance Provider cannot exceed 100 characters" },
                  })}
                />
                <InputField
                  label={copy.policyNumber}
                  error={errors.insurancePolicyNumber?.message}
                  maxLength={50}
                  {...register("insurancePolicyNumber", {
                    maxLength: { value: 50, message: "Policy Number cannot exceed 50 characters" },
                  })}
                />
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
                            {patient.patientId || supplement.patientCode || patient._id}
                          </span>
                          <button
                            type="button"
                            className="ml-2 text-xs text-[var(--teal)]"
                            onClick={() => navigator.clipboard?.writeText(String(patient.patientId || supplement.patientCode || patient._id))}
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

