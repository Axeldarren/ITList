# 🚀 Project Management Application (ITList)

ITList is a comprehensive project management system built with modern web technologies, featuring real-time collaboration, time tracking, and advanced reporting capabilities.

![Project Management Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange)

## 📋 Table of Contents

- [System Modules & Features](#-system-modules--features)
- [Tech Stack](#️-tech-stack)
- [Key Library Versions](#-key-library-versions)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [Support](#-support)

## 🧩 System Modules & Features

The application is architected into several core modules to ensure scalability, maintainability, and clear separation of concerns:

### 1. 🔐 Authentication & Security Module
- **Secure Access:** JWT-based user authentication and secure session management.
- **Enterprise-Grade Protection:** Automated XSS prevention, SQL/NoSQL injection protection, progressive rate limiting against brute-force attacks, and input sanitization.
- **Password Security:** Bcrypt hashing with configurable strength requirements.

### 2. 👥 User & Role Management Module
- **Role-Based Access Control (RBAC):** Differentiates between Admin and Regular Users. Admins possess elevated privileges, such as creating entities without pre-existing support tickets.
- **Profile Management:** Complete profile management with secure avatar uploads.
- **Security Audit Trails:** Comprehensive event logging for all critical system changes and administrative actions.

### 3. 🏢 Project Management Module
- **Lifecycle Tracking:** Complete project tracking from Start → OnProgress → Resolve → Finish → Cancel.
- **Progress Tracking:** Dynamic visual indicators and percentage-based completion metrics.
- **Version Control:** Project entity versioning with access to historical, archived versions.

### 4. ✅ Task Management Module
- **Task Orchestration:** Granular task creation, assignments, and priority leveling (Urgent, High, Medium, Low, Backlog).
- **Interactive Visual Timelines:** Gantt chart and kanban-style board views for tracking dependencies and schedules.
- **Workflow Organization:** Standardized, automated status pipelines (To Do, Work In Progress, Under Review, Completed).

### 5. ⏱️ Time Tracking & Logging Module
- **Unified Distributed Timer:** Cross-platform live timer system utilizing WebSockets to broadcast running state globally.
- **Contextual Logging:** Time logs enforce mandatory descriptive work session comments.
- **Time Aggregation:** Cumulative duration metrics dynamically calculated across tasks, comprehensive projects, and team members.

### 6. 💬 Comments & Collaboration Module
- **Contextual Feedback:** Integrated messaging and feedback loops on tasks and specific work sessions.
- **File Management:** Secure file attachment and storage capabilities bound to project and task entities.
- **Activity Feeds:** Real-time push updates on state changes and entity modifications.

### 7. 🤝 Team Management Module
- **Resource Allocation:** Structured grouping of users into distinct functional teams and departments.
- **Assignment Routing:** Automated tools to assign team pools seamlessly to active projects.

### 8. 📊 Reporting & Analytics Module
- **Multi-Level Approval Workflows:** Generate hierarchical PDF reports bound to specific digital approval tiers (e.g., IT Supervisor, IT Department Head, IT Division Head).
- **Developer Productivity Stats:** Measure workflow efficiency utilizing weekly and monthly analytical snapshots.
- **Dynamic Spreadsheets:** Export categorized department activities instantly into auto-formatted Excel spreadsheets.

### 9. 🛠️ Product Maintenance Module
- **Asset Maintenance Workflows:** Specialized subsystem exclusively for organizing, scheduling, and logging IT product maintenance tasks.
- **Dedicated Telemetry:** Employs the same unified timing architecture to safely quarantine maintenance metrics apart from primary production projects.

### 10. 🎨 Theme Configuration & UI Module
- **Appearance Matrix:** Modern Dark/Light mode thematic toggles via persistent local storage.
- **Responsive Architecture:** Fully reactive layouts catering to Desktop, Tablet, and Mobile ecosystems.
- **State Feedback:** Engaging loading transitions, skeleton animations, and dynamic toast notification alerts.

### 11. 🔔 Notification & Real-Time Module
- **Live Event Broadcasting:** Utilizes WebSockets to instantly broadcast system state changes, such as live active timers and organizational collaboration flows, across all connected client sessions.
- **In-App Toast Alerts:** Provides dynamic, immediate, and non-intrusive feedback regarding the success, processing, or failure states of critical user actions.
- **Centralized Activity Tracking:** Aggregates individual system events into readable activity feeds so users can effortlessly stay updated on continuous project progress without needing manual page refreshes.

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15.3.3](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Redux Toolkit](https://redux-toolkit.js.org/)** - State management with RTK Query
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Modern icon library
- **[React Hot Toast](https://react-hot-toast.com/)** - Elegant notifications
- **[Date-fns](https://date-fns.org/)** - Modern date utility library
- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF generation
- **[xlsx](https://github.com/SheetJS/sheetjs)** - Excel export (dynamic import)
- **[Gantt Task React](https://github.com/MaTeMaTuK/gantt-task-react)** - Gantt chart component

### Backend
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express.js](https://expressjs.com/)** - Web application framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe server development
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM with unified data modeling
- **[MySQL](https://www.mysql.com/)** - Relational database
- **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)** - Real-time communication
- **[JWT](https://jwt.io/)** - JSON Web Tokens for secure authentication
- **[Bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Advanced password hashing
- **[Multer](https://github.com/expressjs/multer)** - File upload handling
- **[Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)** - Rate limiting middleware
- **[Express Validator](https://express-validator.github.io/)** - Input validation and sanitization
- **[Helmet](https://helmetjs.github.io/)** - Security headers and XSS protection
- **[Express Mongo Sanitize](https://github.com/fiznool/express-mongo-sanitize)** - NoSQL injection prevention
- **[XSS](https://github.com/leizongmin/js-xss)** - Cross-site scripting protection
- **[Validator](https://github.com/validatorjs/validator.js)** - String validation and sanitization

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Nodemon](https://nodemon.io/)** - Development server auto-restart
- **[Concurrently](https://github.com/open-cli-tools/concurrently)** - Run multiple commands

## 🧩 Key Library Versions

### Frontend

- next: 15.3.3
- react: 18.3.1
- @reduxjs/toolkit: 2.8.2
- react-redux: 9.2.0
- @mui/material: 7.1.1
- @mui/x-data-grid: 8.5.0
- tailwindcss: 4.1.8
- lucide-react: 0.513.0
- date-fns: 4.1.0
- react-hot-toast: 2.5.2
- xlsx: 0.18.5
- gantt-task-react: 0.3.9
- jspdf: 3.0.1
- jspdf-autotable: 5.0.2
- lodash: 4.17.21
- numeral: 2.0.6

### Backend

- express: 4.17.1
- prisma: 6.9.0
- @prisma/client: 6.9.0
- mysql2: 3.14.3
- bcryptjs: 3.0.2
- jsonwebtoken: 9.0.2
- multer: 2.0.1
- helmet: 8.1.0
- express-rate-limit: 8.0.1
- express-validator: 7.2.1
- ws: 8.18.3
- dotenv: 16.5.0
- cors: 2.8.5
- validator: 13.15.15

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **MySQL** database server
- **Git** for version control

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Axeldarren/PM-App.git
   cd PM-App
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd ../server
   npm install
   ```

## ⚙️ Environment Setup

### Server Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/projectmanagement"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
JWT_COOKIE_EXPIRES_IN="7" # Days

# Server Configuration
PORT=8008
NODE_ENV="development"

# CORS Configuration
CLIENT_URL="http://localhost:3000"

# File Upload Configuration
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760" # 10MB in bytes

# Security Configuration
BCRYPT_SALT_ROUNDS="12"
RATE_LIMIT_WINDOW="15" # Minutes
RATE_LIMIT_MAX_REQUESTS="100"
LOGIN_RATE_LIMIT_MAX="5"
```

### Client Environment Variables

Create a `.env.local` file in the `client` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:8008"
```

Notes:
- WebSocket URL is derived from `NEXT_PUBLIC_API_BASE_URL` (http → ws), no extra env required.

## 🗄️ Database Setup

1. **Create MySQL Database**
   ```sql
   CREATE DATABASE projectmanagement;
   ```

2. **Run Prisma Migrations**
   ```bash
   cd server
   npx prisma migrate dev
   ```

3. **Seed the Database** (Optional)
   ```bash
   npm run seed
   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:8008`

2. **Start the Frontend Application**
   ```bash
   cd client
   npm run dev
   ```
   Application will run on `http://localhost:3000`
   
   Optional:
   ```bash
   npm run lint
   ```

### Production Mode

1. **Build and Start Backend**
   ```bash
   cd server
   npm run build
   npm start
   ```

2. **Build and Start Frontend**
   ```bash
   cd client
   npm run build
   npm start
   ```

## 📁 Project Structure

```
project-management-app/
├── client/                          # Frontend Next.js application
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── (dashboard)/         # Dashboard routes
│   │   │   │   ├── home/           # Home dashboard
│   │   │   │   ├── projects/       # Project management
│   │   │   │   ├── product-maintenance/ # IT product maintenance system
│   │   │   │   ├── reporting/      # Analytics & reports
│   │   │   │   ├── timeline/       # Gantt timeline
│   │   │   │   ├── users/          # User management
│   │   │   │   ├── teams/          # Team management
│   │   │   │   ├── assignments/    # Task assignments
│   │   │   │   └── settings/       # Application settings
│   │   │   ├── login/              # Authentication
│   │   │   └── layout.tsx          # Root layout
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Header/             # Navigation header
│   │   │   ├── Sidebar/            # Navigation sidebar
│   │   │   ├── LoadingSpinner/     # Loading animations and spinners
│   │   │   ├── Skeleton/           # Loading skeleton components
│   │   │   ├── Modal*/             # Modal components (Task, User, Maintenance, Signatures)
│   │   │   ├── ModalSignatureSelect/ # Individual project signature selection (IT Supervisor + Department Head)
│   │   │   ├── ModalRecapSignatureSelect/ # Recap report signature selection (IT Division Head + Department Head)
│   │   │   ├── TaskCard/           # Task display components
│   │   │   ├── UserCard/           # User display components
│   │   │   ├── ProductMaintenanceCard/ # Maintenance item display
│   │   │   ├── MaintenanceTaskCard/ # Maintenance task display
│   │   │   └── AttachmentViewer/   # File attachment viewer
│   │   ├── lib/                    # Utility libraries
│   │   │   ├── pdfGenerator.ts     # Legacy PDF report generation
│   │   │   ├── projectDetailPdfGenerator.ts # Individual project reports (IT Supervisor + Department Head)
│   │   │   ├── recapPdfGenerator.ts # Multi-project recap reports (IT Division Head + Department Head)
│   │   │   ├── productivityReportGenerator.ts # Developer productivity analytics
│   │   │   └── utils.ts            # Helper functions
│   │   └── state/                  # Redux state management
│   │       ├── api.ts              # RTK Query API definitions
│   │       ├── authSlice.ts        # Authentication state
│   │       └── index.tsx           # Store configuration
│   ├── package.json
│   └── tailwind.config.ts
│
├── server/                          # Backend Node.js application
│   ├── prisma/                     # Database schema & migrations
│   │   ├── migrations/             # Database migration files
│   │   ├── schema.prisma           # Prisma schema definition
│   │   ├── seed.ts                 # Database seeding script
│   │   └── seedData/               # Seed data JSON files
│   ├── public/uploads/             # File upload storage
│   ├── src/
│   │   ├── controller/             # Route controllers
│   │   │   ├── authController.ts   # Secure authentication logic
│   │   │   ├── projectController.ts # Project management
│   │   │   ├── taskController.ts   # Task management
│   │   │   ├── userController.ts   # User management with security
│   │   │   ├── timeLogController.ts # Unified time tracking
│   │   │   ├── productMaintenanceController.ts # Maintenance management
│   │   │   ├── commentController.ts # Comment system with time linking
│   │   │   └── productivityController.ts # Analytics & reporting
│   │   ├── middleware/             # Express middleware
│   │   │   ├── authMiddleware.ts   # JWT authentication
│   │   │   ├── rateLimiter.ts      # Rate limiting & DDoS protection
│   │   │   └── securityMiddleware.ts # XSS, validation, monitoring
│   │   ├── routes/                 # API route definitions
│   │   ├── index.ts                # Server entry point
│   │   └── websocket.ts            # WebSocket server
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                        # Project documentation
```

## 🔌 API Documentation

### Authentication Endpoints
- `POST /auth/login` - Secure user login with rate limiting
- `GET /auth/verify` - JWT token verification
- `GET /auth/logout` - User logout and session termination

### Project Management
- `GET /projects` - Get all projects with time aggregation
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project by ID with total time logged
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Soft delete project

### Task Management
- `GET /tasks` - Get all tasks
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get task by ID
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Unified Time Tracking System
- `POST /timelogs/start` - Start timer for task or maintenance
- `POST /timelogs/stop` - Stop timer with mandatory comment
- `GET /timelogs` - Get time logs with comment details
- `GET /timelogs/running` - Get currently running timers
- `GET /timelogs/user/:userId` - Get user's time logs

### Product Maintenance System
- `GET /product-maintenance` - Get all maintenance items
- `POST /product-maintenance` - Create maintenance item
- `GET /product-maintenance/:id` - Get maintenance item details
- `POST /product-maintenance/:id/tasks` - Create maintenance task
- `POST /maintenance-tasks/:id/timer/start` - Start maintenance timer
- `POST /maintenance-tasks/:id/timer/stop` - Stop maintenance timer

### Security & User Management
- `GET /users` - Get users (password-excluded responses)
- `POST /users` - Create user with validation and sanitization
- `GET /users/:id` - Get user by ID (secure response)
- `PUT /users/:id` - Update user with input validation

### Analytics & Reporting
- `GET /productivity/developer-stats` - Get developer productivity metrics
- `GET /projects/versions` - Get all project versions
- `POST /reports/project-detail` - Generate individual project PDF reports
- `POST /reports/project-recap` - Generate comprehensive project portfolio reports
- `GET /search` - Global search across projects and tasks


## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting with Prettier
- Write meaningful commit messages
- Add comments for complex logic
- Ensure responsive design compatibility

## 📸 Screenshots

### Dashboard
![DashboardOverview](https://github.com/user-attachments/assets/cd7fd91c-e658-4d82-9544-568d8d13fbba)

### Project Management
![ProjectCreation](https://github.com/user-attachments/assets/e3cf4d9f-c09e-4e39-80f1-a39b1491205f)

### Task Management
![TaskManagement](https://github.com/user-attachments/assets/ba50b7ce-60d6-4a9c-a6e7-86d025102928)

### Time Tracking
![TimeTracking](https://github.com/user-attachments/assets/ef302439-f30a-4933-bda1-5faa0b2b13de)

### Reporting & Analytics
![ReportingAnalytics](https://github.com/user-attachments/assets/d0a29e4e-0612-4768-bdbb-441b007c4534)

### Gantt Timeline
![Timeline](https://github.com/user-attachments/assets/4b6a8f22-4450-4fc7-887e-7466a0a0f63d)


## 🎯 Future Enhancements

- [ ] **Advanced PDF Customization** - Custom report templates and branding options
- [ ] **Digital Signature Integration** - Electronic signature capture and validation
- [ ] **Automated Report Scheduling** - Scheduled PDF report generation and distribution
- [ ] **Client-side Encryption** - End-to-end encryption for sensitive data transmission
- [ ] **Mobile Application** - React Native implementation for iOS and Android
- [ ] **Email Notifications** - SMTP integration for task and deadline alerts
- [ ] **Calendar Integration** - Sync with Google Calendar, Outlook, and other providers
- [ ] **Advanced Gantt Features** - Dependencies, critical path analysis, and resource allocation
- [ ] **Docker Containerization** - Complete containerization for easy deployment
- [ ] **CI/CD Pipeline** - Automated testing and deployment workflows
- [ ] **Internationalization (i18n)** - Multi-language support
- [ ] **Advanced Analytics** - Machine learning-powered productivity insights
- [ ] **API Documentation Portal** - Interactive Swagger/OpenAPI documentation
- [ ] **Advanced File Management** - Version control for file attachments
- [ ] **Backup & Recovery** - Automated database backup and disaster recovery

## 📞 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ by Me (Axeldarren)**

*Empowering teams to manage projects efficiently with modern web technologies and enterprise-grade security.*
