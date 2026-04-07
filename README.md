# ShopNow — Full-Stack eCommerce Platform

An Amazon/Noon-style marketplace built with **Next.js 14**, **Node.js/Express**, and **MongoDB**.

---

## Project Structure

```
Food Store/
├── backend/          # Express REST API
└── frontend/         # Next.js 14 App Router
```

---

## Quick Start

### 1. Install Dependencies

```bash
# Root (installs concurrently)
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any strong secret string
- `CLOUDINARY_*` — from cloudinary.com (free tier)
- `STRIPE_SECRET_KEY` — from stripe.com (test mode)
- `EMAIL_*` — Gmail SMTP (use App Password)

**Frontend** — copy `frontend/.env.local.example` to `frontend/.env.local` and fill in:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from stripe.com

### 3. Seed Database (optional)

```bash
cd backend
npm run seed
```

This creates:
- **Admin:** admin@shopnow.com / admin123
- **Seller:** seller@shopnow.com / seller123
- **Customer:** customer@shopnow.com / customer123

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Or run both with:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### Customer
- Browse & search products with filters
- Product detail with image gallery & reviews
- Shopping cart with coupon support
- Checkout with address management
- Multiple payment methods (Stripe, COD, PayPal)
- Order tracking with timeline
- Wishlist
- Email notifications

### Seller
- Seller registration & dashboard
- Product management (CRUD + images)
- Order management
- Revenue reports & charts

### Admin
- Full dashboard with analytics
- User management (activate/deactivate, approve sellers)
- Order management & status updates
- Product oversight
- Sales reports

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | Next.js 14, Tailwind CSS, Recharts |
| Backend    | Node.js, Express         |
| Database   | MongoDB + Mongoose        |
| Auth       | JWT                      |
| Payments   | Stripe                   |
| Images     | Cloudinary               |
| Email      | Nodemailer (SMTP)         |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/products | List products (with filters) |
| GET | /api/products/:id | Product detail |
| POST | /api/cart | Add to cart |
| POST | /api/orders | Place order |
| GET | /api/orders/my | My orders |
| GET | /api/admin/stats | Admin dashboard stats |
| GET | /api/seller/stats | Seller dashboard stats |

Full API documentation available at `/api/health` when server is running.

---

## Deployment

- **Backend**: Deploy to Railway, Render, or AWS EC2
- **Frontend**: Deploy to Vercel (recommended for Next.js)
- **Database**: MongoDB Atlas (free tier available)
- **Images**: Cloudinary (free tier: 25 GB storage)
