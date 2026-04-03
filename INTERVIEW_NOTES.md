# 🧠 Finance Dashboard Backend — Interview Notes
# Understand it fully. Explain it confidently.

---

# 1. Project Overview (Simple)

## What problem does it solve?

Imagine a company that handles lots of money transactions — salaries paid,
bills received, expenses done. They need a system where:

- Some people can ONLY VIEW the data (like a new intern)
- Some people can ANALYZE and get reports (like an accountant)
- Some people can MANAGE everything (like a manager/admin)

This backend is the ENGINE behind such a finance dashboard.
It stores transactions, controls who can see/do what, and gives
summary reports like "how much did we earn this month?"

## Real-world analogy

Think of a BANK APP:
- You can see your balance and transactions (VIEWER)
- A bank analyst can see trends and reports (ANALYST)
- A bank manager can add/edit/delete records and manage accounts (ADMIN)

This project is the backend (server side) that powers such a system.

---

# 2. High-Level Architecture (Very Simple)

## The flow in one line:
Client → Express Server → MongoDB Database

## Analogy: Think of a Restaurant

| Layer        | Restaurant Analogy         | In this project              |
|--------------|----------------------------|------------------------------|
| Client       | Customer placing order     | Postman / Frontend / App     |
| Routes       | Waiter who takes order     | Express routes (URL paths)   |
| Middleware   | Security guard at door     | verifyJWT + authorizeRoles   |
| Controller   | Waiter passing to kitchen  | Parses request, calls service|
| Service      | Chef cooking the food      | Business logic               |
| Repository   | Kitchen storage manager    | Mongoose DB queries          |
| Database     | The fridge/pantry          | MongoDB                      |

## Full request flow:

1. Client sends request (e.g. GET /api/transactions)
2. Route receives it
3. Middleware checks: "Are you logged in? Do you have permission?"
4. Controller reads the request and calls the service
5. Service does the logic and calls the repository
6. Repository talks to MongoDB and gets data
7. Data travels back up and is sent to client as JSON

---

# 3. Authentication & Authorization

## Authentication = WHO ARE YOU?
## Authorization = WHAT CAN YOU DO?

---

## What is JWT? (JSON Web Token)

Think of JWT like a HOTEL KEY CARD:
- When you check in (login), the hotel gives you a key card (JWT token)
- Every time you go to your room, you swipe the card (send the token)
- The door doesn't call the front desk every time — it just reads the card
- JWT works the same way — no need to check the database every request

A JWT token looks like 3 parts separated by dots:
  eyJhbGci... . eyJzdWIi... . SflKxwRJSMeKKF2...
  [Header]      [Payload]      [Signature]

The payload contains: userId + role + expiry time
The signature makes sure nobody tampered with it

---

## RBAC — Role-Based Access Control

Simple meaning: Different users get different access based on their role.

## Real-life analogy: Office Building

| Role     | Office Analogy              | What they can do in this app         |
|----------|-----------------------------|--------------------------------------|
| VIEWER   | Visitor with visitor badge  | Can only READ transactions           |
| ANALYST  | Employee with staff badge   | Can READ + access analytics reports  |
| ADMIN    | Manager with master key     | Can do EVERYTHING + manage users     |

## How it works in code (simple):

1. verifyJWT → reads the token → finds out WHO you are
2. authorizeRoles → checks your ROLE → decides if you're ALLOWED

Example:
- DELETE /transaction → only ADMIN allowed
- GET /analytics/summary → ANALYST + ADMIN allowed
- GET /transactions → everyone (VIEWER, ANALYST, ADMIN) allowed

---

## How login works step-by-step:

1. User sends email + password
2. Server finds the user in DB
3. Server compares password (bcrypt.compare) — passwords are HASHED, never stored plain
4. If correct → server creates JWT token (signed with secret key)
5. Token is sent back to user
6. User stores token and sends it with every future request in the header:
   Authorization: Bearer eyJhbGci...

---

# 4. Financial Records (Transactions)

## What is a transaction?

Any money movement — income received or expense paid.

Examples:
- Salary received → INCOME, category: Salary, amount: 50000
- Rent paid → EXPENSE, category: Rent, amount: 15000
- Freelance project → INCOME, category: Freelance, amount: 20000

## Transaction fields explained:

| Field       | Why it exists                                      |
|-------------|-----------------------------------------------------|
| amount      | How much money moved                               |
| type        | Was it INCOME or EXPENSE?                          |
| category    | What kind? (Salary, Rent, Travel...)               |
| date        | When did it happen?                                |
| description | Optional note about the transaction                |
| createdBy   | Which admin created this record (links to User)    |
| deletedAt   | Soft delete — null means active, date means deleted|

## CRUD in simple terms:

| Operation | HTTP method | Who can do it | What it does                  |
|-----------|-------------|----------------|-------------------------------|
| Create    | POST        | ADMIN only     | Add a new transaction         |
| Read      | GET         | All roles      | View transactions              |
| Update    | PATCH       | ADMIN only     | Edit a transaction            |
| Delete    | DELETE      | ADMIN only     | Soft-delete a transaction     |

