import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { createEntityService } from "../../services/entityService";
import { ensureSupplementData, getDoctorProfileMeta } from "../../services/hmsSupplementService";

const doctorService = createEntityService("doctors");
const patientService = createEntityService("patients");
const departmentService = createEntityService("departments");

function DoctorsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const role = user?.workspaceRole || user?.role;
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const copy = useMemo(
    () =>
      language === "hi"
        ? {
            eyebrow: "डॉक्टर प्रोफाइल",
            title: "डॉक्टर्स",
            description: "विशेषज्ञता, अनुभव, फीस, उपलब्ध समय और असाइन मरीज देखें।",
            retry: "फिर से कोशिश करें",
            errorTitle: "डॉक्टर डेटा लोड नहीं हो सका",
            emptyTitle: "कोई डॉक्टर नहीं मिला",
            emptyDescription: "डॉक्टर रिकॉर्ड उपलब्ध होने पर यहां दिखेंगे।",
            displayOnly: "केवल दृश्य",
            departmentPending: "विभाग लंबित",
            qualificationsPending: "योग्यता लंबित",
            experience: "अनुभव",
            years: "वर्ष",
            fee: "कंसल्टेशन फीस",
            available: "उपलब्ध दिन / समय",
            rating: "रेटिंग / रिव्यू",
            assignedPatients: "असाइन मरीज",
            monFri: "सोम-शुक्र",
            reviews: "रिव्यू",
            general: "सामान्य",
          }
        : {
            eyebrow: "Doctor Profiles",
            title: "Doctors",
            description: "Specialization, experience, fees, availability, and assigned patients.",
            retry: "Retry",
            errorTitle: "Unable to load doctors",
            emptyTitle: "No doctors found",
            emptyDescription: "Doctor records will appear here once available.",
            displayOnly: "Display only",
            departmentPending: "Department pending",
            qualificationsPending: "Qualifications pending",
            experience: "Experience",
            years: "years",
            fee: "Consultation Fee",
            available: "Available Days / Hours",
            rating: "Rating / Reviews",
            assignedPatients: "Assigned Patients",
            monFri: "Mon-Fri",
            reviews: "reviews",
            general: "General",
          },
    [language]
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [doctorResponse, patientResponse, departmentResponse] = await Promise.all([
          doctorService.list({ limit: 100 }, { force: true }),
          patientService.list({ limit: 200 }, { force: true }),
          departmentService.list({ limit: 100 }, { force: true }),
        ]);

        ensureSupplementData({
          doctors: doctorResponse.items,
          patients: patientResponse.items,
        });

        setDoctors(Array.isArray(doctorResponse.items) ? doctorResponse.items : []);
        setPatients(Array.isArray(patientResponse.items) ? patientResponse.items : []);
        setDepartments(Array.isArray(departmentResponse.items) ? departmentResponse.items : []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError?.message || "Unable to load doctors");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const visibleDoctors = useMemo(() => {
    const list = Array.isArray(doctors) ? doctors : [];
    if (role === "doctor") {
      const filtered = list.filter((doctor) => doctor.email?.toLowerCase() === user?.email?.toLowerCase());
      return filtered.length ? filtered : list;
    }
    return list;
  }, [doctors, role, user?.email]);

  if (isLoading) {
    return <div className="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <EmptyState
        title={copy.errorTitle}
        description={error}
        action={
          <Button type="button" onClick={() => window.location.reload()}>
            {copy.retry}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      {visibleDoctors.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {visibleDoctors.map((doctor) => {
            const meta = getDoctorProfileMeta(doctor._id) || {};
            const department = departments.find((item) => String(item._id) === String(doctor.departmentId?._id || doctor.departmentId));
            const assignedPatients = patients.slice(0, Math.max(2, ((doctor.yearsExperience || 0) % 5) + 2));

            return (
              <Card key={doctor._id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-2xl font-semibold text-white">
                      {doctor.firstName?.[0] || "D"}
                      {doctor.lastName?.[0] || ""}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-semibold">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </p>
                        <Badge variant={doctor.status === "Active" ? "success" : "danger"}>{doctor.status || "Active"}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {doctor.specialization || copy.general} • {department?.name || copy.departmentPending}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {doctor.qualifications?.join(", ") || copy.qualificationsPending}
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="secondary">
                    {copy.displayOnly}
                  </Button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                    <p className="text-sm text-[var(--text-muted)]">{copy.experience}</p>
                    <p className="mt-2 font-semibold">
                      {doctor.yearsExperience || 0} {copy.years}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                    <p className="text-sm text-[var(--text-muted)]">{copy.fee}</p>
                    <p className="mt-2 font-semibold">₹{doctor.consultationFee || 0}</p>
                  </div>
                  <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                    <p className="text-sm text-[var(--text-muted)]">{copy.available}</p>
                    <p className="mt-2 font-semibold">{meta.availableDays?.join(", ") || copy.monFri}</p>
                    <p className="text-sm text-[var(--text-muted)]">{meta.availableHours || "09:00 AM - 05:00 PM"}</p>
                  </div>
                  <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                    <p className="text-sm text-[var(--text-muted)]">{copy.rating}</p>
                    <p className="mt-2 font-semibold">{meta.rating || 4.5} / 5</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {meta.reviews || 0} {copy.reviews}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-[var(--field-label)]">{copy.assignedPatients}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignedPatients.map((patient) => (
                      <span key={`${doctor._id}-${patient._id}`} className="rounded-full bg-[var(--panel-muted)] px-4 py-2 text-sm">
                        {patient.firstName} {patient.lastName}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      )}
    </div>
  );
}

export default DoctorsPage;
