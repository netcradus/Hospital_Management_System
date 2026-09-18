import { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineCheckCircle, HiOutlineCreditCard, HiOutlinePrinter, HiOutlineQrCode, HiOutlineWallet } from "react-icons/hi2";
import { toast } from "sonner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";
import { printInvoiceDocument } from "../../utils/invoicePrinter";

function formatCurrency(val) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val || 0));
}

function formatDate(val) {
  return val ? new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

export default function PatientBillingPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "es";

  const copy = isEs
    ? {
        title: "Mis Facturas y Pagos",
        subtitle: "Consulte sus facturas médicas y realice pagos en línea de forma segura.",
        totalDue: "Monto Pendiente Total",
        totalInvoices: "Total de Facturas",
        paidInvoices: "Facturas Pagadas",
        payNow: "Pagar Ahora",
        download: "Descargar Factura",
        status: "Estado de Pago",
        amountDue: "Monto Pendiente",
        amountPaid: "Monto Pagado",
        totalAmount: "Monto Total",
      }
    : {
        title: "My Invoices & Billing",
        subtitle: "View your medical bills, payment history, and make secure online payments.",
        totalDue: "Total Outstanding Due",
        totalInvoices: "Total Invoices",
        paidInvoices: "Paid Invoices",
        payNow: "Pay Now",
        download: "Download Invoice",
        status: "Payment Status",
        amountDue: "Amount Due",
        amountPaid: "Amount Paid",
        totalAmount: "Total Amount",
      };

  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Card"); // "Card" | "UPI" | "Wallet"
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8921");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("889");
  const [cardName, setCardName] = useState(user?.name || "Patient Account");

  // UPI Form State
  const [upiId, setUpiId] = useState(`${String(user?.email || "patient").split("@")[0]}@upi`);

  // Wallet Form State
  const [selectedWallet, setSelectedWallet] = useState("Paytm");

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/billing", { params: { limit: 200 } });
      const items = res.data?.data?.items || res.data?.data || [];
      setInvoices(items);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const decoratedInvoices = useMemo(() => {
    return invoices.map((inv) => {
      const total = Number(inv.totalAmount || inv.amount || 0);
      const paid = Number(inv.amountPaid !== undefined ? inv.amountPaid : (inv.paymentStatus === "Paid" ? total : 0));
      const due = Math.max(0, total - paid);
      const doctorName = inv.doctorId ? `${inv.doctorId.firstName || ""} ${inv.doctorId.lastName || ""}`.trim() : "Doctor";
      const departmentName = inv.department || inv.doctorId?.departmentId?.name || "General Medicine";
      const apptCode = inv.appointmentId?.appointmentId || inv.appointmentId?._id || "N/A";
      const status = due === 0 || inv.paymentStatus === "Paid" ? "Paid" : paid > 0 ? "Partially Paid" : "Pending";

      return {
        ...inv,
        total,
        paid,
        due,
        doctorName,
        departmentName,
        apptCode,
        computedStatus: status,
      };
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return decoratedInvoices.filter((inv) => {
      const matchesSearch =
        !search ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
        (inv.doctorName && inv.doctorName.toLowerCase().includes(search.toLowerCase())) ||
        (inv.serviceDescription && inv.serviceDescription.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" && inv.due > 0) ||
        (statusFilter === "PAID" && inv.due === 0);

      return matchesSearch && matchesStatus;
    });
  }, [decoratedInvoices, search, statusFilter]);

  const totalOutstanding = useMemo(() => {
    return decoratedInvoices.reduce((sum, item) => sum + item.due, 0);
  }, [decoratedInvoices]);

  const paidCount = useMemo(() => {
    return decoratedInvoices.filter((item) => item.due === 0).length;
  }, [decoratedInvoices]);

  const handleOpenPayModal = (invoice) => {
    setPayingInvoice(invoice);
    setPaymentMethod("Card");
    setCompletedPayment(null);
  };

  const handleConfirmPayment = async () => {
    if (!payingInvoice) return;
    setIsProcessing(true);

    try {
      const res = await api.post(`/billing/${payingInvoice._id}/pay`, {
        paymentMethod,
      });

      const updatedDoc = res.data?.data;
      toast.success(`Payment of ${formatCurrency(payingInvoice.due)} processed successfully!`);
      setCompletedPayment(updatedDoc || payingInvoice);
      await loadInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Billing"
        title={copy.title}
        description={copy.subtitle}
      />

      {/* Summary Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={HiOutlineCreditCard}
          label={copy.totalDue}
          value={formatCurrency(totalOutstanding)}
          helper={totalOutstanding > 0 ? "Outstanding amount due" : "All invoices settled"}
          isLoading={isLoading}
        />
        <StatCard
          icon={HiOutlinePrinter}
          label={copy.totalInvoices}
          value={decoratedInvoices.length}
          helper="Total billed consultations"
          isLoading={isLoading}
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label={copy.paidInvoices}
          value={paidCount}
          helper="Successfully paid"
          isLoading={isLoading}
        />
      </section>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4">
        <div className="w-full sm:w-72">
          <InputField
            placeholder="Search by invoice # or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={statusFilter === "ALL" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
          >
            All Invoices
          </Button>
          <Button
            type="button"
            variant={statusFilter === "PENDING" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("PENDING")}
          >
            Pending ({decoratedInvoices.filter((i) => i.due > 0).length})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "PAID" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("PAID")}
          >
            Paid ({paidCount})
          </Button>
        </div>
      </div>

      {/* Invoices List / Grid */}
      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border-color)] p-8 text-center text-sm text-[var(--text-muted)]">
          Loading your invoices...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <EmptyState
            title="No invoices found"
            description={search ? "No invoice matches your search criteria." : "You have no medical invoices on record."}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredInvoices.map((inv) => (
            <div
              key={inv._id}
              className="flex flex-col justify-between rounded-3xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-brand-600">
                      {inv.invoiceNumber || inv._id.slice(-6)}
                    </span>
                    <Badge variant="info">{inv.departmentName}</Badge>
                  </div>
                  <Badge variant={inv.computedStatus === "Paid" ? "success" : inv.computedStatus === "Partially Paid" ? "warning" : "danger"}>
                    {inv.computedStatus}
                  </Badge>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-base font-bold text-[var(--text-primary)]">
                    Dr. {inv.doctorName}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Service: <span className="font-medium text-[var(--text-primary)]">{inv.serviceDescription}</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Appointment ID: <strong className="font-mono text-[var(--text-primary)]">{inv.apptCode}</strong></span>
                    <span>Date: <strong className="text-[var(--text-primary)]">{formatDate(inv.createdAt)}</strong></span>
                  </div>
                </div>

                {/* Billing Summary Box */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[var(--panel-muted)] p-3 text-center text-xs">
                  <div>
                    <span className="block text-[var(--text-muted)]">Total</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(inv.total)}</span>
                  </div>
                  <div>
                    <span className="block text-[var(--text-muted)]">Paid</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(inv.paid)}</span>
                  </div>
                  <div>
                    <span className="block text-[var(--text-muted)]">Due</span>
                    <span className={`font-bold ${inv.due > 0 ? "text-rose-600" : "text-[var(--text-muted)]"}`}>
                      {formatCurrency(inv.due)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--border-color)]/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => printInvoiceDocument(inv)}
                >
                  <HiOutlineArrowDownTray className="mr-1.5 text-base" />
                  {copy.download}
                </Button>

                {inv.due > 0 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenPayModal(inv)}
                  >
                    <HiOutlineCreditCard className="mr-1.5 text-base" />
                    {copy.payNow} ({formatCurrency(inv.due)})
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {payingInvoice ? (
        <Modal
          isOpen={Boolean(payingInvoice)}
          onClose={() => {
            if (!isProcessing) {
              setPayingInvoice(null);
              setCompletedPayment(null);
            }
          }}
          title={completedPayment ? "Payment Successful" : "Complete Secure Payment"}
        >
          {completedPayment ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <HiOutlineCheckCircle className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Payment Successful!</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Your payment for invoice <strong className="font-mono text-brand-600">{completedPayment.invoiceNumber || payingInvoice.invoiceNumber}</strong> has been received.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Transaction ID:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{completedPayment.transactionId || "TXN-SUCCESS"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Payment Method:</span>
                  <span className="font-semibold">{completedPayment.paymentMethod || paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(payingInvoice.due)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Status:</span>
                  <Badge variant="success">Paid</Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => printInvoiceDocument(completedPayment)}
                >
                  <HiOutlineArrowDownTray className="mr-2 text-base" />
                  Download Invoice
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setPayingInvoice(null);
                    setCompletedPayment(null);
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Payment Summary Box */}
              <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-r from-[rgba(26,188,156,0.1)] to-[rgba(41,128,232,0.08)] p-4">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Invoice: <strong className="font-mono text-[var(--text-primary)]">{payingInvoice.invoiceNumber || payingInvoice._id.slice(-6)}</strong></span>
                  <span>Doctor: <strong className="text-[var(--text-primary)]">Dr. {payingInvoice.doctorName}</strong></span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-color)]/60 pt-3">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Amount Due (Read-Only):</span>
                  <span className="text-xl font-extrabold text-rose-600">{formatCurrency(payingInvoice.due)}</span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Card")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-xs transition-all ${
                      paymentMethod === "Card"
                        ? "border-brand-600 bg-brand-500/10 text-brand-700 font-bold ring-2 ring-brand-500"
                        : "border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-muted)] hover:bg-[var(--panel-muted)]"
                    }`}
                  >
                    <HiOutlineCreditCard className="mb-1 text-lg" />
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-xs transition-all ${
                      paymentMethod === "UPI"
                        ? "border-brand-600 bg-brand-500/10 text-brand-700 font-bold ring-2 ring-brand-500"
                        : "border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-muted)] hover:bg-[var(--panel-muted)]"
                    }`}
                  >
                    <HiOutlineQrCode className="mb-1 text-lg" />
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Wallet")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-xs transition-all ${
                      paymentMethod === "Wallet"
                        ? "border-brand-600 bg-brand-500/10 text-brand-700 font-bold ring-2 ring-brand-500"
                        : "border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-muted)] hover:bg-[var(--panel-muted)]"
                    }`}
                  >
                    <HiOutlineWallet className="mb-1 text-lg" />
                    Wallet
                  </button>
                </div>
              </div>

              {/* Dynamic Input Fields based on Method */}
              {paymentMethod === "Card" && (
                <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <InputField
                    label="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 8921"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Expiry Date"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                    />
                    <InputField
                      label="CVV"
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                    />
                  </div>
                  <InputField
                    label="Cardholder Name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
              )}

              {paymentMethod === "UPI" && (
                <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <InputField
                    label="UPI ID / VPA"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@upi or mobile@paytm"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["Google Pay", "PhonePe", "Paytm", "BHIM UPI"].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setUpiId(`${String(user?.email || "patient").split("@")[0]}@${app.toLowerCase().replace(/\s+/g, "")}`)}
                        className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-3 py-1 text-xs text-[var(--text-muted)] hover:border-brand-500 hover:text-brand-600"
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === "Wallet" && (
                <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] p-4">
                  <label className="block text-xs font-medium text-[var(--field-label)]">Select Wallet Provider</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Paytm Wallet", "PhonePe Wallet", "Amazon Pay", "Mobikwik"].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWallet(w)}
                        className={`rounded-2xl border p-3 text-xs text-center transition-all ${
                          selectedWallet === w
                            ? "border-brand-600 bg-brand-50 font-bold text-brand-700"
                            : "border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-muted)]"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Pay Button */}
              <Button
                type="button"
                variant="primary"
                className="w-full py-3 text-base font-bold"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
              >
                {isProcessing ? "Processing Secure Payment..." : `Pay ${formatCurrency(payingInvoice.due)}`}
              </Button>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
