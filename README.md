# IRONPULSE — Gym Membership Management System (MERN Stack)

A full-stack Gym Membership Management System built for a college hackathon with clean architecture, strict separation of concerns, and rock-solid business logic.

---

## 1. Project Overview

**IRONPULSE** manages gym members, membership plan tiers, active and expired subscriptions, and membership renewals. It is built strictly to the hackathon specification without unnecessary bloat.

### Key Highlights
- **Dynamic Membership Status**: Real-time evaluation of `Active` vs `Expired` status using UTC date-only comparisons—no manual updates or cron jobs needed.
- **Accurate Calendar Month Addition**: Rock-solid date math handling leap years and month-end dates (e.g., January 31 + 1 month = February 28/29).
- **Exact Renewal Rules**:
  - **Case 1 (Early / On-time Renewal)**: `New Expiry Date = Existing Expiry Date + Plan Duration` (extends from the existing expiry, NOT the renewal date).
  - **Case 2 (Late Renewal)**: `New Expiry Date = Renewal Date + Plan Duration` (starts a new active period from the renewal date, preserving the expired historical record).
- **Soft Deletion & Audit Trail**: Deactivating a member preserves all historical memberships and renewal logs.
- **Plan Snapshots**: Membership and renewal history records snapshot the plan name, duration, and price at the time of assignment, ensuring future plan edits never alter past records.

---

## 2. Technology Stack

### Frontend
- **React 19** with **Vite**
- **React Router DOM v7** (Declarative routing & Protected Admin routes)
- **Axios** (API client with automatic JWT Bearer token interceptor and 401 handling)
- **Lucide React** (Clean icons)
- **Vanilla Modern CSS** (Dark/Light responsive theme, custom tables, modal dialogs, status badges)

### Backend
- **Node.js** & **Express.js** (REST API)
- **MongoDB** & **Mongoose** (Data modeling, schema validation, compound indexes)
- **JWT (JSON Web Tokens)** (Admin session authorization)
- **bcryptjs** (Secure salted password hashing)
- **cors** & **dotenv** (CORS management and environment variable configuration)

---

## 3. Project Directory Structure

```
c:\Race\
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Alert.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Members.jsx
│   │   │   ├── Plans.jsx
│   │   │   ├── Memberships.jsx
│   │   │   └── Renewals.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Member.js
│   │   ├── Plan.js
│   │   ├── Membership.js
│   │   └── RenewalHistory.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── memberController.js
│   │   ├── planController.js
│   │   ├── membershipController.js
│   │   ├── renewalController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── planRoutes.js
│   │   ├── membershipRoutes.js
│   │   ├── renewalRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/
│   │   ├── membershipService.js
│   │   └── renewalService.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── utils/
│   │   ├── dateUtils.js
│   │   └── seedData.js
│   ├── app.js
│   ├── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── package.json
└── README.md
```

---

## 4. Setup and Installation on Windows

### Prerequisites
- **Node.js** (v18 or higher recommended; v24 installed)
- **npm** (v9 or higher)
- **MongoDB** (Local MongoDB Community Server or free MongoDB Atlas cloud cluster)

### Option A: Using Local MongoDB
1. Ensure the MongoDB service is running:
   ```powershell
   net start MongoDB
   ```
   Or launch `mongod` from your MongoDB installation folder.
2. The default connection URI is:
   ```
   mongodb://127.0.0.1:27017/gym_management
   ```

### Option B: Using MongoDB Atlas (Free Cloud Database)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Obtain your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/gym_management?retryWrites=true&w=majority`.
3. Paste it into `backend/.env` as `MONGODB_URI`.

---

## 5. Step-by-Step Execution Commands

Open PowerShell or Command Prompt in the project root (`c:\Race`):

### 1. Install Backend Dependencies
```powershell
cd backend
npm install
```

### 2. Configure Backend Environment
Copy `.env.example` to `.env` if not already present:
```powershell
copy .env.example .env
```
Contents of `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gym_management
JWT_SECRET=super_secret_jwt_gym_management_key_2026
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Install Frontend Dependencies
```powershell
cd ..\frontend
npm install
```

### 4. Run the Project

#### Option 1: Run Both Concurrently from Root
From `c:\Race`:
```powershell
# In Terminal 1 (Backend API):
npm run server

# In Terminal 2 (Frontend React App):
npm run client
```

#### Option 2: Run Separately
```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The frontend will be available at: **http://localhost:5173**  
The backend API will run at: **http://localhost:5000/api**

---

## 6. Seed Data & Admin Credentials

On initial startup, `backend/server.js` automatically creates:
1. **Default Admin Account**:
   - **Email:** `admin@gym.com`
   - **Password:** `admin123`
2. **Default Membership Plans**:
   - Monthly Standard (1 month, $50)
   - Quarterly Fitness (3 months, $135)
   - Half-Year Elite (6 months, $250)
   - Annual VIP Pro (12 months, $450)
