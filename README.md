![Uploading image.png…]()
![image](https://github.com/user-attachments/assets/d4ab9688-58d3-4333-9a88-98a4b9264a92)



# 🧾 ShelfLife - Inventory Management System

[![Made with Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)](https://nodejs.org)
[![Frontend with Next.js](https://img.shields.io/badge/Frontend-Next.js-blue?logo=next.js)](https://nextjs.org)
[![MySQL](https://img.shields.io/badge/Database-MySQL-00758F?logo=mysql)](https://www.mysql.com/)
[![Deployment](https://img.shields.io/badge/Hosted%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **ShelfLife** is a full-stack inventory and expiry tracking system for small businesses and shop owners. It provides a clean dashboard, powerful stock tracking, and real-time alerts to prevent losses from expired or missing inventory.

---

## 🚀 Features

- 🔐 **User Authentication** (Register/Login with JWT)
- 📦 **Product Inventory Management**
- 🕒 **Expiry Tracking with Notifications**
- 📊 **Sales & Profit Analysis (Coming Soon)**
- 🧠 **Smart Suggestions for Restocking**
- 🧼 **Modern UI with Sidebar Navigation**
- 📁 Modular Code (Frontend + Backend separation)

---

## 📂 Tech Stack

| Layer       | Technology            |
|-------------|------------------------|
| Frontend    | Next.js (React), JSX, CSS |
| Backend     | Node.js, Express.js     |
| Database    | MySQL (hosted on Railway) |
| Auth        | JWT (Access + Refresh Tokens) |
| Hosting     | Vercel (Frontend), Railway (DB/API) |

---

## 🌐 Live Demo

> 🚧 **Live deployment coming soon**  
> Once deployed, the link will go here: [https://shelflife.vercel.app](https://shelflife.vercel.app)

---

## 📸 Screenshots

| Dashboard (with expiry view) | Add Product Modal |
|------------------------------|--------------------|
| ![dashboard](./screenshots/dashboard.png) | ![modal](./screenshots/add_product.png) |

---

## 🛠️ Installation (Local Setup)

```bash
# 1. Clone the repository
git clone https://github.com/haniajohar/inventory-management-system.git
cd inventory-management-system

# 2. Backend Setup
cd Backend
npm install
# Create a .env file (see .env.example or below)
npm start

# 3. Frontend Setup (if using Next.js App Directory structure)
cd ../
npm install
npm run dev

🧪 .env Example (Backend)
env
# MySQL Database
DB_HOST=your-database-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=inventory_db

# JWT Auth
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1d
NODE_ENV=development

# Email Alerts
EMAIL_USER=your@email.com
EMAIL_PASS=your-email-pass

 To-Do / Upcoming Features
📈 Graphs for Sales Trends

💸 Profit & Loss Auto Calculations

⏰ Cron Jobs for Daily Expiry Reminders

🔔 Email Notifications for Expiring Products

Author
Hania Johar
🔗 GitHub
📧 https://github.com/haniajohar

 Contributions
Pull requests are welcome! For major changes, open an issue first to discuss what you'd like to change.

If you like this project...
Please consider giving it a ⭐ on GitHub — it helps others find it and shows your support!

