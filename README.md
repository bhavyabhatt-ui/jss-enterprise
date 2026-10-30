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
* `AUTH_SECRET`: A secure secret string used for signing cookies.

---

## ☁️ 2. Persistent Multi-Device Cloud Synchronization (Vercel In-App DB)

To ensure **all invoices and updates are 100% permanent and instantly synced across all devices** (phone, tablet, office PC), choose any of the native Vercel Storage options:

### Option A: Vercel KV (Recommended - 1 Click on Vercel)
1. In your **Vercel Dashboard**, open your project.
2. Click the **Storage** tab.
3. Click **Create Database** → Select **KV (Powered by Upstash)**.
4. Click **Connect to Project**.
Vercel automatically injects:
* `KV_REST_API_URL`
* `KV_REST_API_TOKEN`

*(Or if you use Upstash Redis directly from [upstash.com](https://upstash.com), set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)*.

---

### Option B: Vercel Postgres / Neon Serverless (1 Click on Vercel)
1. In your **Vercel Dashboard**, go to **Storage** tab.
2. Click **Create Database** → Select **Postgres (Neon)**.
3. Connect it to your project.
Vercel automatically injects `POSTGRES_URL`. The app will automatically initialize the database table and sync all bills.

---

### Option C: Vercel Blob (1 Click on Vercel)
1. In your **Vercel Dashboard**, go to **Storage** tab.
2. Click **Create Database** → Select **Blob**.
3. Connect it to your project.
Vercel automatically injects `BLOB_READ_WRITE_TOKEN`.

---

## ⚡ 3. Features

* **6-Step Modular Bill Creation Wizard**:
  * Step 1: Editable Company Header (JSS Enterprise branding, GSTIN, Address, Contact)
  * Step 2: Invoice Info (Invoice No, Date, Challan, PO, Place of Supply)
  * Step 3: Buyer Details with **Smart Autocomplete & Recommendations from past bills**
  * Step 4: Product Items with **Past Bill Product Autofill**, HSN codes, and auto GST calculation
  * Step 5: Bank details & Terms configuration
  * Step 6: Summary preview with automatic Number-to-Words conversion in Indian numbering
* **Financial Analytics Dashboard**:
  * Total Invoices, Total Gross Revenue, Net Taxable Value, Total GST Tax Collected, Average Bill Value, This Month's bills
  * GST Tax Breakdown (CGST, SGST, IGST progress bars)
  * Top 5 Buyers / Customers Leaderboard
* **List Sorting & Filtering**:
  * Sort by Date (Newest/Oldest), Amount (High/Low), Invoice No, and Customer Name
  * Filter by Time Period (All Time, This Month, Last Month, This Financial Year)
* **Responsive Dual Viewer**:
  * Native Mobile Card View (optimized for mobile touchscreens without horizontal scroll)
  * Print-ready 800px A4 Invoice View with zoom & fit-width controls
* **Multiple Export Formats**:
  * High-resolution vector-quality PDF download
  * Zero-margin print dialog support
  * PNG image export via `html-to-image`
  * Microsoft Word (.docx) export with header banner
  * One-click formatted WhatsApp sharing with full bill breakdown
* **Live Cross-Device Sync**: Auto-refetches on window focus, visibility change, and active 2.5-second live polling.

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
