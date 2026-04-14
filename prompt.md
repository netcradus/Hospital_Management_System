# Hospital Management System - Detailed Project Specification

## PROJECT OVERVIEW
Build a comprehensive Hospital Management System using modern web technologies. The system will manage patients, doctors, appointments, billing, and administrative operations with a clean, intuitive UI and secure backend architecture.

---

## TECHNOLOGY STACK

### Frontend
- **Framework:** React 18+ with Vite (build tool)
- **Styling:** Tailwind CSS
- **State Management:** React Context API or Redux Toolkit (recommended)
- **HTTP Client:** Axios
- **Routing:** React Router v6+
- **UI Components:** Headless UI / Radix UI (optional enhancement)
- **Form Handling:** React Hook Form
- **Validation:** Zod or Yup
- **Date Handling:** react-big-calendar or date-fns
- **Charts & Analytics:** Recharts or Chart.js
- **Icons:** React Icons or Heroicons
- **Notifications:** React Toastify or Sonner

### Backend
- **Runtime:** Node.js (v16+)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Bcryptjs
- **Environment Variables:** dotenv
- **Logging:** Morgan or Winston
- **Validation:** Joi or express-validator
- **Email Service:** Nodemailer or SendGrid (for notifications)
- **File Upload:** Multer
- **CORS:** cors package
- **Rate Limiting:** express-rate-limit

---

## FOLDER STRUCTURE