## What is Soft Delete?

Instead of permanently removing data, we set deletedAt = current date.
The data stays in the database (useful for audit/history) but is invisible
to all API responses.

Analogy: Like putting a file in the recycle bin instead of permanently deleting it.

---

# 5. Analytics (Dashboard Logic)

## What analytics does:

Takes raw transactions and gives meaningful summaries:
- Total income → sum of all INCOME transactions
- Total expense → sum of all EXPENSE transactions
- Net balance → total income - total expense
- Category breakdown → how much spent/earned per category
- Monthly trends → income vs expense for each month
- Recent transactions → last N transactions

## Why use DATABASE AGGREGATION instead of calculating in code?

### ❌ Wrong way (calculating in code):
1. Fetch ALL 50,000 transactions from DB
2. Send all 50,000 records to Node.js
3. Loop through them one by one to calculate sum

Problems:
- Very slow (50,000 records transferred over network)
- Uses lots of memory in Node.js
- Gets worse as data grows

### ✅ Right way (database aggregation):
1. Tell MongoDB: "Group by type, sum the amounts"
2. MongoDB does the calculation INSIDE the database
3. Returns ONLY the result (e.g. just 2 numbers: income total, expense total)

Analogy:
Wrong way = Bringing all ingredients from the kitchen to the dining table
and cooking there.
Right way = The chef cooks in the kitchen and only brings the final dish.

MongoDB pipeline used:
$match (filter active records) → $group (group by type) → $sum (add amounts)

---

# 6. API Flow (Step-by-Step)

## Example: Analyst wants to see the financial summary

Step 1: Analyst logs in
  POST /api/auth/login
  Body: { email, password }
  ← Gets back: { token: "eyJhbGci..." }

Step 2: Analyst sends request with token
  GET /api/analytics/summary
  Header: Authorization: Bearer eyJhbGci...

Step 3: verifyJWT middleware runs
  - Reads the token from the header
  - Verifies it's valid (not expired, not tampered)
  - Attaches user = { id: "...", role: "ANALYST" } to the request

Step 4: authorizeRoles middleware runs
  - Checks: is "ANALYST" in the allowed roles for this route?
  - Allowed roles for /analytics/summary = [ANALYST, ADMIN]
  - ✅ Yes → continue

Step 5: Controller runs
  - Calls analyticsService.getSummary()

Step 6: Service runs
  - Calls transactionRepository.aggregate(pipeline)

Step 7: Repository runs MongoDB aggregation
  - Returns { totalIncome: 32500, totalExpense: 8200 }

Step 8: Service calculates netBalance = 32500 - 8200 = 24300

Step 9: Controller sends response
  ← { success: true, data: { totalIncome: 32500, totalExpense: 8200, netBalance: 24300 } }

---

# 7. Validation & Error Handling

## Why validation?

Users (and attackers) can send anything. Without validation:
- Someone sends amount: -99999 → breaks financial logic
- Someone sends email: "not-an-email" → breaks DB constraints
- Someone sends empty body → crashes the server

## How validation works here (Zod):

Every API input is checked BEFORE touching any business logic.
Zod schemas define exactly what shape the data must have.

Example: Creating a transaction
  amount → must be a positive number
  type → must be "INCOME" or "EXPENSE"
  date → must be a valid ISO datetime
  category → must be a non-empty string

If any rule fails → 400 Bad Request with clear error message like:
  { field: "amount", message: "Amount must be greater than 0" }

## Centralized Error Handler

All errors in the entire app bubble up to ONE place — errorHandler middleware.
No need to write try/catch + res.status everywhere.

| Error type             | HTTP code returned |
|------------------------|--------------------|
| Validation fails       | 400 Bad Request    |
| No/invalid JWT token   | 401 Unauthorized   |
| Wrong role             | 403 Forbidden      |
| Record not found       | 404 Not Found      |
| Duplicate email        | 409 Conflict       |
| Anything unexpected    | 500 Server Error   |

---

# 8. Database Design (Simple)

## Users Collection

Stores every registered user.
Each user has: name, email, hashed password, role, status.
Email is unique (no two users with same email).

## Transactions Collection

Stores every financial record.
Each transaction links back to a User via the createdBy field.
This is a REFERENCE (like a foreign key in SQL).

## Relationship:

One User → can create Many Transactions (One-to-Many)

   User
   _id: "user_001"
   name: "Admin"
      |
      | (one user)
      ↓
   Transaction           Transaction           Transaction
   createdBy: "user_001" createdBy: "user_001" createdBy: "user_001"
   amount: 5000          amount: 1200          amount: 800
   type: INCOME          type: EXPENSE         type: EXPENSE

## Indexes (why they matter):

Without an index, MongoDB reads every single record to find what you want.
With an index, it jumps directly to the right record (like a book index).

Indexes added:
- date → because transactions are often filtered by date range
- category → because analytics groups by category
- date + category together → for combined analytics queries

