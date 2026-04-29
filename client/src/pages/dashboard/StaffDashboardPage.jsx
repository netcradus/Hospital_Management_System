import { useCallback, useState } from "react";
import { HiOutlineBeaker, HiOutlineBuildingOffice2, HiOutlineClipboardDocumentList, HiOutlineHeart, HiOutlineUsers } from "react-icons/hi2";
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
import SearchInput from "../../components/common/SearchInput";
import { useLanguage } from "../../context/LanguageContext";

const staffService = createEntityService("staff");
const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");

function StaffDashboardPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const loadStaffDashboard = useCallback(async () => {
      const [staff, patients, appointments, billing] = await Promise.all([
        staffService.list({ limit: 100 }),
        patientService.list({ limit: 100 }),
        appointmentService.list({ limit: 100 }),
        billingService.list({ limit: 100 }),
      ]);

      const staffProfile =
        staff.items.find((member) => member.email?.toLowerCase() === user?.email?.toLowerCase()) ||
        staff.items.find((member) => String(member.userId) === String(user?.id)) ||
        null;

      return {
        staffProfile,
        patients: patients.items,
        appointments: appointments.items,
        billing: billing.items,
      };
    }, [user?.email, user?.id]);

  const { data, isLoading, lastUpdated } = useLiveQuery(loadStaffDashboard, {
    initialData: null,
    interval: 180000,
    errorMessage: "Unable to load staff dashboard",
  });

  const staffSpecialty = (data?.staffProfile?.role || "Operations").toLowerCase();
  const isNurse = staffSpecialty.includes("nurse");
  const isReceptionist = staffSpecialty.includes("reception");
  const isPharmacist = staffSpecialty.includes("pharmac");
  const filteredPatients = (data?.patients || []).filter((patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const copy =
    language === "hi"
      ? {
          eyebrow: "स्टाफ ऑपरेशंस",
          title: `${data?.staffProfile?.role || "सपोर्ट टीम"} डैशबोर्ड`,
          description: "यह वर्कस्पेस मौजूदा स्टाफ प्रोफाइल के अनुसार बदलता है ताकि नर्स, रिसेप्शन और फार्मेसी कार्य एक ही बैकएंड API के साथ चल सकें।",
          refresh: "लाइव रिफ्रेश हर 3 मिनट",
          updated: "आखिरी अपडेट",
          assignedPatients: "असाइन मरीज",
          assignedHelper: "लाइव मरीज प्रोफाइल",
          appointmentsToday: "आज के अपॉइंटमेंट",
          appointmentsHelper: "वर्तमान शेड्यूल",
          pendingBilling: "लंबित बिलिंग",
          pendingHelper: "फॉलो-अप आवश्यक",
          staffRole: "स्टाफ भूमिका",
          staffRoleHelper: "स्टाफ रिकॉर्ड से",
          patientSearch: "मरीज खोज",
          patientSearchSub: "मौजूदा मरीजों में तुरंत खोजें",
          searchPlaceholder: "मरीज का नाम खोजें",
          noPhone: "फोन नहीं",
          noCity: "शहर नहीं",
          roleWorkspace: "रोल वर्कस्पेस",
          roleWorkspaceSub: "स्टाफ भूमिका के अनुसार विजेट बदलते हैं",
          vitalsEntry: "वाइटल्स एंट्री",
          vitalsDesc: "चयनित मरीज के लिए BP, pulse, temperature और SpO2 रिकॉर्ड करें।",
          vitalsBtn: "वाइटल्स फॉर्म खोलें",
          registration: "रजिस्ट्रेशन और चेक-इन",
          registrationDesc: "वॉक-इन, मल्टी-स्टेप रजिस्ट्रेशन और अपॉइंटमेंट कोऑर्डिनेशन के लिए इस पैनल का उपयोग करें।",
          registrationBtn: "नई रजिस्ट्रेशन शुरू करें",
          pharmacy: "प्रिस्क्रिप्शन और इन्वेंटरी क्यू",
          pharmacyDesc: "फुल इन्वेंटरी विजेट के लिए बैकएंड एंडपॉइंट की जरूरत है, इसलिए अभी यह दृश्य बिलिंग और मरीज रिकॉर्ड से जुड़ा है।",
          pharmacyBtn: "क्यू से डिस्पेंस करें",
          generalTitle: "जनरल स्टाफ वर्कस्पेस",
          generalDesc: "नर्स, रिसेप्शनिस्ट या फार्मासिस्ट जैसी अधिक विशिष्ट भूमिका दें ताकि टेलर्ड डैशबोर्ड दिखे।",
          dailyList: "दैनिक अपॉइंटमेंट सूची",
          dailyListSub: "चेक-इन और कोऑर्डिनेशन के लिए",
          supportAlerts: "सपोर्ट अलर्ट",
          supportAlertsSub: "मौजूदा रिकॉर्ड से ऑपरेशनल रिमाइंडर",
          pendingCollections: "लंबित कलेक्शन",
          pendingCollectionsDesc: "इनवॉइस पर फॉलो-अप आवश्यक है।",
          newRegistrations: "नई रजिस्ट्रेशन",
          newRegistrationsDesc: "हाल के मरीज प्रोफाइल सत्यापन के लिए तैयार हैं।",
          medicationSupport: "मेडिकेशन सपोर्ट",
          medicationSupportDesc: "फार्मेसी इन्वेंटरी के लिए फुल स्टॉक विजेट हेतु बैकएंड एंडपॉइंट आवश्यक हैं।",
        }
      : {
          eyebrow: "Staff operations",
          title: `${data?.staffProfile?.role || "Support team"} dashboard`,
          description: "This workspace adapts to the current staff profile so nurse, receptionist, and pharmacist tasks can share the existing backend APIs.",
          refresh: "Live refresh every 3 min",
          updated: "Last updated",
          assignedPatients: "Assigned patients",
          assignedHelper: "Live patient profiles",
          appointmentsToday: "Appointments today",
          appointmentsHelper: "Current schedule",
          pendingBilling: "Pending billing",
          pendingHelper: "Needs follow-up",
          staffRole: "Staff role",
          staffRoleHelper: "Derived from staff records",
          patientSearch: "Patient search",
          patientSearchSub: "Instant search across current patients",
          searchPlaceholder: "Search patient name",
          noPhone: "No phone",
          noCity: "No city",
          roleWorkspace: "Role workspace",
          roleWorkspaceSub: "Widgets switch based on the staff profile role",
          vitalsEntry: "Vitals entry",
          vitalsDesc: "Record BP, pulse, temperature, and SpO2 using the selected patient workflow.",
          vitalsBtn: "Open vitals form",
          registration: "Registration and check-in",
          registrationDesc: "Use this panel for walk-ins, multi-step registration, and appointment coordination.",
          registrationBtn: "Start new registration",
          pharmacy: "Prescription and inventory queue",
          pharmacyDesc: "Current backend does not expose inventory endpoints, so this view anchors pharmacist activity to billing and patient records for now.",
          pharmacyBtn: "Dispense from queue",
          generalTitle: "General staff workspace",
          generalDesc: "Assign a more specific staff role such as Nurse, Receptionist, or Pharmacist to unlock a tailored dashboard view.",
          dailyList: "Daily appointment list",
          dailyListSub: "Use for check-in and coordination",
          supportAlerts: "Support alerts",
          supportAlertsSub: "Operational reminders pulled from existing records",
          pendingCollections: "Pending collections",
          pendingCollectionsDesc: "invoices need follow-up.",
          newRegistrations: "New registrations",
          newRegistrationsDesc: "recent patient profiles are ready for verification.",
          medicationSupport: "Medication support",
          medicationSupportDesc: "Pharmacy-specific inventory data requires backend endpoints before full stock widgets can go live.",
        };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      <div className="flex items-center justify-between">
        <Badge variant="info">{copy.refresh}</Badge>
        <p className="text-sm text-[var(--text-muted)]">{`${copy.updated}: ${formatRelativeSeconds(lastUpdated)}`}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HiOutlineUsers} label={copy.assignedPatients} value={data?.patients.length ?? 0} helper={copy.assignedHelper} isLoading={isLoading} />
        <StatCard icon={HiOutlineClipboardDocumentList} label={copy.appointmentsToday} value={(data?.appointments || []).filter((item) => item.appointmentDate?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length} helper={copy.appointmentsHelper} isLoading={isLoading} />
        <StatCard icon={HiOutlineBuildingOffice2} label={copy.pendingBilling} value={(data?.billing || []).filter((item) => item.paymentStatus !== "Paid").length} helper={copy.pendingHelper} isLoading={isLoading} />
        <StatCard icon={HiOutlineHeart} label={copy.staffRole} value={data?.staffProfile?.role || "Operations"} helper={copy.staffRoleHelper} isLoading={isLoading} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title={copy.patientSearch} subtitle={copy.patientSearchSub}>
          <SearchInput value={search} onChange={setSearch} placeholder={copy.searchPlaceholder} />
          <div className="mt-4 space-y-3">
            {filteredPatients.slice(0, 8).map((patient) => (
              <div key={patient._id} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{getFullName(patient)}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{`${patient.phone || copy.noPhone} | ${patient.city || copy.noCity}`}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title={copy.roleWorkspace} subtitle={copy.roleWorkspaceSub}>
          {isNurse ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{copy.vitalsEntry}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{copy.vitalsDesc}</p>
              </div>
              <Button type="button" className="w-full">{copy.vitalsBtn}</Button>
            </div>
          ) : isReceptionist ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{copy.registration}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{copy.registrationDesc}</p>
              </div>
              <Button type="button" className="w-full">{copy.registrationBtn}</Button>
            </div>
          ) : isPharmacist ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{copy.pharmacy}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{copy.pharmacyDesc}</p>
              </div>
              <Button type="button" className="w-full">{copy.pharmacyBtn}</Button>
            </div>
          ) : (
            <EmptyState title={copy.generalTitle} description={copy.generalDesc} />
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title={copy.dailyList} subtitle={copy.dailyListSub}>
          <div className="space-y-3">
            {(data?.appointments || []).slice(0, 8).map((appointment) => (
              <div key={appointment._id} className="flex flex-col gap-3 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{getFullName(appointment.patientId)}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{`${appointment.appointmentTime} | ${getFullName(appointment.doctorId)}`}</p>
                </div>
                <Badge variant={appointment.status === "Completed" ? "success" : "info"}>{appointment.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title={copy.supportAlerts} subtitle={copy.supportAlertsSub}>
          <div className="space-y-3">
            <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
              <p className="font-medium text-[var(--text-primary)]">{copy.pendingCollections}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{`${(data?.billing || []).filter((item) => item.paymentStatus !== "Paid").length} ${copy.pendingCollectionsDesc}`}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
              <p className="font-medium text-[var(--text-primary)]">{copy.newRegistrations}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{`${(data?.patients || []).slice(0, 5).length} ${copy.newRegistrationsDesc}`}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
              <p className="font-medium text-[var(--text-primary)]">{copy.medicationSupport}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{copy.medicationSupportDesc}</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default StaffDashboardPage;