### Project Root
```
hospital-management-system/
├── client/                          # Frontend (React + Vite)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   └── Alert.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   ├── ForgotPasswordForm.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── patient/
│   │   │   │   ├── PatientForm.jsx
│   │   │   │   ├── PatientList.jsx
│   │   │   │   ├── PatientDetail.jsx
│   │   │   │   ├── PatientCard.jsx
│   │   │   │   └── PatientSearch.jsx
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorForm.jsx
│   │   │   │   ├── DoctorList.jsx
│   │   │   │   ├── DoctorDetail.jsx
│   │   │   │   ├── DoctorCard.jsx
│   │   │   │   └── DoctorSchedule.jsx
│   │   │   ├── appointment/
│   │   │   │   ├── AppointmentForm.jsx
│   │   │   │   ├── AppointmentList.jsx
│   │   │   │   ├── AppointmentDetail.jsx
│   │   │   │   ├── AppointmentCalendar.jsx
│   │   │   │   └── AppointmentCard.jsx
│   │   │   ├── billing/
│   │   │   │   ├── BillingForm.jsx
│   │   │   │   ├── BillingList.jsx
│   │   │   │   ├── BillingDetail.jsx
│   │   │   │   ├── InvoiceGenerator.jsx
│   │   │   │   ├── PaymentForm.jsx
│   │   │   │   └── InvoicePrint.jsx
│   │   │   ├── department/
│   │   │   │   ├── DepartmentForm.jsx
│   │   │   │   ├── DepartmentList.jsx
│   │   │   │   └── DepartmentDetail.jsx
│   │   │   ├── staff/
│   │   │   │   ├── StaffForm.jsx
│   │   │   │   ├── StaffList.jsx
│   │   │   │   └── StaffDetail.jsx
│   │   │   └── dashboard/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── DoctorDashboard.jsx
│   │   │       ├── PatientDashboard.jsx
│   │   │       ├── StatsCard.jsx
│   │   │       └── Charts.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   ├── PatientContext.js
│   │   │   ├── AppointmentContext.js
│   │   │   ├── BillingContext.js
│   │   │   └── NotificationContext.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useFetch.js
│   │   │   ├── useForm.js
│   │   │   ├── useNotification.js
│   │   │   └── useLocalStorage.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   └── ForgotPasswordPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── AdminDashboardPage.jsx
│   │   │   │   ├── DoctorDashboardPage.jsx
│   │   │   │   └── PatientDashboardPage.jsx
│   │   │   ├── patient/
│   │   │   │   ├── PatientsPage.jsx
│   │   │   │   ├── AddPatientPage.jsx
│   │   │   │   ├── EditPatientPage.jsx
│   │   │   │   └── PatientDetailPage.jsx
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorsPage.jsx
│   │   │   │   ├── AddDoctorPage.jsx
│   │   │   │   ├── EditDoctorPage.jsx
│   │   │   │   └── DoctorDetailPage.jsx
│   │   │   ├── appointment/
│   │   │   │   ├── AppointmentsPage.jsx
│   │   │   │   ├── BookAppointmentPage.jsx
│   │   │   │   ├── EditAppointmentPage.jsx
│   │   │   │   └── MyAppointmentsPage.jsx
│   │   │   ├── billing/
│   │   │   │   ├── BillingPage.jsx
│   │   │   │   ├── CreateBillingPage.jsx
│   │   │   │   ├── InvoicesPage.jsx
│   │   │   │   └── PaymentPage.jsx
│   │   │   ├── department/
│   │   │   │   ├── DepartmentsPage.jsx
│   │   │   │   ├── AddDepartmentPage.jsx
│   │   │   │   └── EditDepartmentPage.jsx
│   │   │   ├── staff/
│   │   │   │   ├── StaffPage.jsx
│   │   │   │   ├── AddStaffPage.jsx
│   │   │   │   └── EditStaffPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   └── UnauthorizedPage.jsx
│   │   ├── services/
│   │   │   ├── api.js                # Axios instance configuration
│   │   │   ├── authService.js
│   │   │   ├── patientService.js
│   │   │   ├── doctorService.js
│   │   │   ├── appointmentService.js
│   │   │   ├── billingService.js
│   │   │   ├── departmentService.js
│   │   │   ├── staffService.js
│   │   │   └── dashboardService.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── tailwind.config.js    # Tailwind configuration
│   │   │   └── index.css
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── formatters.js         # Date, currency, phone formatters
│   │   │   ├── validators.js
│   │   │   ├── helpers.js
│   │   │   ├── dateUtils.js
│   │   │   └── localStorage.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── .env.local                    # Local environment variables (gitignored)
│   ├── .gitignore
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── README.md
│
└── server/                           # Backend (Node.js + Express)
    ├── config/
    │   ├── database.js               # MongoDB connection
    │   ├── jwt.js
    │   └── constants.js
    ├── controllers/
    │   ├── authController.js         # Login, Register, Logout
    │   ├── patientController.js      # CRUD operations
    │   ├── doctorController.js
    │   ├── appointmentController.js
    │   ├── billingController.js
    │   ├── departmentController.js
    │   ├── staffController.js
    │   ├── dashboardController.js
    │   └── reportController.js
    ├── middleware/
    │   ├── authMiddleware.js         # JWT verification
    │   ├── roleMiddleware.js         # Role-based access control
    │   ├── errorHandler.js
    │   ├── validationMiddleware.js
    │   ├── corsMiddleware.js
    │   └── requestLogger.js
    ├── models/
    │   ├── User.js                   # Base user model
    │   ├── Patient.js
    │   ├── Doctor.js
    │   ├── Appointment.js
    │   ├── Billing.js
    │   ├── Invoice.js
    │   ├── Department.js
    │   ├── Staff.js
    │   ├── MedicalRecord.js
    │   └── Prescription.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── patientRoutes.js
    │   ├── doctorRoutes.js
    │   ├── appointmentRoutes.js
    │   ├── billingRoutes.js
    │   ├── departmentRoutes.js
    │   ├── staffRoutes.js
    │   ├── dashboardRoutes.js
    │   └── index.js                  # Main router
    ├── services/
    │   ├── authService.js            # Business logic
    │   ├── patientService.js
    │   ├── doctorService.js
    │   ├── appointmentService.js
    │   ├── billingService.js
    │   ├── emailService.js           # Email notifications
    │   ├── pdfService.js             # Invoice PDF generation
    │   └── reportService.js
    ├── utils/
    │   ├── validators.js
    │   ├── errorHandler.js
    │   ├── responseHandler.js
    │   ├── emailTemplates.js
    │   ├── dateUtils.js
    │   └── fileUpload.js
    ├── uploads/                       # Store uploaded files
    │   ├── documents/
    │   ├── prescriptions/
    │   └── reports/
    ├── .env.example
    ├── .env.local                    # Local environment variables (gitignored)
    ├── .gitignore
    ├── server.js                     # Main entry point
    ├── package.json
    └── README.md
```

---

## CORE FEATURES & MODULES

### 1. AUTHENTICATION MODULE
**Endpoints:**
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- POST `/api/auth/refresh-token` - Refresh JWT token
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password

**Features:**
- Role-based registration (Admin, Doctor, Patient, Staff)
- Secure JWT token generation
- Password hashing with bcrypt
- Email verification (optional)
- Refresh token mechanism
- Account lock after failed attempts

**User Roles:**
- Admin (full system access)
- Doctor (manage appointments, prescriptions)
- Patient (view appointments, medical records)
- Staff/Receptionist (manage appointments, patient data)

---

### 2. PATIENT MANAGEMENT MODULE
**Endpoints:**
- GET `/api/patients` - List all patients (with pagination, filters)
- POST `/api/patients` - Create new patient
- GET `/api/patients/:id` - Get patient details
- PUT `/api/patients/:id` - Update patient information
- DELETE `/api/patients/:id` - Delete patient record
- GET `/api/patients/:id/medical-history` - Retrieve medical history

