export function printPrescription({ hospital, doctor, patient, prescription, diagnosis }) {
  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) {
    return false;
  }

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  popup.document.write(`
    <html>
      <head>
        <title>Prescription</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; }
          .header, .footer { border-bottom: 2px solid #1abc9c; padding-bottom: 14px; margin-bottom: 18px; }
          .footer { border-top: 1px solid #cbd5e1; border-bottom: 0; padding-top: 12px; margin-top: 24px; font-size: 12px; color: #475569; }
          .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; margin-bottom: 18px; }
          .card { border:1px solid #dbe4ea; border-radius:16px; padding:16px; }
          .badge { background:#ecfeff; color:#0f766e; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; }
          table { width:100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #dbe4ea; padding: 10px; text-align: left; font-size: 13px; }
          th { background: #f0fdfa; color: #0f766e; }
          .signature { height:70px; border-bottom:1px solid #94a3b8; width:220px; margin-top:24px; }
          p,h1,h2 { margin:0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;">
            <div>
              <h1>${hospital.name}</h1>
              <p>${hospital.address}</p>
              <p>${hospital.contact}</p>
            </div>
            <div class="badge">Prescription</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h2>Doctor Details</h2>
            <p><strong>${doctor.name}</strong></p>
            <p>${doctor.qualifications || "-"}</p>
            <p>Reg. No: ${doctor.registrationNumber || doctor.licenseNumber || "-"}</p>
            <p>Department: ${doctor.specialization || "-"}</p>
          </div>
          <div class="card">
            <h2>Patient Details</h2>
            <p><strong>${patient.name}</strong></p>
            <p>Patient ID: ${patient.patientCode || patient.id || "-"}</p>
            <p>Age/Gender: ${patient.age || "-"} / ${patient.gender || "-"}</p>
            <p>Date: ${formatDate(prescription.date)}</p>
          </div>
        </div>

        <div class="card">
          <h2>Diagnosis</h2>
          <p>${diagnosis?.diseaseName || "-"}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sr#</th>
              <th>Medicine Name</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${prescription.medicines
              .map(
                (medicine, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${medicine.name}</td>
                    <td>${medicine.dose}</td>
                    <td>${medicine.frequency}</td>
                    <td>${medicine.duration}</td>
                    <td>${medicine.instructions || "-"}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>

        <div class="card" style="margin-top:18px;">
          <h2>Advice / Notes</h2>
          <p>${prescription.notes || "Continue treatment as advised."}</p>
        </div>

        <div class="signature"></div>
        <p style="margin-top:8px;">Doctor signature</p>

        <div class="footer">
          ${hospital.name} | ${hospital.contact}
        </div>
      </body>
    </html>
  `);

  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
