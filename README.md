# LYNTRIX IT SERVICES

> **Smart Solutions. Stronger Tomorrow.**  
> *Innovate • Integrate • Elevate*

[![Repository](https://img.shields.io/badge/GitHub-raveeshaheshan%2Flyntrix-cyan?style=for-the-badge&logo=github)](https://github.com/raveeshaheshan/lyntrix.git)
[![Database](https://img.shields.io/badge/Firebase-Cloud%20Firestore-orange?style=for-the-badge&logo=firebase)](https://github.com/raveeshaheshan/lyntrix.git)
[![Status](https://img.shields.io/badge/SOC-24%2F7%20Online-emerald?style=for-the-badge&logo=shield)](https://github.com/raveeshaheshan/lyntrix.git)

---

## 🚀 Overview

**LYNTRIX IT Services** is an enterprise-grade digital platform and technology suite delivering custom software development, cloud infrastructure architecture, zero-trust cybersecurity, strategic IT consulting, and 24/7 managed services. 

The platform features a fully integrated **Hybrid Cloud Database Engine (Firebase Cloud Firestore)**, **Google OAuth 2.0 & Email Authentication**, an **Interactive Instant Cost Calculator**, a **Client Consultation Booking & Proposal Engine**, and a **Master Admin Sentinel Dashboard** for complete system governance.

---

## ✨ Key Platform Features

### 👤 User Authentication & Profile Governance
- **Multi-Factor Auth Suite**: Google OAuth 2.0 One-Tap & Email/Password sign in.
- **1-Click Magic Link Verification**: Automated OTP verification for account activation and instant password resets.
- **Client Workspace**: Manage corporate profile, company name, date of birth / founding date, contact details, and view active project proposals.
- **Password Security**: Eye logo toggle visibility on all password input fields.

### 💼 Interactive Service Estimator & Proposal Engine
- **Real-Time Project Cost Calculator**: Instant estimate calculation for Web Development, Cloud Infrastructure, Mobile Apps, Cybersecurity Shields, and Enterprise AI.
- **Free Consultation Scheduler**: Registered users can schedule a free technical consultation time slot with Lyntrix engineers.
- **Automated Nodemailer Dispatches**: Instant HTML email templates sent to clients upon proposal submission and admin approval.

### 🛡️ Master Admin Governance Console (`AdminDashboard.jsx`)
- **User Account Management**: Search, filter, inspect, edit client profiles, reset user passwords, delete accounts, and **Promote Registered Users to Admin** in Cloud DB.
- **Service & Add-on Price Editor**: Dynamic pricing adjustment for core services and optional features.
- **Client Proposals & Leads Control**: Review client inquiries, approve/reject proposals, and trigger automated confirmation emails to clients.
- **Admin DB Credentials**: Secure master admin access key management with eye-toggle password visibility.
- **Web Uptime & System Sentinel**: Real-time telemetry monitoring for Web Frontend, Cloud Firestore Database, SMTP Relay, and REST APIs, complete with a **90-Day Uptime Bar Timeline** and **Live Log Feed**.
- **Server Maintenance Mode Control Panel**: 1-Click broadcast for **Top Announcement Banner** or **Full Page Lock Overlay** with custom messages and ETA during platform upgrades.

---

## 📞 Contact Information

- **Official Email**: `lyntrixtec@gmail.com`
- **Phone / WhatsApp Hotline**: `+94 71 455 7857` (0714557857)

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Cloud Database** | Firebase Cloud Firestore + Local Storage Fallback Sync |
| **Authentication** | Google OAuth 2.0, Custom OTP Magic Verification |
| **Email Gateway** | Nodemailer (Gmail SMTP Relay) |
| **Typography & Styling** | Outfit, Inter, Fira Code, Glassmorphism UI Design System |

---

## 💻 Local Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/raveeshaheshan/lyntrix.git

# 2. Navigate to project directory
cd lyntrix

# 3. Install project dependencies
npm install

# 4. Start local development server
npm run dev
```

The application will launch locally at `http://localhost:3000`.

---

## 📜 License

Distributed under the ISC License. © 2026 **LYNTRIX IT SERVICES**. All rights reserved.

## Firebase setup

1. Create a project at https://console.firebase.google.com, then **Build → Firestore Database → Create database** (production mode).
2. **Project settings → Your apps → Web app**: copy the config into the `VITE_FIREBASE_*` variables (see `.env.example`), locally in `.env` and in Vercel → Settings → Environment Variables. Redeploy afterwards.
3. Publish the rules in `firestore.rules` (Firestore → Rules → paste → Publish, or `firebase deploy --only firestore:rules`).
4. Optional, to bring over existing data from Supabase: put `SUPABASE_URL` and `SUPABASE_KEY` in `.env`, then run
   `node scripts/migrate-supabase-to-firebase.mjs` (dry run) and `node scripts/migrate-supabase-to-firebase.mjs --write`.

> **Security note:** sign-in is handled by the app itself, so the rules must leave the five collections publicly readable and writable, exactly like the previous Supabase policies. Passwords are stored in plain text in `users` / `admins`. Moving sign-in to Firebase Authentication is the recommended next step.