3. **Demo Members & Memberships**:
   - Alex Johnson (`MBR-1001`) with an Active Annual Membership.
   - Sarah Connor (`MBR-1002`) with an Expired Membership (ready for testing Case 2 renewal).
   - David Miller (`MBR-1003`) registered without a plan (ready for testing plan assignment).

> **Quick Autofill:** On the login page (`/login`), click the helper pill to instantly autofill the demo credentials!

---

## 7. Business Logic & Date Handling

### Calendar Months Addition
Adding calendar months in JavaScript using naive `setMonth()` causes overflow bugs (e.g. `Jan 31 + 1 month` becoming `March 2` or `March 3`).
Our implementation in `backend/utils/dateUtils.js`:
```javascript
const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
const targetDay = Math.min(origDay, daysInTargetMonth);
```
- Jan 31, 2026 + 1 month = **Feb 28, 2026**
- Jan 31, 2028 + 1 month (leap year) = **Feb 29, 2028**
- Aug 31, 2026 + 1 month = **Sep 30, 2026**

### Dynamic Status Evaluation
Membership status is evaluated on retrieval using UTC midnight normalization:
```javascript
function computeMembershipStatus(expiryDate) {
  const today = getTodayDateOnly();
  const exp = normalizeToDateOnly(expiryDate);
  return today.getTime() <= exp.getTime() ? 'Active' : 'Expired';
}
```
No manual button click or cron job is needed—the status updates automatically whenever the app is accessed.

### Renewal Cases
- **Case 1: Early or On-Time Renewal (`renewalDate <= expiryDate`)**:
  - The membership is extended from the existing expiry date:
    `New Expiry Date = Existing Expiry Date + Selected Plan Duration`.
  - Renewal record saved with type `EARLY_EXTEND`.
- **Case 2: Late Renewal (`renewalDate > expiryDate`)**:
  - The membership starts fresh from the renewal date:
    `New Expiry Date = Renewal Date + Selected Plan Duration`.
  - A new active membership record is created while the old expired membership remains intact for audit history.
  - Renewal record saved with type `LATE_RENEWAL`.

---

## 8. Backend API Documentation

All protected endpoints require the HTTP header:  
`Authorization: Bearer <JWT_TOKEN>`

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate admin, returns JWT token |
| `GET` | `/api/auth/me` | Private | Returns current admin profile |

### Member Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/members` | Private | Create member (Member ID auto-generated) |
| `GET` | `/api/members` | Private | List all members (supports `?search=` and `?status=`) |
| `GET` | `/api/members/:id` | Private | View member details with all memberships & renewals |
| `PUT` | `/api/members/:id` | Private | Update member details |
| `DELETE`| `/api/members/:id` | Private | Soft delete / toggle active status (preserves history) |

### Membership Plans
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/plans` | Private | Create a membership plan |
| `GET` | `/api/plans` | Private | View all plans (supports `?activeOnly=true`) |
| `PUT` | `/api/plans/:id` | Private | Update plan details |
| `PATCH`| `/api/plans/:id/status`| Private | Toggle plan active/inactive status |

### Memberships
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/memberships` | Private | Assign plan to member (checks for overlapping periods) |
| `GET` | `/api/memberships` | Private | View all memberships |
| `GET` | `/api/memberships/:id` | Private | View single membership |
| `GET` | `/api/memberships/status/active` | Private | View only active memberships |
| `GET` | `/api/memberships/status/expired` | Private | View only expired memberships |
| `GET` | `/api/memberships/member/:memberId`| Private | View memberships for a specific member |

### Renewals
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/renewals` | Private | Process renewal (executes Case 1 or Case 2 logic) |
| `GET` | `/api/renewals` | Private | View all renewal history audit records |
| `GET` | `/api/renewals/member/:memberId` | Private | View renewal records for a specific member |

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Private | Total members, active/expired counts, plans, recent records |

---

## 9. Final Verification Checklist

- [x] **Admin Authentication**: Secure bcrypt hash verification, JWT generation, protected routes, and logout.
- [x] **Member Management**: Auto-generated sequential ID (`MBR-1001`), add, edit, soft delete, search by name/email/phone.
- [x] **Plan Management**: Create, edit, activate/deactivate plans; inactive plans cannot be assigned.
- [x] **Membership Management**: Auto-calculated expiry date, prevention of overlapping active membership periods.
- [x] **Dynamic Status**: Real-time evaluation of `Active` vs `Expired` based on current date.
- [x] **Renewal Case 1**: Renewal on or before expiry extends from existing expiry date.
- [x] **Renewal Case 2**: Renewal after expiry starts new membership from renewal date.
- [x] **History & Snapshots**: Preserves all historical memberships and renewal audit logs with immutable plan snapshots.
- [x] **Responsive UI**: Clean dashboard, cards, tables, modals, error/success banners, confirmation dialogs.

