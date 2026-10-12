# ShopSphere — Full-Stack E-Commerce

A complete, production-ready e-commerce platform.

- **Frontend:** React 18 + Vite + React Router + Axios
- **Backend:** Node.js + Express + Mongoose
- **Database:** MongoDB (Atlas / local)
- **Auth:** JWT + bcrypt, role-based (customer / admin)
- **Payments:** Razorpay (test mode) with server-side signature verification + Cash on Delivery
- **Images:** Cloudinary (optional) with local `/uploads` fallback
- **Security:** helmet, CORS allow-list, rate limiting, input validation, NoSQL-injection-safe queries, hidden errors

```
ecommerce/
├── backend/         Express API
└── frontend/        React SPA (Vite)
```

## Features

- Homepage: hero, categories, featured/trending products
- Shop: search, category & price filters, 4 sorts, pagination
- Product pages: gallery, ratings, stock, reviews
- Cart: guest (localStorage) + server-side cart for logged-in users (survives logout/login)
- Checkout: delivery form, COD / Razorpay, server-computed prices
- Orders: order history, tracking, cancellation
- Reviews: 1–5 stars, one review per user per product, auto rating average
- Admin dashboard: stats, product CRUD + image upload, order status, user management

## Run locally

Requirements: Node.js 18+ and a MongoDB URI (Atlas or `mongodb://127.0.0.1:27017/shopsphere`).

1. **Backend**
   ```
   cd backend
   npm install
   copy .env.example .env   # fill MONGO_URI and JWT_SECRET
   npm run seed             # inserts 15 products + admin account
   npm run dev              # http://localhost:5000
   ```
   Admin login (seeded): `admin@shopsphere.com` / `admin123` — change it in `.env` (ADMIN_SEED_PASSWORD) and re-seed.

2. **Frontend**
   ```
   cd frontend
   npm install
   npm run dev              # http://localhost:5173 (proxies /api to :5000)
   ```

## Environment variables

**backend/.env** (all keys in `.env.example`):

| Key | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string (required) |
| `JWT_SECRET` | JWT signing secret (required, use a long random string) |
| `CLIENT_ORIGIN` | Comma-separated allowed CORS origins (e.g. `http://localhost:5173`) |
| `CLOUDINARY_*` | Optional — enables Cloudinary image upload; otherwise images save to `uploads/` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional — enables Razorpay checkout; when unset only COD is offered |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Credentials created by `npm run seed` |

**frontend/.env**:
```
VITE_API_URL=          # empty in dev (Vite proxy). Set to https://<your-backend>.onrender.com/api when deployed
```

## API endpoints

```
POST   /api/auth/register  POST   /api/auth/login
GET    /api/auth/me        PUT    /api/auth/profile   PUT /api/auth/password
GET    /api/products       GET    /api/products/:id        GET /api/products/categories
POST   /api/products       PUT    /api/products/:id        DELETE /api/products/:id    (admin)
GET    /api/cart           POST   /api/cart                POST /api/cart/sync
PUT    /api/cart/:productId  DELETE /api/cart/:productId   DELETE /api/cart
POST   /api/orders         GET    /api/orders/my-orders    GET /api/orders/:id    POST /api/orders/:id/cancel
GET    /api/reviews/product/:id   POST /api/reviews/product/:id
GET    /api/payments/config       POST /api/payments/verify
GET    /api/admin/stats   GET /api/admin/orders        PATCH /api/admin/orders/:id/status
GET    /api/admin/users   PATCH /api/admin/users/:id/status
GET    /api/health
```

Admin endpoints require `Authorization: Bearer <admin-token>` (enforced server-side).

## Deploy

### Backend on Render
1. Create a new **Web Service**, connect the repo, set Build Command `npm install`, Start Command `npm start` (root dir `backend`).
2. Add env vars from `backend/.env.example` (MONGO_URI, JWT_SECRET, CLIENT_ORIGIN → your frontend URL).
3. Health check: `GET https://<your-backend>.onrender.com/api/health`.

### Frontend (Vercel / Netlify)
1. Build command `npm run build`, publish dir `dist` (root dir `frontend`).
2. Set `VITE_API_URL=https://<your-backend>.onrender.com/api`.
3. Update `CLIENT_ORIGIN` on the backend to your frontend domain.

### MongoDB Atlas
1. Create a cluster, add a DB user, click **Connect → Drivers** and copy the connection string.
2. Replace `<username>`, `<password>`, `<dbname>` in `MONGO_URI` for both local and production.

## Security notes
- Passwords hashed with bcrypt (10 rounds); never stored or logged in plain text.
- JWT secrets, DB credentials and Razorpay keys only live in server-side `.env` files (git-ignored) and the hosting dashboard — never in frontend code.
- Cart totals, product prices and stock are always recomputed server-side; frontend values are never trusted.
- Razorpay payments are verified by signature on the backend before an order is marked paid (a frontend success message alone is never enough).

## Notes & manual integrations
- Real Razorpay payments require your own test-mode `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (available free at dashboard.razorpay.com). Without them, only COD is enabled.
- Cloudinary credentials enable remote image hosting; without them uploaded images are stored under `backend/uploads/` and served by Express.