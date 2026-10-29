# JSS ENTERPRISE - Tax Invoice & Billing System (InvoiceIQ)

A modern, full-stack GST tax invoice and billing web application built for **JSS ENTERPRISE** ("Precision | Power | Progress").

---

## 🔐 1. Admin Sign-In & Authentication

Access to the entire system (dashboard, bill creator, editor, exports, and APIs) is protected by admin authentication.

* **Default Username**: `adminjss`
* **Default Password**: `jss2026`

### Configuring in Vercel Environment Variables:
Go to your **Vercel Project Settings → Environment Variables**:
* `ADMIN_USERNAME`: Your custom admin username (defaults to `adminjss`)
* `ADMIN_PASSWORD`: Your custom admin password (defaults to `jss2026`)
* `AUTH_SECRET`: A long random secret string used for signing secure session cookies.

---

## ☁️ 2. Persistent Multi-Device Cloud Synchronization

By default, Vercel serverless functions have ephemeral local filesystems. To ensure **all invoices and updates are 100% permanent and instantly synced across all devices** (phone, tablet, office PC), choose **EITHER** of the options below in your Vercel Environment Variables:

### Option A: Upstash Redis / Vercel KV (Recommended - 1 Click on Vercel)
1. In your **Vercel Dashboard**, open your project.
2. Click the **Storage** tab.
3. Click **Create Database** → Select **KV (Powered by Upstash)**.
4. Click **Connect to Project**.
Vercel automatically injects:
* `KV_REST_API_URL`
* `KV_REST_API_TOKEN`

*(Or if you use a free Upstash database directly from [upstash.com](https://upstash.com), add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)*.

---

### Option B: MongoDB Atlas (Free Cloud Database)
1. Create a free shared cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user & network access rule (allow access from anywhere: `0.0.0.0/0`).
3. Under **Connect** → **Drivers**, copy the connection string.
4. Add to your Vercel Environment Variables:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/jss_enterprise?retryWrites=true&w=majority
```

---

## ⚡ 3. Features

* **5-Step Invoice Creation Wizard**:
  * Step 1: Invoice metadata (No, Date, Challan, PO, Place of supply)
  * Step 2: Buyer / Customer details (Name, Address, GSTIN, Contact)
  * Step 3: Product line items with real-time rate & quantity calculation
  * Step 4: Bank accounts & Tax configuration (CGST, SGST, IGST)
  * Step 5: Summary review with automatic conversion of Grand Total to words (Indian numbering system)
* **Responsive Dual Viewer**:
  * Native Mobile Card View (optimized for mobile touchscreens without horizontal scroll)
  * Print-ready 800px A4 Invoice View with zoom & fit-width controls
* **Multiple Export Formats**:
  * High-resolution vector-quality PDF download
  * Zero-margin print dialog support
  * PNG image export via `html-to-image`
  * Microsoft Word (.docx) export with header banner
  * One-click formatted WhatsApp sharing
* **Live Cross-Device Sync**: Auto-refetches on window focus, with manual sync trigger on dashboard.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```
