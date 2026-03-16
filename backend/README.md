# Backend Ledger API

A financial ledger REST API built with Node.js and Express. It manages users, bank accounts, and fund transfers between accounts, maintaining an immutable double-entry ledger for every transaction.

## Tech Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js v5
- **Database:** MongoDB via Mongoose v9
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs`
- **Email:** Nodemailer
- **Security:** Helmet, CORS, `express-rate-limit`, `express-validator`
- **Logging:** Morgan

## Getting Started

### Prerequisites

- Node.js
- MongoDB instance (local or remote)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ledger
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port the server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret key for signing/verifying JWTs | — |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | — |

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Reference

### Health Check

```
GET /health
```

Returns `{ status: "ok", timestamp }`.

---

### Auth — `/api/auth`

> Rate limited: 20 requests / 15 min per IP

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user. Returns JWT in cookie and body. Sends a welcome email. |
| `POST` | `/api/auth/login` | No | Log in with email and password. Returns JWT in cookie and body. |
| `POST` | `/api/auth/logout` | Yes | Clears the auth cookie. |
| `GET` | `/api/auth/me` | Yes | Returns the currently authenticated user's profile. |

---

### Accounts — `/api/accounts`

> All routes require authentication.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/accounts` | Create a new account. Optional `currency` field (default: `INR`). |
| `GET` | `/api/accounts` | List all accounts owned by the user with computed balances. Paginated. |
| `GET` | `/api/accounts/:id` | Fetch a single account by ID with balance. |
| `GET` | `/api/accounts/:id/balance` | Get the balance for a specific account. |
| `GET` | `/api/accounts/:id/ledger` | Get paginated ledger entries for an account. |
| `PATCH` | `/api/accounts/:id/status` | Update account status to `ACTIVE`, `FROZEN`, or `CLOSED`. Closing requires zero balance. |
| `POST` | `/api/accounts/:id/deposit` | Deposit funds directly into an active account. |

---

### Transactions — `/api/transactions`

> All routes require authentication.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transactions` | Create a transfer between two accounts. |
| `GET` | `/api/transactions` | List all transactions involving the user's accounts. Paginated. |
| `GET` | `/api/transactions/:id` | Fetch a single transaction by ID. |

#### Transfer Flow

1. Validates source and destination are not the same
2. Verifies both accounts exist and the requesting user owns the source account
3. Checks idempotency key to prevent duplicate transfers
4. Validates both accounts are `ACTIVE` and share the same currency
5. Verifies sufficient balance
6. Creates a `PENDING` transaction
7. Writes DEBIT (source) and CREDIT (destination) ledger entries
8. Marks transaction as `COMPLETED` (or `FAILED` on error)
9. Sends email notification

---

## Authentication

JWT-based auth stored as an `httpOnly` cookie (`token`). Tokens expire in **3 days**. A `Bearer` token via the `Authorization` header is also accepted as a fallback.

Cookies are flagged `secure` in production and use `sameSite: strict`.

---

## Data Models

### User
- `email` — unique, required
- `name` — required
- `password` — bcrypt-hashed (salt rounds: 15), excluded from query results by default

### Account
- `user` — reference to User
- `status` — `ACTIVE` | `FROZEN` | `CLOSED` (default: `ACTIVE`)
- `currency` — default `INR`
- Balance is computed dynamically from ledger entries (sum of CREDITs − sum of DEBITs)

### Transaction
- `type` — `TRANSFER` | `DEPOSIT`
- `fromAccount` / `toAccount` — references to Account
- `status` — `PENDING` | `COMPLETED` | `FAILED` | `REVERSED`
- `amount`
- `idempotencyKey` — unique, prevents duplicate transactions

### Ledger
- `account`, `amount`, `transaction`, `type` (`CREDIT` | `DEBIT`)
- **All fields are immutable** — the ledger is append-only and cannot be modified or deleted, ensuring a reliable audit trail.

---

## Project Structure

```
backend/
├── server.js               # Entry point
└── src/
    ├── app.js              # Express app setup, middleware, rate limiting
    ├── config/
    │   └── db.js           # MongoDB connection
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── account.controller.js
    │   └── transaction.controller.js
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   └── validation.middleware.js
    ├── models/
    │   ├── user.model.js
    │   ├── account.model.js
    │   ├── transaction.model.js
    │   └── ledger.model.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── accounts.routes.js
    │   └── transaction.routes.js
    └── services/
        └── email.service.js
```
