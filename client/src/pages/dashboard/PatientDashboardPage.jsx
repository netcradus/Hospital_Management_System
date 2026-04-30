import { useCallback, useMemo } from "react";
import { HiOutlineCalendarDays, HiOutlineClipboardDocumentList, HiOutlineCreditCard, HiOutlinePhone } from "react-icons/hi2";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import useAuth from "../../hooks/useAuth";
import useLiveQuery from "../../hooks/useLiveQuery";
import { createEntityService } from "../../services/entityService";
import { formatRelativeSeconds, getFullName } from "../../utils/dashboard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { useLanguage } from "../../context/LanguageContext";

const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");

function PatientDashboardPage() {
  const { user } = useAuth();
  const { language, formatCurrency, normalizeText } = useLanguage();
  const loadPatientDashboard = useCallback(async () => {
      const [patients, appointments, billing] = await Promise.all([
        patientService.list({ limit: 100 }),
        appointmentService.list({ limit: 100 }),
        billingService.list({ limit: 100 }),
      ]);

      const patientProfile =
        patients.items.find((patient) => String(patient.userId) === String(user?.id)) ||
        patients.items.find((patient) => patient.email?.toLowerCase() === user?.email?.toLowerCase()) ||
        patients.items[0];

      const patientAppointments = appointments.items.filter(
        (appointment) => String(appointment.patientId?._id || appointment.patientId) === String(patientProfile?._id)
      );
      const patientBilling = billing.items.filter(
        (item) => String(item.patientId?._id || item.patientId) === String(patientProfile?._id)
      );

      return {
        patientProfile,
        appointments: patientAppointments,
        billing: patientBilling,
      };
    }, [user?.email, user?.id]);

  const { data, isLoading, lastUpdated } = useLiveQuery(loadPatientDashboard, {
    initialData: null,
    interval: 180000,
    errorMessage: "Unable to load patient dashboard",
  });

  const upcomingAppointments = (data?.appointments || []).filter((item) => item.status === "Scheduled");
  const copy = useMemo(() => {
    const raw =
      language === "hi"
      ? {
          eyebrow: "पेशेंट डैशबोर्ड",
          title: `नमस्ते, ${data?.patientProfile?.firstName || user?.name || "मरीज"}`,
          description: "आगामी अपॉइंटमेंट, बिलिंग रिकॉर्ड, इमरजेंसी संपर्क और आपकी देखभाल की हाल की जानकारी ट्रैक करें।",
          refresh: "लाइव रिफ्रेश हर 3 मिनट",
          updated: "आखिरी अपडेट",
          upcoming: "आगामी अपॉइंटमेंट",
          upcomingHelper: "आने वाली निर्धारित विजिट",
          records: "मेडिकल रिकॉर्ड",
          recordsHelper: "आपकी टाइमलाइन के अपॉइंटमेंट",
          billing: "बिलिंग इतिहास",
          paidRecords: "भुगतान रिकॉर्ड",
          emergency: "इमरजेंसी संपर्क",
          notSet: "सेट नहीं है",
          noPhone: "फोन उपलब्ध नहीं",
          upcomingTitle: "मेरे आगामी अपॉइंटमेंट",
          upcomingSub: "लाइव अपॉइंटमेंट रिकॉर्ड से",
          noUpcoming: "कोई आगामी अपॉइंटमेंट नहीं",
          noUpcomingDesc: "उपलब्धता कॉन्फ़िगर होने पर नया विजिट बुक करें।",
          bookTitle: "नया अपॉइंटमेंट बुक करें",
          bookSub: "मौजूदा डेटा के अनुसार गाइडेड फ्लो",
          bookingInfo: "विभाग चुनें, फिर डॉक्टर, फिर तारीख और समय जब बैकएंड स्लॉट सपोर्ट उपलब्ध होगा।",
          startBooking: "बुकिंग शुरू करें",
          downloadPrescription: "नवीनतम प्रिस्क्रिप्शन PDF डाउनलोड करें",
          historyTitle: "मेडिकल हिस्ट्री टाइमलाइन",
          historySub: "अपॉइंटमेंट और बिलिंग रिकॉर्ड से",
          followUp: "क्लिनिकल फॉलो-अप",
          noNotes: "इस विजिट के लिए कोई अतिरिक्त नोट दर्ज नहीं है।",
          billingTitle: "बिलिंग इतिहास",
          billingSub: "भुगतान स्थिति और इनवॉइस सारांश",
          noBilling: "कोई बिलिंग रिकॉर्ड नहीं",
          noBillingDesc: "इनवॉइस बनने पर भुगतान इतिहास यहां दिखाई देगा।",
          assignedDoctor: "निर्धारित डॉक्टर",
        }
      : {
          eyebrow: "Patient dashboard",
          title: `Hello, ${data?.patientProfile?.firstName || user?.name || "Patient"}`,
          description: "Track upcoming appointments, billing records, emergency contact details, and your latest care history.",
          refresh: "Live refresh every 3 min",
          updated: "Last updated",
          upcoming: "Upcoming appointments",
          upcomingHelper: "Scheduled visits ahead",
          records: "Medical records",
          recordsHelper: "Appointments in your timeline",
          billing: "Billing history",
          paidRecords: "paid records",
          emergency: "Emergency contact",
          notSet: "Not set",
          noPhone: "No phone on file",
          upcomingTitle: "My upcoming appointments",
          upcomingSub: "Pulled from live appointment records",
          noUpcoming: "No upcoming appointments",
          noUpcomingDesc: "Book a new visit once availability is configured.",
          bookTitle: "Book new appointment",
          bookSub: "Guided flow mapped to existing data",
          bookingInfo: "Select department, then doctor, then date and time once backend slot support is added.",
          startBooking: "Start booking",
          downloadPrescription: "Download latest prescription PDF",
          historyTitle: "Medical history timeline",
          historySub: "Derived from your appointment and billing records",
          followUp: "Clinical follow-up",
          noNotes: "No additional notes recorded for this visit.",
          billingTitle: "Billing history",
          billingSub: "Payment status and invoice snapshot",
          noBilling: "No billing records",
          noBillingDesc: "Your payment history will show up here once invoices are generated.",
          assignedDoctor: "Assigned doctor",
        };

    return Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, typeof value === "string" ? normalizeText(value) : value])
    );
  }, [data?.patientProfile?.firstName, language, normalizeText, user?.name]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      <div className="flex items-center justify-between">
        <Badge variant="info">{copy.refresh}</Badge>
        <p className="text-sm text-[var(--text-muted)]">{`${copy.updated}: ${formatRelativeSeconds(lastUpdated)}`}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HiOutlineCalendarDays} label={copy.upcoming} value={upcomingAppointments.length} helper={copy.upcomingHelper} isLoading={isLoading} />
        <StatCard icon={HiOutlineClipboardDocumentList} label={copy.records} value={(data?.appointments || []).length} helper={copy.recordsHelper} isLoading={isLoading} />
        <StatCard icon={HiOutlineCreditCard} label={copy.billing} value={(data?.billing || []).length} helper={`${(data?.billing || []).filter((item) => item.paymentStatus === "Paid").length} ${copy.paidRecords}`} isLoading={isLoading} />
        <StatCard icon={HiOutlinePhone} label={copy.emergency} value={data?.patientProfile?.emergencyContact?.name || copy.notSet} helper={data?.patientProfile?.emergencyContact?.phone || copy.noPhone} isLoading={isLoading} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title={copy.upcomingTitle} subtitle={copy.upcomingSub}>
          <div className="space-y-3">
            {upcomingAppointments.length ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <p className="font-medium text-[var(--text-primary)]">{getFullName(appointment.doctorId, copy.assignedDoctor)}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{`${new Date(appointment.appointmentDate).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN")} | ${appointment.appointmentTime}`}</p>
                </div>
              ))
            ) : (
              <EmptyState title={copy.noUpcoming} description={copy.noUpcomingDesc} />
            )}
          </div>
        </Card>

        <Card title={copy.bookTitle} subtitle={copy.bookSub}>
          <div className="space-y-4">
            <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 text-sm text-[var(--text-muted)]">
              {copy.bookingInfo}
            </div>
            <Button type="button" className="w-full">{copy.startBooking}</Button>
            <Button type="button" variant="secondary" className="w-full">{copy.downloadPrescription}</Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title={copy.historyTitle} subtitle={copy.historySub}>
          <div className="space-y-4">
            {(data?.appointments || []).slice(0, 6).map((appointment) => (
              <div key={appointment._id} className="relative rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{appointment.reasonForVisit || copy.followUp}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{new Date(appointment.appointmentDate).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN")}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{appointment.notes || copy.noNotes}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title={copy.billingTitle} subtitle={copy.billingSub}>
          <div className="space-y-3">
            {(data?.billing || []).length ? (
              data.billing.map((record) => (
                <div key={record._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{record.serviceDescription}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{formatCurrency(record.totalAmount || 0)}</p>
                    </div>
                    <Badge variant={record.paymentStatus === "Paid" ? "success" : record.paymentStatus === "Pending" ? "warning" : "info"}>
                      {record.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title={copy.noBilling} description={copy.noBillingDesc} />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

export default PatientDashboardPage;
