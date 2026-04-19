# 📈 Business Finance Management System (AI-Powered)

A professional, real-time financial tracking platform designed for small and medium businesses in Uzbekistan. It leverages AI to process voice and text transactions via Telegram and synchronizes them instantly with a premium web dashboard.

## 🚀 Live Demo
- **Web Dashboard**: [https://finance-manager-107o.onrender.com](https://finance-manager-107o.onrender.com)
- **Telegram Bot**: [Sizning Bot Usernamengizni shu yerga yozing]

---

## ✨ Key Features
- **🎙 AI Voice Processing**: Log transactions by talking naturally to the Telegram bot (powered by Groq Llama 3 & Whisper).
- **📊 Interactive Dashboard**: Real-time charts, analytics, and monthly dynamics visualization.
- **🛡 Secure Access**: Password-protected admin dashboard.
- **📄 Professional Export**: Generate detailed financial reports in **Excel** and **PDF** formats.
- **⚡ Real-time Sync**: Instant updates between the Bot and Web UI using Socket.io.
- **🇺🇿 Timezone Optimized**: Fully synchronized with Uzbekistan/Tashkent (UTC+5) time.

## 🛠 Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Recharts, Framer Motion.
- **Backend**: Node.js, Express, TypeScript, Socket.io.
- **Database**: PostgreSQL (Supabase) with Prisma ORM.
- **AI Engine**: Groq Cloud (Llama 3.3 70B & Whisper Large V3).
- **Deployment**: Render.com (Auto-deploy via GitHub).

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Supabase account (or any PostgreSQL)
- Groq API Key
- Telegram Bot Token

### 1. Clone the repository
```bash
git clone https://github.com/AmirTursunov/finance-manager.git
cd finance-manager
```

### 2. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="your_postgresql_url"
DIRECT_URL="your_direct_url"
ADMIN_PASSWORD="your_secure_password"
TELEGRAM_BOT_TOKEN="your_bot_token"
GROQ_API_KEY="your_groq_key"
VITE_API_URL="/api"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Project
```bash
npm run dev
```
The server will start on `http://localhost:3001` and the client on `http://localhost:5173`.

---

## 🏗 System Architecture
1. **Telegram Bot**: Receives voice/text -> Sends to Groq Cloud for NLP.
2. **AI Service**: Extracts amount, category, and intent -> Returns JSON.
3. **Prisma/PostgreSQL**: Stores the transaction securely.
4. **Socket.io**: Pushes a "transaction_updated" event to the Web Dashboard.
5. **React Frontend**: Re-fetches data and updates charts instantly.

---

## 👨‍💻 Developer
- **Name**: Amir Tursunov
- **Project**: Financial Management System for Business Automation
