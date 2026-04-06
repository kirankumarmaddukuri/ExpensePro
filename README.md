# 📊 Expense Tracker Application

A comprehensive full-stack Personal Finance Management Application designed to help you track your income and expenses securely and efficiently.

## 🌟 Features

- **Real-Time Dashboard**: Get an instant overview of your financial health with interactive charts and summaries.
- **Transaction Management**: Add, edit, and delete income and expense records seamlessly.
- **Advanced Analytics**: Visualize your spending habits over time with beautiful, responsive charts.
- **Secure Authentication**: User registration and login powered by robust JWT (JSON Web Token) authentication and Spring Security.
- **Responsive UI**: A premium, responsive interface built with Material UI (MUI) that works perfectly on desktop and mobile devices.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Material UI (MUI), Emotion
- **State Management**: Redux Toolkit, React-Redux
- **Routing**: React Router DOM v6
- **Forms & Validation**: Formik, Yup
- **Data Visualization**: Chart.js, Recharts
- **HTTP Client**: Axios
- **Utilities**: date-fns, react-hot-toast

### Backend
- **Framework**: Spring Boot 3.2.0 (Java 17)
- **Security**: Spring Security, JWT (io.jsonwebtoken)
- **Database**: PostgreSQL
- **ORM & Migrations**: Spring Data JPA, Liquibase
- **Boilerplate Reduction**: Lombok
- **Build Tool**: Maven

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:

- [Java Development Kit (JDK) 17](https://adoptium.net/)
- [Maven](https://maven.apache.org/)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Database Setup
1. Ensure PostgreSQL is running.
2. Create a new database for the application (e.g., `expense_tracker`).
3. The database tables will be automatically generated and managed by Liquibase when the backend starts.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Update the `application.properties` or `application.yml` file (located in `src/main/resources`) with your PostgreSQL database credentials and JWT secret key.
3. Build and run the Spring Boot application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
   The backend API will typically start on `http://localhost:8080`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will start on the port provided by Vite (usually `http://localhost:5173`).

## 📁 Project Structure

```
expense-tracker/
├── backend/                # Spring Boot Java application
│   ├── src/main/java       # Source code and controllers
│   ├── src/main/resources  # Global configurations and Liquibase changelogs
│   └── pom.xml             # Maven dependencies
└── frontend/               # React application (Vite)
    ├── src/                # React components, pages, and Redux store
    ├── public/             # Static assets
    ├── package.json        # Node dependencies
    └── vite.config.js      # Vite configuration
```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
