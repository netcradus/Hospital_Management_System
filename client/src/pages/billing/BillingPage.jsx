import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { HiOutlineArrowDownTray, HiOutlineEnvelope, HiOutlinePrinter } from "react-icons/hi2";
import { toast } from "sonner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { createEntityService } from "../../services/entityService";
import {
  ensureSupplementData,
  getInvoiceMeta,
  saveInvoiceMeta,
  saveInvoiceNotification,
} from "../../services/hmsSupplementService";

const billingService = createEntityService("billing");
const patientService = createEntityService("patients");
const doctorService = createEntityService("doctors");
const appointmentService = createEntityService("appointments");
const departmentService = createEntityService("departments");

const paymentMethods = ["Cash", "Card", "Insurance", "Online"];
const invoiceStatuses = ["Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Cancelled"];

function newLineItem() {
  return { description: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0, subtotal: 0 };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
}

function printInvoice(invoice) {
  const popup = window.open("", "_blank", "width=960,height=780");
  if (!popup) {
    toast.error("Allow popups to print the invoice");
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #123; }
          h1,h2,h3,p { margin: 0 0 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border: 1px solid #d7e1ea; padding: 10px; text-align: left; font-size: 12px; }
          .header { display:flex; justify-content:space-between; margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>MEDICare HMS</h1>
            <p>17 Care Avenue, Kolkata</p>
            <p>+91 33 4000 2244</p>
          </div>
          <div>
            <h2>${invoice.invoiceNumber}</h2>
            <p>${invoice.status}</p>
          </div>
        </div>
        <p><strong>Patient:</strong> ${invoice.patientName}</p>
        <p><strong>Doctor:</strong> ${invoice.doctorName || "Unassigned"}</p>
        <p><strong>Date:</strong> ${invoice.createdAtLabel}</p>
        <table>
          <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Discount%</th><th>Tax%</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${invoice.lineItems.map((item) => `<tr><td>${item.description}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.discount}</td><td>${item.tax}</td><td>${item.subtotal}</td></tr>`).join("")}
          </tbody>
        </table>
        <h3 style="margin-top:20px">Grand Total: ${invoice.totalLabel}</h3>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function BillingPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const role = user?.workspaceRole || user?.role;
  const canCreate = role === "super_admin" || role === "receptionist";
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({ status: "", doctorId: "", paymentMethod: "", dateFrom: "", dateTo: "" });
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    appointmentId: "",
    paymentMethod: "Cash",
    status: "Draft",
    lineItems: [newLineItem()],
  });
  const copy = language === "hi"
    ? {
        eyebrow: "बिलिंग और इनवॉइस",
        title: "इनवॉइस निर्माण और रेवेन्यू डैशबोर्ड",
        description: "इनवॉइस बनाएं, बिलिंग रिकॉर्ड फिल्टर करें और विभागवार रेवेन्यू देखें।",
        monthRevenue: "इस माह की आय",
        yearRevenue: "इस वर्ष की आय",
        outstanding: "बकाया भुगतान",
        createTitle: "इनवॉइस निर्माण",
        createSubtitle: "कंसल्टेशन, प्रोसीजर, लैब टेस्ट, दवाइयाँ और रूम चार्ज",
        listTitle: "इनवॉइस सूची",
        listSubtitle: "तिथि, स्टेटस, डॉक्टर और भुगतान तरीके से फिल्टर करें",
        departmentRevenue: "विभाग अनुसार आय",
        transactions: "हाल की ट्रांजेक्शन",
      }
    : {
        eyebrow: "Billing & Invoices",
        title: "Invoice Creation and Revenue Dashboard",
        description: "Create line-item invoices, filter live billing records, print/download, and review department revenue.",
        monthRevenue: "Revenue This Month",
        yearRevenue: "Revenue This Year",
        outstanding: "Outstanding Payments",
        createTitle: "Invoice Creation",
        createSubtitle: "Consultation, procedures, lab tests, medicines, and room charges",
        listTitle: "Invoice List",
        listSubtitle: "Filter by date, status, doctor, and payment method",
        departmentRevenue: "Revenue by Department",
        transactions: "Recent Transactions",
      };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patientResponse, doctorResponse, appointmentResponse, billingResponse, departmentResponse] = await Promise.all([
        patientService.list({ limit: 200 }, { force: true }),
        doctorService.list({ limit: 100 }, { force: true }),
        appointmentService.list({ limit: 200 }, { force: true }),
        billingService.list({ limit: 200 }, { force: true }),
        departmentService.list({ limit: 100 }, { force: true }),
      ]);
      ensureSupplementData({
        patients: patientResponse.items,
        doctors: doctorResponse.items,
        appointments: appointmentResponse.items,
        billing: billingResponse.items,
      });
      setPatients(patientResponse.items);
      setDoctors(doctorResponse.items);
      setAppointments(appointmentResponse.items);
      setDepartments(departmentResponse.items);
      setItems(billingResponse.items);
      setForm((current) => ({
        ...current,
        patientId: current.patientId || patientResponse.items[0]?._id || "",
        doctorId: current.doctorId || doctorResponse.items[0]?._id || "",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentTotals = useMemo(() => {
    const subtotal = form.lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
    const discountAmount = form.lineItems.reduce((sum, item) => sum + ((Number(item.quantity || 0) * Number(item.unitPrice || 0) * Number(item.discount || 0)) / 100), 0);
    const taxAmount = form.lineItems.reduce((sum, item) => {
      const base = Number(item.quantity || 0) * Number(item.unitPrice || 0);
      return sum + (((base - ((base * Number(item.discount || 0)) / 100)) * Number(item.tax || 0)) / 100);
    }, 0);
    return { subtotal, discountAmount, taxAmount, total: subtotal - discountAmount + taxAmount };
  }, [form.lineItems]);

  const decoratedItems = useMemo(() => {
    return items.map((invoice) => {
      const meta = getInvoiceMeta(invoice._id) || {};
      const patientName = `${invoice.patientId?.firstName || ""} ${invoice.patientId?.lastName || ""}`.trim();
      const doctorName = `${invoice.doctorId?.firstName || ""} ${invoice.doctorId?.lastName || ""}`.trim();
      const paidAmount = Number(meta.paidAmount ?? (invoice.paymentStatus === "Paid" ? invoice.totalAmount : 0));
      const status = meta.status || invoice.paymentStatus || "Draft";
      return {
        ...invoice,
        lineItems: meta.lineItems || [{ description: invoice.serviceDescription, quantity: 1, unitPrice: invoice.amount, discount: invoice.discount, tax: invoice.tax, subtotal: invoice.totalAmount }],
        paidAmount,
        balance: Number(invoice.totalAmount || 0) - paidAmount,
        status,
        patientName,
        doctorName,
        createdAtLabel: new Date(invoice.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        totalLabel: formatCurrency(invoice.totalAmount),
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return decoratedItems.filter((invoice) => {
      const matchesStatus = !filters.status || invoice.status === filters.status;
      const matchesDoctor = !filters.doctorId || String(invoice.doctorId?._id || invoice.doctorId) === filters.doctorId;
      const matchesMethod = !filters.paymentMethod || invoice.paymentMethod === filters.paymentMethod;
      const createdAt = new Date(invoice.createdAt || Date.now());
      const matchesFrom = !filters.dateFrom || createdAt >= new Date(filters.dateFrom);
      const matchesTo = !filters.dateTo || createdAt <= new Date(filters.dateTo);
      return matchesStatus && matchesDoctor && matchesMethod && matchesFrom && matchesTo;
    });
  }, [decoratedItems, filters]);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const thisMonth = decoratedItems.filter((item) => new Date(item.createdAt || Date.now()).getMonth() === now.getMonth());
    const thisYear = decoratedItems.filter((item) => new Date(item.createdAt || Date.now()).getFullYear() === now.getFullYear());
    return {
      monthRevenue: thisMonth.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
      yearRevenue: thisYear.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
      outstanding: decoratedItems.reduce((sum, item) => sum + Math.max(0, Number(item.balance || 0)), 0),
    };
  }, [decoratedItems]);

  const revenueByDepartment = useMemo(() => {
    return departments.map((department, index) => ({
      name: department.name,
      value: decoratedItems
        .filter((item) => item.doctorId?.departmentId?.name === department.name)
        .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      color: ["#1abc9c", "#2980e8", "#0f766e", "#f59e0b", "#ef4444"][index % 5],
    })).filter((item) => item.value > 0);
  }, [decoratedItems, departments]);

  const updateLineItem = (index, key, value) => {
    setForm((current) => {
      const nextLineItems = current.lineItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }
        const next = { ...item, [key]: value };
        const base = Number(next.quantity || 0) * Number(next.unitPrice || 0);
        const afterDiscount = base - ((base * Number(next.discount || 0)) / 100);
        next.subtotal = Number((afterDiscount + ((afterDiscount * Number(next.tax || 0)) / 100)).toFixed(2));
        return next;
      });
      return { ...current, lineItems: nextLineItems };
    });
  };

  const createInvoice = async (event) => {
    event.preventDefault();
    if (!form.lineItems[0]?.description) {
      toast.error("Add at least one billable line item");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await billingService.create({
        patientId: form.patientId,
        doctorId: form.doctorId || undefined,
        appointmentId: form.appointmentId || undefined,
        serviceDescription: form.lineItems.map((item) => item.description).join(", "),
        amount: currentTotals.subtotal,
        tax: currentTotals.taxAmount,
        discount: currentTotals.discountAmount,
        totalAmount: currentTotals.total,
        paymentStatus: form.status === "Paid" ? "Paid" : form.status === "Partially Paid" ? "Partially Paid" : "Pending",
        paymentMethod: form.paymentMethod,
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
      });
      saveInvoiceMeta(created._id, {
        status: form.status,
        paidAmount: form.status === "Paid" ? currentTotals.total : form.status === "Partially Paid" ? currentTotals.total / 2 : 0,
        lineItems: form.lineItems,
      });
      saveInvoiceNotification(created, user);
      toast.success("Invoice created");
      setForm({ patientId: patients[0]?._id || "", doctorId: doctors[0]?._id || "", appointmentId: "", paymentMethod: "Cash", status: "Draft", lineItems: [newLineItem()] });
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card title={copy.monthRevenue}><p className="text-3xl font-semibold">{formatCurrency(dashboardStats.monthRevenue)}</p></Card>
        <Card title={copy.yearRevenue}><p className="text-3xl font-semibold">{formatCurrency(dashboardStats.yearRevenue)}</p></Card>
        <Card title={copy.outstanding}><p className="text-3xl font-semibold">{formatCurrency(dashboardStats.outstanding)}</p></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card title={copy.createTitle} subtitle={copy.createSubtitle}>
          {canCreate ? (
            <form className="space-y-4" onSubmit={createInvoice}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">Patient</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}>
                    {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.firstName} {patient.lastName}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">Doctor</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.doctorId} onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}>
                    {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">Appointment</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.appointmentId} onChange={(event) => setForm((current) => ({ ...current, appointmentId: event.target.value }))}>
                    <option value="">Select appointment</option>
                    {appointments.map((appointment) => <option key={appointment._id} value={appointment._id}>{new Date(appointment.appointmentDate).toLocaleDateString("en-IN")} • {appointment.appointmentTime}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-2 block text-[var(--field-label)]">Payment Method</span>
                  <select className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4" value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}>
                    {paymentMethods.map((method) => <option key={method}>{method}</option>)}
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                {form.lineItems.map((item, index) => (
                  <div key={`line-item-${index}`} className="grid gap-3 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 md:grid-cols-6">
                    <InputField label="Description" value={item.description} onChange={(event) => updateLineItem(index, "description", event.target.value)} />
                    <InputField label="Qty" type="number" value={item.quantity} onChange={(event) => updateLineItem(index, "quantity", event.target.value)} />
                    <InputField label="Unit Price" type="number" value={item.unitPrice} onChange={(event) => updateLineItem(index, "unitPrice", event.target.value)} />
                    <InputField label="Discount %" type="number" value={item.discount} onChange={(event) => updateLineItem(index, "discount", event.target.value)} />
                    <InputField label="Tax %" type="number" value={item.tax} onChange={(event) => updateLineItem(index, "tax", event.target.value)} />
                    <InputField label="Subtotal" type="number" value={item.subtotal} onChange={() => {}} />
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, lineItems: [...current.lineItems, newLineItem()] }))}>
                  Add line item
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-[24px] bg-[var(--panel-muted)] p-4"><p className="text-sm text-[var(--text-muted)]">Subtotal</p><p className="mt-2 font-semibold">{formatCurrency(currentTotals.subtotal)}</p></div>
                <div className="rounded-[24px] bg-[var(--panel-muted)] p-4"><p className="text-sm text-[var(--text-muted)]">Discounts</p><p className="mt-2 font-semibold">{formatCurrency(currentTotals.discountAmount)}</p></div>
                <div className="rounded-[24px] bg-[var(--panel-muted)] p-4"><p className="text-sm text-[var(--text-muted)]">Taxes</p><p className="mt-2 font-semibold">{formatCurrency(currentTotals.taxAmount)}</p></div>
                <div className="rounded-[24px] bg-[var(--panel-muted)] p-4"><p className="text-sm text-[var(--text-muted)]">Grand Total</p><p className="mt-2 font-semibold">{formatCurrency(currentTotals.total)}</p></div>
              </div>

              <div className="flex flex-wrap gap-2">
                {invoiceStatuses.map((status) => (
                  <button key={status} type="button" onClick={() => setForm((current) => ({ ...current, status }))} className={`rounded-full px-4 py-2 text-sm ${form.status === status ? "bg-brand-500/12 text-brand-700" : "bg-[var(--panel-muted)] text-[var(--text-muted)]"}`}>
                    {status}
                  </button>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving invoice..." : "Create Invoice"}
              </Button>
            </form>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border-color)] bg-[var(--panel-muted)] p-6 text-sm text-[var(--text-muted)]">
              Invoice creation is available to receptionist and super admin roles.
            </div>
          )}
        </Card>

        <Card title={copy.departmentRevenue} subtitle="Live billing totals grouped by doctor department">
          {revenueByDepartment.length ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByDepartment} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                    {revenueByDepartment.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No department revenue yet" description="Department billing will appear after invoices are created." />
          )}
          <div className="mt-4 space-y-2">
            {revenueByDepartment.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-[var(--panel-muted)] px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                </div>
                <span>{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card title={copy.listTitle} subtitle={copy.listSubtitle}>
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <select className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {invoiceStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.doctorId} onChange={(event) => setFilters((current) => ({ ...current, doctorId: event.target.value }))}>
            <option value="">All doctors</option>
            {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName}</option>)}
          </select>
          <select className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.paymentMethod} onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}>
            <option value="">All methods</option>
            {paymentMethods.map((method) => <option key={method}>{method}</option>)}
          </select>
          <input type="date" className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          <input type="date" className="min-h-[44px] rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 text-sm" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
        </div>

        {isLoading ? (
          <div className="min-h-[240px]" />
        ) : filteredItems.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                  <th className="py-3 pr-4">Invoice #</th>
                  <th className="py-3 pr-4">Patient</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Paid Amount</th>
                  <th className="py-3 pr-4">Balance</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((invoice) => (
                  <tr key={invoice._id} className="border-b border-[var(--border-color)]/70">
                    <td className="py-3 pr-4">{invoice.invoiceNumber || invoice._id.slice(-6)}</td>
                    <td className="py-3 pr-4">{invoice.patientName}</td>
                    <td className="py-3 pr-4">{invoice.createdAtLabel}</td>
                    <td className="py-3 pr-4">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="py-3 pr-4">{formatCurrency(invoice.paidAmount)}</td>
                    <td className="py-3 pr-4">{formatCurrency(invoice.balance)}</td>
                    <td className="py-3 pr-4"><Badge variant={invoice.status === "Paid" ? "success" : invoice.status === "Overdue" || invoice.status === "Cancelled" ? "danger" : "warning"}>{invoice.status}</Badge></td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={() => printInvoice(invoice)}><HiOutlinePrinter className="mr-2 text-base" />Print</Button>
                        <Button type="button" variant="secondary" onClick={() => printInvoice(invoice)}><HiOutlineArrowDownTray className="mr-2 text-base" />PDF</Button>
                        <Button type="button" variant="secondary" onClick={() => { toast.success(`Invoice queued to ${invoice.patientId?.email || "patient email"}`); }}><HiOutlineEnvelope className="mr-2 text-base" />Email</Button>
                        <Button type="button" onClick={() => setSelectedInvoice(invoice)}>View</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No invoices found" description="Create a bill to populate the invoice list." />
        )}
      </Card>

      <Card title={copy.transactions} subtitle="Latest invoice records from the backend">
        <div className="space-y-3">
          {decoratedItems.slice(0, 6).map((invoice) => (
            <div key={invoice._id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
              <div>
                <p className="font-medium">{invoice.patientName}</p>
                <p className="text-sm text-[var(--text-muted)]">{invoice.invoiceNumber} • {invoice.paymentMethod || "Method pending"}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                <p className="text-sm text-[var(--text-muted)]">{invoice.createdAtLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={Boolean(selectedInvoice)} onClose={() => setSelectedInvoice(null)} title="Invoice Detail" description="Printable invoice preview" size="lg">
        {selectedInvoice ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Patient</p>
                <p className="mt-2 font-semibold">{selectedInvoice.patientName}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedInvoice.patientId?.email || "No email on file"}</p>
              </div>
              <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Doctor</p>
                <p className="mt-2 font-semibold">{selectedInvoice.doctorName || "Unassigned"}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedInvoice.paymentMethod || "Payment method pending"}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 pr-4">Qty</th>
                    <th className="py-3 pr-4">Unit Price</th>
                    <th className="py-3 pr-4">Discount%</th>
                    <th className="py-3 pr-4">Tax%</th>
                    <th className="py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lineItems.map((item, index) => (
                    <tr key={`invoice-line-${index}`} className="border-b border-[var(--border-color)]/70">
                      <td className="py-3 pr-4">{item.description}</td>
                      <td className="py-3 pr-4">{item.quantity}</td>
                      <td className="py-3 pr-4">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 pr-4">{item.discount}</td>
                      <td className="py-3 pr-4">{item.tax}</td>
                      <td className="py-3">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default BillingPage;