**Features:**
- Patient profile (name, DOB, contact, address, emergency contact)
- Medical history tracking
- Allergies and medications list
- Insurance information storage
- Document/report uploads
- Search and filter functionality (by name, ID, phone, email)
- Patient demographics analytics

**Database Fields:**
- Full Name, Email, Phone, DOB
- Address, City, State, Zip Code
- Gender, Blood Type
- Medical History, Allergies, Current Medications
- Emergency Contact Details
- Insurance Provider, Policy Number
- Profile Photo
- Status (Active, Inactive)

---

### 3. DOCTOR MANAGEMENT MODULE
**Endpoints:**
- GET `/api/doctors` - List all doctors
- POST `/api/doctors` - Add new doctor
- GET `/api/doctors/:id` - Get doctor profile
- PUT `/api/doctors/:id` - Update doctor information
- DELETE `/api/doctors/:id` - Delete doctor
- GET `/api/doctors/:id/availability` - Get doctor's availability
- PUT `/api/doctors/:id/availability` - Set doctor availability

**Features:**
- Doctor profile management
- Specialization/Department assignment
- Qualification and license verification
- Work schedule/availability management
- Experience and certifications tracking
- Consultation fees
- Patient reviews/ratings

**Database Fields:**
- Full Name, Email, Phone, License Number
- Specialization, Qualifications
- Experience (Years)
- Department
- Consultation Fee
- Working Hours
- Availability Slots
- Status (Active, Inactive)

---

### 4. APPOINTMENT SYSTEM MODULE
**Endpoints:**
- GET `/api/appointments` - List appointments (with filters)
- POST `/api/appointments` - Book new appointment
- GET `/api/appointments/:id` - Get appointment details
- PUT `/api/appointments/:id` - Update appointment
- DELETE `/api/appointments/:id` - Cancel appointment
- GET `/api/appointments/doctor/:doctorId/available-slots` - Get available time slots
- PUT `/api/appointments/:id/status` - Update appointment status
- GET `/api/appointments/patient/:patientId` - Get patient's appointments

**Features:**
- Real-time appointment booking
- Doctor availability calendar view
- Time slot management
- Appointment status tracking (Scheduled, Completed, Cancelled, Rescheduled)
- Automated email/SMS notifications
- Reminder system
- Conflict prevention (no double booking)
- Appointment history

**Database Fields:**
- Patient ID, Doctor ID
- Appointment Date, Time, Duration
- Reason for Visit, Notes
- Status (Scheduled, In-Progress, Completed, Cancelled)
- Created/Updated Timestamps

---

### 5. BILLING & INVOICING MODULE
**Endpoints:**
- GET `/api/billing` - List all billings (with filters)
- POST `/api/billing` - Create new billing record
- GET `/api/billing/:id` - Get billing details
- PUT `/api/billing/:id` - Update billing
- DELETE `/api/billing/:id` - Delete billing record
- POST `/api/billing/:id/invoice` - Generate invoice
- GET `/api/billing/:id/invoice/pdf` - Download invoice as PDF
- POST `/api/billing/:id/payment` - Record payment
- GET `/api/billing/patient/:patientId` - Get patient's billing history

**Features:**
- Automatic billing based on appointments and services
- Invoice generation with auto-numbering
- Payment tracking (Paid, Pending, Partially Paid)
- Multiple payment methods support
- Discount and tax calculations
- Invoice PDF generation and download
- Payment receipt generation
- Billing reports and analytics
- Outstanding balance tracking

**Database Fields:**
- Patient ID, Doctor ID, Appointment ID
- Service Description, Amount
- Tax, Discount, Total Amount
- Payment Status, Payment Date
- Payment Method
- Invoice Number, Issue Date, Due Date
- Notes

---

### 6. DEPARTMENT MANAGEMENT MODULE
**Endpoints:**
- GET `/api/departments` - List all departments
- POST `/api/departments` - Create department
- GET `/api/departments/:id` - Get department details
- PUT `/api/departments/:id` - Update department
- DELETE `/api/departments/:id` - Delete department
- GET `/api/departments/:id/doctors` - Get doctors in department

**Features:**
- Department CRUD operations
- Doctor assignment to departments
- Department head assignment
- Contact information
- Operating hours

---

### 7. STAFF/RECEPTIONIST MANAGEMENT MODULE
**Endpoints:**
- GET `/api/staff` - List all staff
- POST `/api/staff` - Add new staff member
- GET `/api/staff/:id` - Get staff details
- PUT `/api/staff/:id` - Update staff information
- DELETE `/api/staff/:id` - Delete staff member
- GET `/api/staff/:id/schedule` - Get work schedule