---

# 9. Key Concepts to Remember (INTERVIEW READY)

## RBAC (Role-Based Access Control)
- Users get a role: VIEWER, ANALYST, or ADMIN
- Every route specifies which roles are allowed
- Enforced by authorizeRoles middleware BEFORE the controller runs

## JWT (JSON Web Token)
- Stateless authentication — server doesn't store sessions
- Token contains: userId + role + expiry
- Signed with a secret key → tamper-proof
- Sent in every request header: Authorization: Bearer <token>

## Middleware
- Code that runs BETWEEN receiving a request and handling it
- verifyJWT → authentication
- authorizeRoles → authorization
- rateLimiter → prevents abuse (max 100 requests per 15 min per IP)

## Repository Pattern
- All database queries are in one place (repository files)
- Service layer never imports Mongoose directly
- Makes code testable and swappable (could switch DB without touching services)

## Soft Delete
- Transactions are never permanently deleted
- deletedAt field is set to current timestamp
- All queries filter { deletedAt: null } to ignore deleted records
- Keeps audit trail — important in finance systems

## MongoDB Aggregation
- Powerful pipeline: $match → $group → $sum → $sort → $project
- Does heavy calculations INSIDE the database
- Much faster than fetching all records and computing in JavaScript

## Zod Validation
- Type-safe schema validation library
- Validates request body/query before touching business logic
- Returns field-level error messages to the client

## Bcrypt
- One-way password hashing — original password can never be recovered
- Even if DB is hacked, passwords are safe
- Every login re-hashes and compares using bcrypt.compare

---

# 10. How to Explain This in Interview (Short Version)

## 30-second pitch:

"I built a REST API backend for a finance dashboard using Node.js, TypeScript,
Express, and MongoDB. The system has three user roles — Viewer, Analyst, and
Admin — each with different access levels enforced using JWT authentication
and role-based access control middleware. Admins can create and manage
financial transactions, analysts can access aggregated reports like income
totals and monthly trends which are calculated using MongoDB aggregation
pipelines for performance, and viewers can read transaction data. The system
has centralized error handling, Zod input validation, soft delete for
transactions, and Swagger documentation."

## If asked about the hardest part:

"The most interesting design decision was using MongoDB aggregation pipelines
for analytics instead of fetching data into JavaScript and computing there.
This keeps the analytics fast regardless of how many transactions are stored,
because the database does the heavy lifting and only returns the final result."

## If asked about RBAC:

"I implemented RBAC using two middleware functions — verifyJWT decodes the
token and attaches the user's role to the request, and authorizeRoles is a
factory that takes the allowed roles as arguments and blocks requests from
users who don't have the right role. This keeps access control logic
completely separate from business logic."

---

# BONUS — 5 Common Mistakes Beginners Make

1. STORING PLAIN TEXT PASSWORDS
   Never do: user.password = "mypassword123"
   Always hash with bcrypt before saving to DB.

2. PUTTING BUSINESS LOGIC IN CONTROLLERS
   Controllers should ONLY parse input and call services.
   Logic like "calculate net balance" belongs in the service layer.
   Fat controllers = hard to test, hard to maintain.

3. RETURNING THE PASSWORD IN RESPONSES
   Always add `select: false` on the password field in the Mongoose schema.
   Or manually delete password before sending user objects.

4. NOT USING INDEXES ON FREQUENTLY QUERIED FIELDS
   If you filter by date or category on every request and have no index,
   MongoDB does a full collection scan — very slow at scale.

5. CALCULATING ANALYTICS IN JAVASCRIPT
   Fetching 100,000 records to sum them in a loop is a classic mistake.
   Use $group and $sum in a MongoDB aggregation pipeline instead.

---

# BONUS — 5 Tips to Sound Smart in Interview

1. MENTION THE "WHY" not just the "WHAT"
   Don't say: "I used MongoDB aggregation."
   Say: "I used MongoDB aggregation because it pushes computation to the
   database, avoiding unnecessary data transfer and keeping the API fast
   as the dataset grows."

2. TALK ABOUT SEPARATION OF CONCERNS
   "I followed a layered architecture — controllers handle HTTP, services
   handle business logic, and repositories handle database access. This
   makes each layer independently testable."

3. MENTION SECURITY DECISIONS
   "Passwords are hashed with bcrypt. JWT tokens are signed with a secret
   key so they can't be tampered with. Rate limiting prevents brute-force
   attacks."

4. BRING UP SOFT DELETE IN FINANCE CONTEXT
   "In finance systems, you typically don't permanently delete records for
   audit purposes. I used soft delete with a deletedAt timestamp — deleted
   records stay in the database but are invisible to the API."

5. MENTION WHAT YOU WOULD ADD NEXT (SHOWS MATURITY)
   "If this were going to production, I'd add refresh tokens with a
   server-side blocklist, structured logging with correlation IDs, and
   pagination cursors instead of offset-based pagination for large datasets."

---
