# SupportDesk - Modern Customer Support & Operations System
     
A full-stack, production-grade customer support platform built on the **MERN** stack (MongoDB, Express.js, React, Node.js) with Redux Toolkit and Tailwind CSS. The system enables customer issue submission and tracking while providing support agents and administrators with a dashboard to manage tickets, assignments, priorities, statuses, public replies, internal notes, and audit history.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)    
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Prerequisites & System Requirements](#prerequisites--system-requirements)
6. [Environment Configuration](#environment-configuration)
7. [Installation & Setup](#installation--setup)
8. [Database Seeding & Demo Accounts](#database-seeding--demo-accounts)
9. [Running the Application](#running-the-application)
10. [Business Rules Implementation](#business-rules-implementation)
11. [REST API Documentation](#rest-api-documentation)
12. [Database Schema & Data Modeling](#database-schema--data-modeling)
13. [Security & Data Integrity](#security--data-integrity)
14. [Automated Verification & Test Suite](#automated-verification--test-suite)
15. [AI Usage & Methodology](#ai-usage--methodology)

---

## Key Features

### Support Staff & Admin Interface
- **Role-Based Authentication (RBAC)**: Secure JWT-based authentication with bcrypt password hashing and HTTP-only cookie support. Distinct permissions for `admin` and `agent` roles.
- **Operations Dashboard**: Real-time aggregated statistics calculated directly from MongoDB database queries:
  - Total tickets
  - Open tickets
  - In Progress tickets
  - Resolved tickets
  - Urgent priority tickets
  - Overdue tickets (strict 24-hour SLA logic)
  - Workload by support agent
  - Priority and status distributions
- **Ticket Management**:
  - Filter by Status (`Open`, `In Progress`, `Waiting on Customer`, `Resolved`)
  - Filter by Priority (`Low`, `Medium`, `High`, `Urgent`)
  - Filter by Assignee (`Assigned to Me`, `Unassigned`, or specific agent)
  - Multi-field Search across subject, customer name, email, and ticket reference
  - Priority-weighted sorting (`Urgent` > `High` > `Medium` > `Low`)
  - Pagination with configurable page size
- **Conversation Hub**:
  - Chronological message history (oldest first)
  - Explicit composer tab selection between **Public Reply** and **Internal Note**
  - High-visibility visual badges distinguishing private staff notes (amber shield badge) from public customer replies
- **Audit & Activity History**:
  - Every action (creation, status change, priority update, assignment, replies, notes, resolution) is automatically tracked
  - Recorded with actor, action type, description, previous value, new value, and timestamp
- **Agent Management (Admin Only)**:
  - Add new support agents and administrators
  - Monitor agent active ticket workloads
  - Toggle agent active/deactivated status

### Customer Interface
- **Public Ticket Submission**: Customers submit issues without needing an agent account.
- **Unique Ticket Reference**: Automatic collision-safe generation (e.g., `TCK-100801`).
- **Cryptographic Access Token**: Customers receive a private 24-byte hex access token to securely check ticket status without exposing records to enumeration attacks.
- **Customer Tracking Portal**: Secure status tracking and public reply history.
- **Customer Response**: Customers can reply directly to the ticket, automatically shifting status from `Waiting on Customer` to `In Progress`.
- **Absolute Privacy Enforcement**: Internal staff notes are filtered out at the database query level and never reach customer-facing endpoints.

---

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: JavaScript (ES6+)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`) & React Redux
- **Routing**: React Router DOM (`v7`)
- **HTTP Client**: Axios with centralized request/response interceptors
- **Styling**: Tailwind CSS (`v3`) with responsive SaaS layout
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js (`v23+` / `v18+`)
- **Framework**: Express.js (`v4.21+`)
- **Language**: JavaScript (ES Modules)
- **Database**: MongoDB with Mongoose (`v8.9+`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Password Hashing**: `bcryptjs`
- **Cookies & Security**: `cookie-parser`, `cors`

---

## Architecture Overview

```
                      +------------------------------------------+
                      |         React + Vite Frontend            |
                      |   Redux Toolkit Centralized State Store   |
                      +--------------------+---------------------+
                                           | Axios Client (/api)
                                           v
                      +------------------------------------------+
                      |          Express.js REST API             |
                      |  Middlewares (Auth, Roles, Validation)   |
                      +--------------------+---------------------+
                                           | Mongoose ODM
                                           v
                      +------------------------------------------+
                      |               MongoDB                    |
                      |  [Users, Tickets, Messages, Activities]  |
                      +------------------------------------------+
```

1. **Client Layer**: Single-page application configured with Redux Toolkit slices (`authSlice`, `ticketSlice`, `dashboardSlice`, `agentSlice`). Local form state remains in React components, while shared cache and API state are managed centrally via `createAsyncThunk`.
2. **API Layer**: Organized into specialized Express routers, controllers, and middlewares:
   - `authMiddleware`: Validates JWT tokens from headers or cookies, checks user activation status.
   - `roleMiddleware`: Restricts admin-only actions (agent creation, ticket reassignment, deletion).
   - `validationMiddleware`: Enforces required input formats and field lengths on the server.
   - `errorMiddleware`: Centralizes error handling (Mongoose CastError, duplicate keys, validation errors).
3. **Data Layer**: MongoDB indexed collections with virtual fields, timestamps, and cascading audit trails.

---

## Project Structure

```
SupportDeskSystem/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & event handlers
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login, logout, getMe
│   │   │   ├── ticketController.js   # Listing, filtering, sorting, CRUD, assignment
│   │   │   ├── messageController.js  # Public replies & internal notes
│   │   │   ├── activityController.js # Chronological audit logs
│   │   │   ├── dashboardController.js# Aggregated statistics & overdue calculations
│   │   │   ├── agentController.js    # Agent management & workload analytics
│   │   │   └── publicTicketController.js # Secure customer submission & tracking
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js     # JWT token verification
│   │   │   ├── roleMiddleware.js     # Role-based access control
│   │   │   ├── validationMiddleware.js# Request body and param validators
│   │   │   └── errorMiddleware.js    # Global error & 404 handlers
│   │   ├── models/
│   │   │   ├── User.js               # Staff credentials & roles
│   │   │   ├── Ticket.js             # Support tickets with SLA virtuals
│   │   │   ├── Message.js            # Conversation messages & notes
│   │   │   └── Activity.js           # Immutable audit log entries
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── ticketRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   ├── activityRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── agentRoutes.js
│   │   │   └── publicRoutes.js
│   │   ├── utils/
│   │   │   ├── ticketReference.js    # Collision-safe reference & token hashing
│   │   │   └── activityLogger.js     # Audit trail helper
│   │   ├── scripts/
│   │   │   └── seed.js               # Realistic demo database seeder
│   │   ├── tests/
│   │   │   └── runTests.js           # 33-step automated backend test suite
│   │   ├── app.js                    # Express app configuration & middleware
│   │   └── server.js                 # HTTP server entry point
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx        # Navigation header with user badge & quick links
│   │   │   │   ├── Sidebar.jsx       # Staff & customer portal sidebar
│   │   │   │   ├── Badge.jsx         # Status, priority, and overdue pills
│   │   │   │   ├── Modal.jsx         # Accessible modal dialog
│   │   │   │   ├── LoadingSpinner.jsx# Loading state spinner
│   │   │   │   └── EmptyState.jsx    # Empty state illustration & actions
│   │   │   ├── tickets/
│   │   │   │   ├── TicketFilters.jsx # Search, multi-dropdown filter & sort bar
│   │   │   │   ├── TicketTable.jsx   # Interactive ticket data table
│   │   │   │   └── CreateTicketModal.jsx # Modal to create staff ticket
│   │   │   ├── conversation/
│   │   │   │   ├── MessageTimeline.jsx # Public vs Internal note history
│   │   │   │   └── MessageComposer.jsx # Composer with explicit reply/note toggle
│   │   │   └── activity/
│   │   │       └── ActivityTimeline.jsx# Visual audit trail with changed values
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Login screen with 1-click demo accounts
│   │   │   ├── DashboardPage.jsx     # 6-card metrics dashboard & workload tables
│   │   │   ├── TicketsPage.jsx       # Full tickets table with pagination
│   │   │   ├── TicketDetailPage.jsx  # Complete ticket details & controls
│   │   │   ├── AgentManagementPage.jsx # Admin agent management & status toggle
│   │   │   ├── CustomerSubmitPage.jsx# Customer ticket submission portal
│   │   │   └── CustomerTrackPage.jsx # Customer ticket tracking & reply portal
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── ticketSlice.js
│   │   │   │   ├── dashboardSlice.js
│   │   │   │   └── agentSlice.js
│   │   │   └── index.js              # Centrally configured Redux store
│   │   ├── services/
│   │   │   └── api.js                # Centralized Axios client
│   │   ├── App.jsx                   # React Router setup & protected routes
│   │   ├── main.jsx                  # React DOM root with Redux Provider
│   │   └── index.css                 # Tailwind CSS styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── package.json                      # Root npm scripts
├── .gitignore
└── README.md
```

---

## Prerequisites & System Requirements

- **Node.js**: `v18.0.0` or later (tested on `v23.2.0`)
- **npm**: `v9.0.0` or later (tested on `v10.9.0`)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

---

## Environment Configuration

### Backend Configuration (`backend/.env`)

Create `backend/.env` (or copy from `backend/.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/support_desk

# JWT Configuration
JWT_SECRET=demo_support_desk_jwt_secret_key_2026_super_secure!
JWT_EXPIRES_IN=7d

# CORS Allowed Origin
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration (`frontend/.env`)

Create `frontend/.env` (or copy from `frontend/.env.example`):

```env
# API Base URL (empty or /api routes through Vite dev proxy)
VITE_API_BASE_URL=/api
```

---

## Installation & Setup

Install dependencies for both backend and frontend:

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install
```

---

## Database Seeding & Demo Accounts

A seed script populates demo administrators, support agents, tickets with varying statuses, past timestamps for overdue evaluation, resolved tickets, replies, and audit history.

Run the seed script:

```bash
cd backend
npm run seed
```

### Pre-Configured Demo Credentials

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Sarah Connor | `admin@supportdesk.com` | `admin123` | Full access: View/edit tickets, assign/reassign tickets, view metrics, manage agents, internal notes |
| **Agent 1** | Alex Rivera | `agent1@supportdesk.com` | `agent123` | View tickets, update status & priority, public replies, internal notes, activity history |
| **Agent 2** | Morgan Chen | `agent2@supportdesk.com` | `agent123` | View tickets, update status & priority, public replies, internal notes, activity history |

> **Tip**: The Login page features **1-Click Demo Fill Buttons** to immediately log in as either the Admin or Agents without manual typing.

---

## Running the Application

### 1. Start MongoDB
Ensure your MongoDB daemon is running:
```bash
# Example if running as a service:
net start MongoDB
# Or if running mongod directly:
mongod --dbpath <path_to_db> --port 27017
```

### 2. Start Backend API Server
```bash
cd backend
npm start
# Server listens on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 3. Start Frontend Client
```bash
cd frontend
npm run dev
# Vite dev server runs on http://localhost:5173
```

### 4. Access the Application
- **Staff Portal**: [http://localhost:5173/login](http://localhost:5173/login)
- **Customer Submit Issue**: [http://localhost:5173/customer/submit](http://localhost:5173/customer/submit)
- **Customer Track Ticket**: [http://localhost:5173/customer/track](http://localhost:5173/customer/track)

---

## Business Rules Implementation

### 1. Overdue Ticket Definition (Strict SLA Rule)
- **Rule**: A ticket is considered **overdue** if and only if:
  1. Its status is **NOT `Resolved`**, and
  2. Its creation timestamp (`createdAt`) is more than **24 hours in the past**.
- **Resolution Guarantee**: The moment a ticket is changed to `Resolved`, it **immediately stops counting as overdue**, regardless of its age.
- **Implementation**:
  - Implemented both in MongoDB aggregation queries (`createdAt: { $lte: 24hAgo }, status: { $ne: 'Resolved' }`) for the dashboard and as a Mongoose virtual (`ticket.isOverdue`) on ticket objects.
  - Visually highlighted with an animated red `OVERDUE` badge and a prominent alert banner on the ticket detail page.

### 2. Public Replies vs. Internal Notes Isolation
- **Public Replies**: Intended for communication with the customer. Recorded in audit history and delivered to customers via `/api/public/tickets/:reference/messages`.
- **Internal Notes**: Restricted strictly to support agents and administrators.
  - Styled with an amber border, shield badge, and yellow background in the staff conversation view.
  - Excluded at the database query level (`type: 'public'`) in customer endpoints.
  - Backend authorization blocks unauthorized users from reading or writing internal notes.

### 3. Customer Token Verification
- To prevent guessing or ID-enumeration attacks, customer tracking requires both the unique **Reference** (e.g. `TCK-100801`) and a cryptographically generated **Access Token**.
- The backend stores a SHA-256 hash of the token (`accessTokenHash`) and verifies it using constant-time comparison (`crypto.timingSafeEqual`). Plain access tokens are never returned in staff listings.

### 4. Priority-Weighted Sorting
- Default priority order: `Urgent > High > Medium > Low`.
- Implemented via a MongoDB aggregation pipeline using `$switch` weights (`Urgent: 4, High: 3, Medium: 2, Low: 1`) to ensure sorting is computed directly by the database engine.

---

## REST API Documentation

### Authentication Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Staff login. Returns JWT token and user profile; sets cookie. |
| `POST` | `/api/auth/logout` | Staff | Clears auth cookie and session. |
| `GET` | `/api/auth/me` | Staff | Returns currently authenticated user profile. |

### Staff Ticket Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | Staff | List tickets with search, status/priority/assignee filters, sorting, and pagination. |
| `POST` | `/api/tickets` | Staff | Create a new ticket on behalf of a customer. |
| `GET` | `/api/tickets/:id` | Staff | Get ticket details by ObjectId or Reference. |
| `PATCH` | `/api/tickets/:id` | Staff | Update status, priority, subject, or description. |
| `PATCH` | `/api/tickets/:id/assign` | Admin | Assign or reassign ticket to an agent. |
| `DELETE` | `/api/tickets/:id` | Admin | Delete ticket and cascade delete related messages and activities. |

### Conversation & Audit Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets/:id/messages` | Staff | Get chronological messages (both public replies and internal notes). |
| `POST` | `/api/tickets/:id/messages` | Staff | Add a public reply or internal note. |
| `GET` | `/api/tickets/:id/activity` | Staff | Get chronological audit history timeline. |

### Dashboard Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Staff | Aggregated counts for total, open, in-progress, resolved, urgent, and overdue tickets. |

### Agent Management Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/agents` | Staff | List all agents with active assigned ticket counts. |
| `POST` | `/api/agents` | Admin | Create a new support agent or admin account. |
| `PATCH` | `/api/agents/:id` | Admin | Update agent details or toggle active status. |

### Customer-Facing Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/public/tickets` | Public | Customer submits a ticket. Returns ticket reference and tracking token. |
| `GET` | `/api/public/tickets/:reference` | Public + Token | Securely track ticket status (requires `?token=...`). |
| `GET` | `/api/public/tickets/:reference/messages`| Public + Token | Fetch public replies ONLY (internal notes omitted). |
| `POST` | `/api/public/tickets/:reference/messages`| Public + Token | Customer posts a public response to support. |

---

## Database Schema & Data Modeling

### 1. `User` Schema
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'agent'], default: 'agent' },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

### 2. `Ticket` Schema
```javascript
{
  reference: { type: String, required: true, unique: true, uppercase: true, index: true },
  subject: { type: String, required: true, maxlength: 200 },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium', index: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Waiting on Customer', 'Resolved'], default: 'Open', index: true },
  assignedTo: { type: ObjectId, ref: 'User', default: null, index: true },
  accessTokenHash: { type: String, select: false },
  resolvedAt: { type: Date, default: null },
  timestamps: true
}
```

### 3. `Message` Schema
```javascript
{
  ticket: { type: ObjectId, ref: 'Ticket', required: true, index: true },
  ticketReference: { type: String, required: true, index: true },
  type: { type: String, enum: ['public', 'internal'], required: true, default: 'public', index: true },
  senderRole: { type: String, enum: ['admin', 'agent', 'customer'], required: true },
  senderName: { type: String, required: true },
  senderUser: { type: ObjectId, ref: 'User', default: null },
  content: { type: String, required: true },
  timestamps: true
}
```

### 4. `Activity` Schema
```javascript
{
  ticket: { type: ObjectId, ref: 'Ticket', required: true, index: true },
  ticketReference: { type: String, required: true, index: true },
  actor: {
    name: String,
    email: String,
    role: { type: String, enum: ['admin', 'agent', 'customer', 'system'] },
    id: ObjectId
  },
  action: {
    type: String,
    enum: [
      'TICKET_CREATED',
      'TICKET_ASSIGNED',
      'TICKET_REASSIGNED',
      'STATUS_CHANGED',
      'PRIORITY_CHANGED',
      'PUBLIC_REPLY_ADDED',
      'INTERNAL_NOTE_ADDED',
      'TICKET_RESOLVED'
    ],
    required: true
  },
  description: { type: String, required: true },
  previousValue: Mixed,
  newValue: Mixed,
  createdAt: { type: Date, default: Date.now, index: true }
}
```

---

## Security & Data Integrity

- **Password Security**: Passwords are encrypted using `bcryptjs` with 10 salt rounds and marked `select: false` so hashes are never returned in queries.
- **Timing-Safe Token Matching**: Customer access tokens use `crypto.timingSafeEqual` against the stored SHA-256 digest to prevent timing attacks.
- **Strict Data Isolation**: Customer endpoints enforce a hard filter `{ type: 'public' }` on messages, ensuring internal notes can never leak regardless of client parameters.
- **Role Enforcement**: Reassigning tickets, adding agents, and deleting records are restricted on the server via `requireRole('admin')`.
- **Cascading Integrity**: Ticket deletions automatically purge related messages and activity history to prevent orphan records.
- **Audit Immutability**: Activity events are generated purely through backend controllers and cannot be forged by client requests.

---

## Automated Verification & Test Suite

The project includes an end-to-end integration test suite (`backend/src/tests/runTests.js`) that boots the Express server, connects to MongoDB, and verifies 33 critical scenarios:

```bash
cd backend
npm test
```

### Test Results Summary:
```
======================================================
 STARTING COMPREHENSIVE BACKEND VERIFICATION TESTS
======================================================

[MongoDB] Connected: 127.0.0.1/support_desk
Test server running on http://127.0.0.1:56738

  [PASS] Health Check Endpoint /api/health
  [PASS] Admin Login successful with JWT
  [PASS] Agent Login successful
  [PASS] Invalid password rejected with 401
  [PASS] Dashboard statistics fetched
  [PASS] Real total ticket count is numeric
  [PASS] Real urgent tickets count matches seed
  [PASS] Overdue tickets count accurately accounts for >24h open tickets
  [PASS] Resolved tickets counted
  [PASS] Staff ticket listing fetched
  [PASS] Filter by status=Resolved works
  [PASS] Filter by priority=Urgent works
  [PASS] Search by keyword works
  [PASS] Priority weighted sort executes without errors
  [PASS] Customer public ticket submission
  [PASS] Customer tracking without token blocked with 401
  [PASS] Customer tracking with invalid token blocked with 403
  [PASS] Customer tracking with valid token succeeds
  [PASS] Agent adds public reply
  [PASS] Agent adds internal note
  [PASS] Customer fetches messages with token
  [PASS] Customer can see public reply
  [PASS] Customer CANNOT see internal note (Security isolation verified)
  [PASS] Agent forbidden from assigning ticket (Admin only)
  [PASS] Admin successfully assigns ticket
  [PASS] Ticket resolved
  [PASS] Resolved ticket has isOverdue = false
  [PASS] Ticket activity history retrieved
  [PASS] Activity contains TICKET_CREATED
  [PASS] Activity contains PUBLIC_REPLY_ADDED
  [PASS] Activity contains INTERNAL_NOTE_ADDED
  [PASS] Activity contains TICKET_ASSIGNED
  [PASS] Activity contains TICKET_RESOLVED

======================================================
 TEST SUMMARY: 33 PASSED, 0 FAILED
======================================================
```

---

## AI Usage & Methodology

As part of the practical assessment submission disclosure:
- AI tools were utilized to accelerate boilerplate scaffolding, formulate initial Mongoose schemas, and construct UI components matching modern SaaS design guidelines.
- All core business rules, database queries, aggregation pipelines, cryptographic token verification, and automated tests were verified through live runtime execution against MongoDB and Vite production builds.