**Features:**
- Staff profile management
- Role assignment (Receptionist, Nurse, Admin, etc.)
- Work schedule/shift management
- Contact details

---

### 8. DASHBOARD MODULE
**Admin Dashboard:**
- Total patients, doctors, appointments statistics
- Revenue/billing overview
- Upcoming appointments
- New patient registrations
- Department-wise breakdown
- Charts and graphs (revenue trends, patient growth, appointment distribution)

**Doctor Dashboard:**
- Today's appointments schedule
- Patient list
- Prescriptions to manage
- Appointments history

**Patient Dashboard:**
- Upcoming appointments
- Medical records
- Billing history
- Prescriptions
- Doctor information

---

## DATABASE SCHEMA (MongoDB)

### Collections

**users**
```
{
  _id, email, password, role, createdAt, updatedAt
}
```

**patients**
```
{
  _id, userId, firstName, lastName, DOB, gender, bloodType,
  email, phone, address, city, state, zipCode,
  emergencyContact, allergies, currentMedications,
  insurance, medicalHistory, profilePhoto, status,
  createdAt, updatedAt
}
```

**doctors**
```
{
  _id, userId, firstName, lastName, specialization,
  qualifications, licenseNumber, yearsExperience,
  departmentId, consultationFee, profilePhoto,
  availableSlots, rating, status, createdAt, updatedAt
}
```

**appointments**
```
{
  _id, patientId, doctorId, appointmentDate, appointmentTime,
  duration, reasonForVisit, notes, status, createdAt, updatedAt
}
```

**billings**
```
{
  _id, patientId, doctorId, appointmentId, serviceDescription,
  amount, tax, discount, totalAmount, paymentStatus,
  paymentDate, paymentMethod, invoiceNumber, createdAt, updatedAt
}
```

**invoices**
```
{
  _id, billingId, invoiceNumber, invoiceDate, dueDate,
  patientDetails, doctorDetails, itemsList, totalAmount,
  status, pdfUrl, createdAt, updatedAt
}
```

**departments**
```
{
  _id, name, description, headDoctor, phone, email, createdAt, updatedAt
}
```

**staff**
```
{
  _id, userId, firstName, lastName, role, departmentId,
  phone, email, address, hireDate, workSchedule, status, createdAt, updatedAt
}
```

---

## API RESPONSE STRUCTURE

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details",
  "statusCode": 400
}
```

---

## AUTHENTICATION & SECURITY

- **JWT Token:** 
  - Access Token: 15 minutes expiry
  - Refresh Token: 7 days expiry

- **Password Security:**
  - Minimum 8 characters
  - At least one uppercase, one lowercase, one digit, one special character
  - Hashing: bcryptjs (salt rounds: 10)

- **CORS:** Configure for frontend origin only

- **Rate Limiting:** 
  - Login attempts: 5 per 15 minutes
  - API calls: 100 per hour

- **Validation:** Server-side validation for all inputs

- **Role-Based Access Control (RBAC):**
  - Admin: Full access
  - Doctor: Limited to their appointments and patients
  - Patient: Only their own data
  - Staff: Designated operations

---

## FRONTEND REQUIREMENTS

### Pages & Routes

**Auth Routes:**
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Forgot password
- `/auth/reset-password/:token` - Reset password

**Admin Routes:**
- `/admin/dashboard` - Main dashboard
- `/admin/patients` - Patient list/management
- `/admin/doctors` - Doctor list/management
- `/admin/appointments` - Appointment management
- `/admin/billing` - Billing management
- `/admin/departments` - Department management
- `/admin/staff` - Staff management
- `/admin/reports` - Reports and analytics

**Doctor Routes:**
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/appointments` - Doctor's appointments
- `/doctor/patients` - Doctor's patients
- `/doctor/prescriptions` - Manage prescriptions

**Patient Routes:**
- `/patient/dashboard` - Patient dashboard
- `/patient/book-appointment` - Book appointment
- `/patient/my-appointments` - View appointments
- `/patient/medical-records` - View medical records
- `/patient/billing-history` - View bills
- `/patient/prescriptions` - View prescriptions

**Shared Routes:**
- `/profile` - User profile
- `/settings` - User settings
- `/not-found` - 404 page

---

## STYLING GUIDELINES

- **Tailwind CSS:**
  - Use utility classes for all styling
  - Custom colors in tailwind config
  - Responsive design (mobile-first approach)
  - Dark mode support (optional)

