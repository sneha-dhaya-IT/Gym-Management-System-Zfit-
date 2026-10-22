# ZFit - Gym Management System

ZFit is a full-featured **Gym Management System** designed to streamline gym operations and provide a secure, modern platform for both staff and members.  
This repository contains both the **backend API** and **frontend application** in a monorepo structure.

---

## 📂 Project Structure

```
/project-root
  ├── backend/   # Express + Node.js API
  ├── frontend/  # Next.js web app
  ├── docs /     # Documentation
  └── .gitignore # Git ignore rules for both apps
```

---

## 🚀 Features

- **Highly Secure User Management System** – Encrypted credentials, role-based access control, and session protection.
- **Member Management System** – Add, edit, search, and manage gym members with ease.
- **Membership Management System** – Flexible membership plans with auto-renewal and expiry reminders.
- **Payment & Finance Management** – Track payments, invoices, and financial reports.
- **Attendance & Access Control System** – Integrated with QR codes or card scanning for secure check-ins.
- **Inventory Management System** – Monitor and manage gym equipment and supplies.
- **Member Progress Tracking** – Record workout stats, goals, and progress over time.
- **Staff Management & Shift Scheduling** – Assign roles, manage staff data, and schedule shifts.

---

## 🛠️ Tech Stack

### **Backend**
- **Node.js** + **Express.js**
- MongoDB (or other database)
- JWT Authentication
- REST API architecture

### **Frontend**
- **Next.js** (React)
- Tailwind CSS / shadcn/ui (optional UI library)
- API integration with backend services

---

## 📦 Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/gaindunuhansith/ZFit.git
   cd zfit
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

---

## ⚙️ Environment Setup

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend `.env` Example**
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/zfit
JWT_SECRET=your_jwt_secret
```

**Frontend `.env.local` Example**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## ▶️ Running the App

**Start Backend**
```bash
cd backend
npm run dev
```

**Start Frontend**
```bash
cd frontend
npm run dev
```



