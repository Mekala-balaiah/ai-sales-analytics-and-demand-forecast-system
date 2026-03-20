# AI Business Analytics Dashboard

> An intelligent, full-stack Business Analytics and Forecasting Dashboard.

## 🚀 Overview

The AI Business Analytics Dashboard is a comprehensive web application designed to help businesses upload their historical sales data, generate actionable insights using Google\'s Gemini AI, and mathematically forecast future trends. It features authenticated access, multi-business profile management, dynamic chart visualizations, and an integrated conversational AI assistant to query data directly on the dashboard.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework:** React 19 / Vite
- **Routing:** React Router DOM v7
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **State Management:** React Context API (Auth, Business, Analytics, Toast)

### Backend (Server)
- **Runtime Environment:** Node.js
- **Framework:** Express.js 5
- **Database:** MongoDB / Mongoose
- **Authentication:** JSON Web Tokens (JWT), `bcryptjs`
- **File Uploads & Parsing:** `multer`, `csv-parser`, `xlsx`
- **AI Integration:** Google Generative AI (`@google/generative-ai`)
- **Mathematical Forecasting:** `simple-statistics`

---

## 📂 Project Architecture

### Client-Side Structure (`/client/src/`)
- **`components/`**: Reusable UI parts (`Sidebar.jsx`, `TopNav.jsx`, `AIChatAssistant.jsx`).
- **`pages/`**: The core views of the application (`Auth.jsx`, `Dashboard.jsx`, `UploadCenter.jsx`, `Insights.jsx`, `Forecast.jsx`, `Analytics.jsx`, `BusinessSelect.jsx`, `Profile.jsx`).
- **`context/`**: Global state providers (`AuthContext.jsx`, `BusinessContext.jsx`, `AnalyticsContext.jsx`, `ToastContext.jsx`).
- **`utils/`**: Helper functions (`currencyFormatter.js`).

### Server-Side Structure (`/server/`)
- **`models/`**: MongoDB schemas defining the data structure (`User.js`, `Business.js`, `ParsedData.js`, `Analytics.js`).
- **`routes/`**: Express API endpoints (`authRoutes.js`, `businessRoutes.js`, `uploadRoutes.js`, `analyticsRoutes.js`).
- **`services/`**: Core backend logic decoupled from routes:
  - `parserService.js`: Handles parsing of CSV/XLSX.
  - `forecastingService.js`: Applies `simple-statistics` to predict future data.
  - `insightsService.js`: Integrates with `@google/generative-ai` to generate text insights.
  - `analyticsService.js`: Aggregates the processed data.
- **`middleware/`**: Request interceptors (`authMiddleware.js`).
- **`server.js`**: Application entry point, Express configuration, and database connection.

---

## 🌟 Key Features

1. **User Authentication & Business Management:** Secure login/registration. Users can create, select, and switch between different business profiles.
2. **Data Upload Strategy:** Supports uploading `.csv` and `.xlsx` files. The backend securely parses these files and stores the dataset mapped to the active business.
3. **Interactive Dashboard:** Utilizes `recharts` to display uploaded historical data alongside dynamically calculated forecast trajectories on shared axes.
4. **AI-Driven Insights:** Powered by Gemini AI, the app reads uploaded data and presents business owners with plain-language insights about growth, sales dips, and potential opportunities.
5. **AI Chat Assistant:** A deeply integrated context-aware chatbot capable of answering questions specifically regarding the user\'s uploaded dataset and generated forecasts.

---

## ⚙️ Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)
- Google Gemini API Key

### 1. Clone the repository
\`\`\`bash
git clone <repository_url>
cd <project_directory>
\`\`\`

### 2. Backend Setup
Navigate to the \`server\` directory:
\`\`\`bash
cd server
npm install
\`\`\`

Create a \`.env\` file in the \`server\` directory with the following variables:
\`\`\`env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai_sales_analytics
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
\`\`\`

Start the server:
\`\`\`bash
npm run dev
# The server will run at http://localhost:5000
\`\`\`

### 3. Frontend Setup
Open a new terminal and navigate to the \`client\` directory:
\`\`\`bash
cd client
npm install
\`\`\`

Start the Vite development server:
\`\`\`bash
npm run dev
# The client will run at http://localhost:5173
\`\`\`

---

## 📡 API Endpoints Overview

- **Auth (`/api/auth`)**
  - `POST /register`: Create a new user account.
  - `POST /login`: Authenticate standard users and return JWT.

- **Business (`/api/business`)**
  - `GET /`: Retrieve all businesses tied to the authenticated user.
  - `POST /`: Create a new business profile.

- **Uploads (`/api/upload`)**
  - `POST /`: Upload and process sales data for a specific business.

- **Analytics (`/api/analytics`)**
  - `GET /:businessId`: Returns aggregated data, AI insights, and forecasts for the requested business.