- **Color Scheme (Recommended):**
  - Primary: Blue (#3B82F6)
  - Secondary: Green (#10B981)
  - Danger: Red (#EF4444)
  - Warning: Yellow (#F59E0B)
  - Neutral: Gray

- **Typography:**
  - Headings: Clear hierarchy (H1-H6)
  - Body text: Readable size (14-16px)
  - Consistent spacing

- **Components:**
  - Consistent button styles
  - Card-based layouts
  - Modal dialogs for forms
  - Responsive tables
  - Mobile-friendly navigation

---

## PERFORMANCE REQUIREMENTS

- **Frontend:**
  - Lazy loading for routes
  - Code splitting
  - Image optimization
  - Bundle size < 500KB (gzipped)

- **Backend:**
  - Database query optimization
  - Pagination for large datasets
  - Caching (Redis optional)
  - API response time < 1 second

---

## VALIDATION REQUIREMENTS

**Frontend Validation:**
- Client-side form validation using React Hook Form + Zod/Yup
- Real-time validation feedback
- Error messages near form fields

**Backend Validation:**
- All inputs validated server-side
- Sanitization against XSS
- SQL injection prevention (Mongoose handles this)

---

## ERROR HANDLING

**Frontend:**
- Global error boundary
- Toast notifications for errors
- Graceful fallback UI
- User-friendly error messages

**Backend:**
- Centralized error handling middleware
- Proper HTTP status codes
- Error logging
- Detailed error responses in development mode

---

## TESTING REQUIREMENTS

- Unit tests for utility functions
- API endpoint testing (POST, GET, PUT, DELETE)
- Authentication flow testing
- Form validation testing

---

## DEPLOYMENT CONSIDERATIONS

**Frontend:**
- Build: `npm run build` (Vite)
- Hosting: Vercel, Netlify, AWS S3 + CloudFront
- Environment variables in `.env.production`

**Backend:**
- Hosting: Heroku, AWS EC2, DigitalOcean, Railway
- Database: MongoDB Atlas (cloud) or self-hosted
- Environment variables for sensitive data

---

## NICE-TO-HAVE FEATURES (Future Enhancements)

1. **Prescription Management:**
   - Doctor creates digital prescriptions
   - Patient views prescriptions
   - Pharmacy integration

2. **Medical Records:**
   - Upload lab reports, X-rays, etc.
   - OCR for document processing
   - Secure document storage

3. **Notifications:**
   - Email reminders 24 hours before appointment
   - SMS notifications (Twilio integration)
   - In-app notifications

4. **Analytics & Reports:**
   - Revenue reports
   - Patient growth charts
   - Doctor performance metrics
   - Department-wise statistics

5. **Payment Integration:**
   - Stripe/PayPal integration
   - Online payment processing
   - Payment history

6. **Video Consultation:**
   - Real-time video appointments
   - WebRTC implementation

7. **Mobile App:**
   - React Native version

8. **AI/ML Features:**
   - Symptom checker
   - Appointment prediction
   - Resource optimization

---

## DEVELOPMENT TIMELINE SUGGESTION

1. **Week 1:** Project setup, folder structure, database design
2. **Week 2:** Auth module (login, register, JWT)
3. **Week 3:** Patient & Doctor modules (CRUD operations)
4. **Week 4:** Appointment system (booking, calendar)
5. **Week 5:** Billing & invoicing system
6. **Week 6:** Dashboard implementation
7. **Week 7:** Testing and bug fixes
8. **Week 8:** Deployment and documentation

---

## GIT WORKFLOW

**Repository Structure:**
- Single monorepo with `/client` and `/server` folders
- `.gitignore`: node_modules, .env.local, uploads, build, dist
- Commit message format: `[module] description` (e.g., `[auth] implement JWT token refresh`)

---

## DOCUMENTATION REQUIREMENTS

- **README.md** in root, client, and server folders
- **API Documentation** (Postman collection or Swagger/OpenAPI)
- **Frontend Component Documentation** (Storybook optional)
- **Database Schema Diagram**
- **Architecture Diagram**
- **Setup Instructions** (local development, deployment)

---

## ENVIRONMENT VARIABLES

**Backend (.env.local):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env.local):**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Hospital Management System
```

---

## SUCCESS CRITERIA

- ✅ All core modules fully functional
- ✅ Secure authentication with role-based access
- ✅ Responsive design on mobile, tablet, desktop
- ✅ Error handling and validation
- ✅ Clean, well-organized code
- ✅ Database properly normalized
- ✅ API documentation complete
- ✅ Ready for testing and deployment

---

**This specification provides a comprehensive roadmap for building a professional, scalable Hospital Management System.**