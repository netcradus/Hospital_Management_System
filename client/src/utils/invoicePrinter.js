export function printInvoiceDocument(invoice) {
  const popup = window.open("", "_blank", "width=960,height=780");
  if (!popup) {
    alert("Please allow popups to download/print the invoice");
    return;
  }

  const patientName =
    invoice.patientName ||
    (invoice.patientId ? `${invoice.patientId.firstName || ""} ${invoice.patientId.lastName || ""}`.trim() : "Patient");
  const doctorName =
    invoice.doctorName ||
    (invoice.doctorId ? `${invoice.doctorId.firstName || ""} ${invoice.doctorId.lastName || ""}`.trim() : "Doctor");
  const deptName = invoice.department || invoice.doctorId?.departmentId?.name || "General Medicine";
  const apptId = invoice.appointmentId?.appointmentId || invoice.appointmentId?._id || invoice.appointmentId || "N/A";
  const invNum = invoice.invoiceNumber || invoice._id || "INV-0001";
  const invDate =
    invoice.createdAtLabel ||
    (invoice.createdAt
      ? new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-IN"));
  const total = Number(invoice.totalAmount || invoice.amount || 0);
  const paid = Number(invoice.amountPaid !== undefined ? invoice.amountPaid : invoice.paymentStatus === "Paid" ? total : 0);
  const due = Math.max(0, total - paid);
  const status = invoice.paymentStatus || invoice.status || "Pending";
  const txnId = invoice.transactionId || "N/A";
  const payMethod = invoice.paymentMethod || "N/A";

  const items =
    Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0
      ? invoice.lineItems
      : [
          {
            description: invoice.serviceDescription || "Consultation & Hospital Services",
            quantity: 1,
            unitPrice: invoice.amount || total,
            subtotal: total,
          },
        ];

  popup.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${invNum}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 32px; color: #1e293b; background: #fff; }
          .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 24px; }
          .brand h1 { margin: 0; color: #0f766e; font-size: 26px; }
          .brand p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
          .inv-title { text-align: right; }
          .inv-title h2 { margin: 0; font-size: 22px; color: #0f172a; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 6px; }
          .status-Paid { background: #dcfce7; color: #15803d; }
          .status-Pending { background: #fef3c7; color: #b45309; }
          .status-Partially { background: #e0f2fe; color: #0369a1; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; }
          .meta-item label { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .meta-item span { font-size: 14px; font-weight: 600; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #475569; }
          td { border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 13px; }
          .totals-section { margin-top: 24px; float: right; width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals-row.grand { border-top: 2px solid #0f766e; font-size: 16px; font-weight: 700; color: #0f766e; padding-top: 10px; margin-top: 6px; }
          .footer { margin-top: 48px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 12px; }
          @media print { body { padding: 0; } .invoice-card { border: none; box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <div class="brand">
              <h1>MEDICare HMS</h1>
              <p>17 Care Avenue, Kolkata, West Bengal</p>
              <p>Phone: +91 33 4000 2244 | Email: billing@medicare-hms.demo</p>
            </div>
            <div class="inv-title">
              <h2>INVOICE</h2>
              <p style="font-family: monospace; font-weight: bold; margin-top: 4px;">${invNum}</p>
              <div class="status-badge status-${status.split(" ")[0]}">${status}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <label>Patient Name</label>
              <span>${patientName}</span>
            </div>
            <div class="meta-item">
              <label>Doctor / Dept</label>
              <span>Dr. ${doctorName} (${deptName})</span>
            </div>
            <div class="meta-item">
              <label>Appointment ID</label>
              <span>${apptId}</span>
            </div>
            <div class="meta-item">
              <label>Invoice Date</label>
              <span>${invDate}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Service Description</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (it) => `
                <tr>
                  <td>${it.description}</td>
                  <td style="text-align: right;">₹${Number(it.subtotal || it.unitPrice || total).toLocaleString("en-IN")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div style="overflow: hidden;">
            <div class="totals-section">
              <div class="totals-row">
                <span>Total Amount:</span>
                <span>₹${total.toLocaleString("en-IN")}</span>
              </div>
              <div class="totals-row">
                <span>Amount Paid:</span>
                <span style="color: #16a34a; font-weight: 600;">₹${paid.toLocaleString("en-IN")}</span>
              </div>
              <div class="totals-row">
                <span>Amount Due:</span>
                <span style="color: #dc2626; font-weight: 600;">₹${due.toLocaleString("en-IN")}</span>
              </div>
              <div class="totals-row grand">
                <span>Total Payable:</span>
                <span>₹${due.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          ${
            txnId !== "N/A" || payMethod !== "N/A"
              ? `
            <div style="margin-top: 24px; padding: 12px; background: #f0fdf4; border-radius: 8px; font-size: 12px; color: #166534;">
              <strong>Payment Method:</strong> ${payMethod} &nbsp;|&nbsp; <strong>Transaction ID:</strong> ${txnId}
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>Thank you for choosing MEDICare HMS. Computer generated invoice.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  popup.document.close();
}
