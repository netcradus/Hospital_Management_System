import { useCallback, useMemo, useState } from "react";
import { HiOutlineClipboardDocumentList, HiOutlineCurrencyDollar, HiOutlineUsers } from "react-icons/hi2";
import { toast } from "sonner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatCard from "../../components/common/StatCard";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import useLiveQuery from "../../hooks/useLiveQuery";
import { createEntityService } from "../../services/entityService";
import { formatRelativeSeconds, getFullName } from "../../utils/dashboard";
import { saveLeaveRequest } from "../../utils/leaveRequests";

const appointmentService = createEntityService("appointments");
const patientService = createEntityService("patients");
const billingService = createEntityService("billing");
const doctorService = createEntityService("doctors");

function DoctorDashboardPage() {
  const { user } = useAuth();
  const { language, formatCurrency, normalizeText } = useLanguage();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ from: "", to: "", reason: "" });
  const debouncedPatientSearch = useDebouncedValue(patientSearch);

  const copy = useMemo(() => {
      if (language === "hi") {
        return {
          eyebrow: "डॉक्टर डैशबोर्ड",
          title: `स्वागत है, ${user?.name || "डॉक्टर"}`,
          description: "आज की कंसल्टेशन देखें, अपने मरीज खोजें और साप्ताहिक शेड्यूल पर नजर रखें।",
          refresh: "लाइव रिफ्रेश हर 3 मिनट",
          updated: "अंतिम अपडेट",
          todayAppointments: "आज के अपॉइंटमेंट",
          completed: "पूर्ण",
          myPatients: "मेरे मरीज",
          linkedPatients: "अपॉइंटमेंट रिकॉर्ड से जुड़े मरीज",
          earnings: "आय सारांश",
          earningsHelper: "मौजूदा बिलिंग रिकॉर्ड से",
          pendingConsultations: "लंबित कंसल्टेशन",
          pendingHelper: "अभी शुरू करने के लिए तैयार",
          appointmentsTitle: "आज के अपॉइंटमेंट",
          appointmentsSubtitle: "लाइव डॉक्टर-लिंक्ड अपॉइंटमेंट के अनुसार क्रमबद्ध",
          generalConsultation: "सामान्य परामर्श",
          startConsultation: "कंसल्टेशन शुरू करें",
          noConsultations: "आज कोई कंसल्टेशन नहीं है",
          noConsultationsDesc: "आज के लिए डॉक्टर-लिंक्ड कोई अपॉइंटमेंट शेड्यूल नहीं है।",
          leaveTitle: "अवकाश आवेदन",
          leaveSubtitle: "अनुरोध तैयार करें और भेजें",
          from: "से",
          to: "तक",
          reason: "कारण",
          leavePlaceholder: "कॉन्फ्रेंस, व्यक्तिगत अवकाश, आपातकाल...",
          leaveSubmit: "अवकाश अनुरोध भेजें",
          leaveSubmitting: "अनुरोध भेजा जा रहा है...",
          leaveIncomplete: "कृपया पूरा अवकाश फॉर्म भरें।",
          leaveDateError: "अवकाश की समाप्ति तिथि प्रारंभ तिथि से पहले नहीं हो सकती।",
          leaveSuccess: "अवकाश अनुरोध सफलतापूर्वक तैयार हो गया।",
          myPatientsTitle: "मेरे मरीज",
          myPatientsSubtitle: "मरीज नाम से खोजें और फ़िल्टर करें",
          searchPatients: "मेरे मरीज खोजें",
          noPatientMatch: "कोई मरीज मेल नहीं खाया",
          noPatientMatchDesc: "दूसरा नाम आजमाएं या अधिक मरीज लिंक होने की प्रतीक्षा करें।",
          weeklySchedule: "साप्ताहिक शेड्यूल",
          weeklyScheduleSubtitle: "अगले 7 दिनों का कैलेंडर दृश्य",
          noSlots: "कोई स्लॉट बुक नहीं",
          prescriptionTitle: "प्रिस्क्रिप्शन इतिहास",
          prescriptionSubtitle: "अपॉइंटमेंट रिकॉर्ड से हाल की कंसल्टेशन नोट्स",
          noNotes: "अभी कोई कंसल्टेशन नोट रिकॉर्ड नहीं है।",
          consultationTitle: "कंसल्टेशन वर्कस्पेस",
          consultationDesc: "मरीज इतिहास देखें, नोट्स लिखें और कंसल्टेशन पूर्ण करें।",
          patientHistory: "मरीज इतिहास",
          patientHistoryDesc: "बैकएंड रिकॉर्ड में मेडिकल हिस्ट्री अभी मरीज प्रोफाइल पर उपलब्ध है, विजिट टाइमलाइन पर नहीं। डेटा आते ही यह मॉड्यूल उसे दिखाने के लिए तैयार है।",
          consultationNotes: "कंसल्टेशन नोट्स",
          consultationNotesPlaceholder: "लक्षण, निदान, अगले कदम",
          prescribe: "दवा लिखें",
          prescribePlaceholder: "दवा का नाम, डोज, अवधि",
          saveDraft: "ड्राफ्ट सेव करें",
          markCompleted: "पूर्ण चिह्नित करें",
        };
      }

      const raw = language === "__disabled_hi__"
        ? {
            eyebrow: "?????? ????????",
            title: `??????, ${user?.name || "??????"}`,
            description: "?? ?? ?????????, ?????? ?? ???? ?? ????????? ??????? ?? ?? ??? ?? ??????",
            refresh: "???? ??????? ?? 3 ????",
            updated: "????? ?????",
            todayAppointments: "?? ?? ??????????",
            completed: "?????",
            myPatients: "???? ????",
            linkedPatients: "?????????? ??????? ?? ????? ????",
            earnings: "?? ??????",
            earningsHelper: "??????? ?????? ??????? ??",
            pendingConsultations: "???? ?????????",
            pendingHelper: "??? ???? ???? ?? ??? ?????",
            appointmentsTitle: "?? ?? ??????????",
            appointmentsSubtitle: "?????? ?? ????? ???? ??????????",
            generalConsultation: "??????? ???????",
            startConsultation: "????????? ???? ????",
            noConsultations: "?? ??? ????????? ????",
            noConsultationsDesc: "?? ?? ??? ?????? ?? ????? ??? ?????????? ???? ?????",
            leaveTitle: "????? ?????",
            leaveSubtitle: "????? ????? ?? ?????? ??? ????",
            from: "??",
            to: "??",
            reason: "????",
            leavePlaceholder: "???????, ????????? ?????, ???????...",
            leaveSubmit: "????? ?????? ?????",
            leaveSubmitting: "???? ?? ??? ??...",
            leaveIncomplete: "????? ????? ????? ???? ??? ?????",
            leaveDateError: "????? ?? ??????? ???? ?????? ?? ???? ???? ?? ?????",
            leaveSuccess: "????? ?????? ??????????? ????? ?? ????",
            myPatientsTitle: "???? ????",
            myPatientsSubtitle: "??? ?? ????? ?? ?????? ????",
            searchPatients: "???? ???? ?????",
            noPatientMatch: "??? ???? ???? ????",
            noPatientMatchDesc: "????? ??? ????? ?? ?? ?????????? ??????? ??? ?? ?????? ?????",
            weeklySchedule: "????????? ???????",
            weeklyScheduleSubtitle: "???? 7 ????? ?? ????????",
            noSlots: "??? ????? ??? ????",
            prescriptionTitle: "?????????????? ??????",
            prescriptionSubtitle: "??? ?? ????????? ?????",
            noNotes: "??? ?? ??? ????????? ??? ???? ???? ???",
            consultationTitle: "????????? ?????????",
            consultationDesc: "???? ?? ?????? ?????, ????? ????? ?? ????? ????? ?????",
            patientHistory: "???? ?? ??????",
            patientHistoryDesc: "?????? ??? ?????? ???????? ?? ?????? ???????? ??? ???? ??? ???? ?? ???????? ???? ?????? ????, ?? ????? ??? ????????",
            consultationNotes: "????????? ?????",
            consultationNotesPlaceholder: "?????, ?????, ???? ???",
            prescribe: "??? ?????",
            prescribePlaceholder: "??? ?? ???, ????, ????",
            saveDraft: "??????? ??????",
            markCompleted: "????? ????",
          }
        : {
            eyebrow: "Doctor dashboard",
            title: `Welcome, ${user?.name || "Doctor"}`,
            description: "Review today's consultations, search your patients, and stay on top of your weekly schedule.",
            refresh: "Live refresh every 3 min",
            updated: "Last updated",
            todayAppointments: "Today's appointments",
            completed: "completed",
            myPatients: "My patients",
            linkedPatients: "Linked from appointment records",
            earnings: "Earnings summary",
            earningsHelper: "From current billing records",
            pendingConsultations: "Pending consultations",
            pendingHelper: "Ready to start now",
            appointmentsTitle: "Today's appointments",
            appointmentsSubtitle: "Sorted from live doctor-linked appointments",
            generalConsultation: "General consultation",
            startConsultation: "Start Consultation",
            noConsultations: "No consultations today",
            noConsultationsDesc: "There are no doctor-linked appointments scheduled for today.",
            leaveTitle: "Leave application",
            leaveSubtitle: "Draft and submit a request",
            from: "From",
            to: "To",
            reason: "Reason",
            leavePlaceholder: "Conference, personal leave, emergency...",
            leaveSubmit: "Submit Leave Request",
            leaveSubmitting: "Submitting request...",
            leaveIncomplete: "Please complete the full leave request form.",
            leaveDateError: "Leave end date cannot be before the start date.",
            leaveSuccess: "Leave request drafted successfully.",
            myPatientsTitle: "My patients",
            myPatientsSubtitle: "Search and filter by patient name",
            searchPatients: "Search my patients",
            noPatientMatch: "No patients matched",
            noPatientMatchDesc: "Try a different name or wait for more appointment-linked patients.",
            weeklySchedule: "Weekly schedule",
            weeklyScheduleSubtitle: "7-day calendar style snapshot",
            noSlots: "No slots booked",
            prescriptionTitle: "Prescription history",
            prescriptionSubtitle: "Recent consultation notes from appointment records",
            noNotes: "No consultation notes recorded yet.",
            consultationTitle: "Consultation workspace",
            consultationDesc: "Review patient history, record notes, and mark consultation complete.",
            patientHistory: "Patient history",
            patientHistoryDesc: "Backend records currently expose medical history on patient profiles, not visit timelines. This modal is ready to surface that data once populated.",
            consultationNotes: "Consultation notes",
            consultationNotesPlaceholder: "Symptoms, diagnosis, next steps",
            prescribe: "Prescribe medicine",
            prescribePlaceholder: "Drug name, dosage, duration",
            saveDraft: "Save Draft",
            markCompleted: "Mark Completed",
          };

      return Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [key, typeof value === "string" ? normalizeText(value) : value])
      );
    }, [language, normalizeText, user?.name]);

  const loadDoctorDashboard = useCallback(async () => {
      const [doctors, appointments, patients, billing] = await Promise.all([
        doctorService.list({ limit: 100 }, { ttl: 180000 }),
        appointmentService.list({ limit: 100 }, { ttl: 180000 }),
        patientService.list({ limit: 100 }, { ttl: 180000 }),
        billingService.list({ limit: 100 }, { ttl: 180000 }),
      ]);

      const doctorProfile =
        doctors.items.find((doctor) => String(doctor.userId) === String(user?.id)) ||
        doctors.items.find((doctor) => doctor.email?.toLowerCase() === user?.email?.toLowerCase()) ||
        null;

      const doctorAppointments = doctorProfile
        ? appointments.items.filter(
            (appointment) => String(appointment.doctorId?._id || appointment.doctorId) === String(doctorProfile._id)
          )
        : [];
      const doctorBilling = doctorProfile
        ? billing.items.filter((item) => String(item.doctorId?._id || item.doctorId) === String(doctorProfile._id))
        : [];
      const patientIds = new Set(doctorAppointments.map((appointment) => String(appointment.patientId?._id || appointment.patientId)));
      const myPatients = patients.items.filter((patient) => patientIds.has(String(patient._id)));

      return {
        doctorProfile,
        appointments: doctorAppointments,
        myPatients,
        earnings: doctorBilling.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      };
    }, [user?.email, user?.id]);

  const { data, isLoading, lastUpdated } = useLiveQuery(loadDoctorDashboard, {
    initialData: null,
    interval: 180000,
    errorMessage: "Unable to load doctor dashboard",
  });

  const filteredPatients = useMemo(() => {
    const normalizedQuery = debouncedPatientSearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return data?.myPatients || [];
    }

    return (data?.myPatients || []).filter((patient) =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(normalizedQuery)
    );
  }, [data?.myPatients, debouncedPatientSearch]);

  const todayAppointments = useMemo(
    () =>
      (data?.appointments || []).filter(
        (appointment) => appointment.appointmentDate?.slice(0, 10) === new Date().toISOString().slice(0, 10)
      ),
    [data?.appointments]
  );

  const handleLeaveSubmit = async (event) => {
    event.preventDefault();

    if (!leaveForm.from || !leaveForm.to || !leaveForm.reason.trim()) {
      toast.error(copy.leaveIncomplete);
      return;
    }

    if (leaveForm.to < leaveForm.from) {
      toast.error(copy.leaveDateError);
      return;
    }

    setIsSubmittingLeave(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      saveLeaveRequest({
        doctorName: user?.name || data?.doctorProfile?.firstName || "Doctor",
        doctorEmail: user?.email || "",
        from: leaveForm.from,
        to: leaveForm.to,
        reason: leaveForm.reason.trim(),
      });
      toast.success(copy.leaveSuccess);
      setLeaveForm({ from: "", to: "", reason: "" });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Badge variant="info">{copy.refresh}</Badge>
        <p className="text-sm text-[var(--text-muted)]">{`${copy.updated}: ${formatRelativeSeconds(lastUpdated)}`}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HiOutlineClipboardDocumentList} label={copy.todayAppointments} value={todayAppointments.length} helper={`${todayAppointments.filter((item) => item.status === "Completed").length} ${copy.completed}`} isLoading={isLoading} />
        <StatCard icon={HiOutlineUsers} label={copy.myPatients} value={data?.myPatients.length ?? 0} helper={copy.linkedPatients} isLoading={isLoading} />
        <StatCard icon={HiOutlineCurrencyDollar} label={copy.earnings} value={formatCurrency(data?.earnings || 0)} helper={copy.earningsHelper} isLoading={isLoading} />
        <StatCard icon={HiOutlineClipboardDocumentList} label={copy.pendingConsultations} value={todayAppointments.filter((item) => item.status === "Scheduled").length} helper={copy.pendingHelper} isLoading={isLoading} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title={copy.appointmentsTitle} subtitle={copy.appointmentsSubtitle}>
          <div className="space-y-3">
            {todayAppointments.length ? (
              [...todayAppointments]
                .sort((leftItem, rightItem) => String(leftItem.appointmentTime).localeCompare(String(rightItem.appointmentTime)))
                .map((appointment) => (
                  <div key={appointment._id} className="flex flex-col gap-4 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{getFullName(appointment.patientId)}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{`${appointment.appointmentTime} | ${appointment.reasonForVisit || copy.generalConsultation}`}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={appointment.status === "Completed" ? "success" : appointment.status === "Cancelled" ? "danger" : "info"}>
                        {appointment.status}
                      </Badge>
                      <Button type="button" onClick={() => setSelectedAppointment(appointment)}>
                        {copy.startConsultation}
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <EmptyState title={copy.noConsultations} description={copy.noConsultationsDesc} />
            )}
          </div>
        </Card>

        <Card title={copy.leaveTitle} subtitle={copy.leaveSubtitle}>
          <form className="space-y-4" onSubmit={handleLeaveSubmit}>
            <InputField label={copy.from} type="date" value={leaveForm.from} onChange={(event) => setLeaveForm((currentValue) => ({ ...currentValue, from: event.target.value }))} />
            <InputField label={copy.to} type="date" value={leaveForm.to} onChange={(event) => setLeaveForm((currentValue) => ({ ...currentValue, to: event.target.value }))} />
            <InputField label={copy.reason} placeholder={copy.leavePlaceholder} value={leaveForm.reason} onChange={(event) => setLeaveForm((currentValue) => ({ ...currentValue, reason: event.target.value }))} />
            <Button type="submit" className="w-full" disabled={isSubmittingLeave}>
              {isSubmittingLeave ? copy.leaveSubmitting : copy.leaveSubmit}
            </Button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title={copy.myPatientsTitle} subtitle={copy.myPatientsSubtitle}>
          <SearchInput value={patientSearch} onChange={setPatientSearch} placeholder={copy.searchPatients} />
          <div className="mt-4 space-y-3">
            {filteredPatients.length ? (
              filteredPatients.map((patient) => (
                <div key={patient._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <p className="font-medium text-[var(--text-primary)]">{getFullName(patient)}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{`${patient.gender || "N/A"} | ${patient.bloodType || "Blood type unavailable"} | ${patient.phone || "No phone"}`}</p>
                </div>
              ))
            ) : (
              <EmptyState title={copy.noPatientMatch} description={copy.noPatientMatchDesc} />
            )}
          </div>
        </Card>

        <Card title={copy.weeklySchedule} subtitle={copy.weeklyScheduleSubtitle}>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 7 }, (_, index) => {
              const date = new Date();
              date.setDate(date.getDate() + index);
              const key = date.toISOString().slice(0, 10);
              const dayAppointments = (data?.appointments || []).filter((appointment) => appointment.appointmentDate?.slice(0, 10) === key);

              return (
                <div key={key} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{date.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
                  <div className="mt-3 space-y-2">
                    {dayAppointments.length ? (
                      dayAppointments.slice(0, 4).map((appointment) => (
                        <div key={appointment._id} className="rounded-2xl bg-brand-500/10 px-3 py-2 text-sm text-[var(--text-secondary)]">
                          {`${appointment.appointmentTime} | ${getFullName(appointment.patientId)}`}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">{copy.noSlots}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <Card title={copy.prescriptionTitle} subtitle={copy.prescriptionSubtitle}>
        <div className="grid gap-3 lg:grid-cols-2">
          {(data?.appointments || []).slice(0, 6).map((appointment) => (
            <div key={appointment._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
              <p className="font-medium text-[var(--text-primary)]">{getFullName(appointment.patientId)}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{appointment.notes || copy.noNotes}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={Boolean(selectedAppointment)} onClose={() => setSelectedAppointment(null)} title={copy.consultationTitle} description={copy.consultationDesc} size="lg">
        {selectedAppointment ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{getFullName(selectedAppointment.patientId)}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedAppointment.reasonForVisit || copy.generalConsultation}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 text-sm text-[var(--text-secondary)]">
                <p className="font-medium text-[var(--text-primary)]">{copy.patientHistory}</p>
                <p className="mt-2">{copy.patientHistoryDesc}</p>
              </div>
            </div>
            <div className="space-y-4">
              <InputField label={copy.consultationNotes} placeholder={copy.consultationNotesPlaceholder} />
              <InputField label={copy.prescribe} placeholder={copy.prescribePlaceholder} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" className="flex-1">{copy.saveDraft}</Button>
                <Button type="button" className="flex-1">{copy.markCompleted}</Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default DoctorDashboardPage;

