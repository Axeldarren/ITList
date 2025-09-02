# 🚀 Project Management Application (ITList)

ITList is a comprehensive project management system built with modern web technologies, featuring real-time collaboration, time tracking, and advanced reporting capabilities.

![Project Management Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features (Latest)

- **Ticket Required for Non-Admins:** When creating a maintenance task, non-admin users must select a ticket; admins can create maintenance tasks without a ticket.
- **Unified Task & Maintenance Dashboard:** Maintenance tasks and regular tasks are displayed in unified DataGrid tables with consistent filtering and design.
- **Developer Productivity Analytics:** Advanced reporting and analytics for developer productivity, including weekly/monthly stats and time logs.
- **Improved Error Handling:** Fixed issues with read-only arrays in task sorting (e.g., using `[...filtered].sort(...)` to avoid mutation errors).
- **Consistent Toast Notifications:** Toast notifications respect dark mode and are shown in all major dashboard and login pages.
- **Error-Resistant UI:** UI now prevents common errors (e.g., sorting read-only arrays) and provides clear feedback for required fields.

## ✨ Features

### 🎯 Core Project Management
- **Project Creation & Management** - Create, edit, and manage projects with version control
- **Task Management** - Comprehensive task creation, assignment, and tracking
- **Team Collaboration** - Multi-user team management with role-based access
- **Real-time Updates** - WebSocket integration for live collaboration
- **Priority Management** - Organize tasks by priority levels (Urgent, High, Medium, Low, Backlog)

### ⏱️ Time Tracking & Productivity
- **Unified Timer System** - Single comprehensive timer for both regular tasks and maintenance operations
- **Real-time Timer Broadcasting** - Live timer updates via WebSocket across all connected clients
- **Advanced Time Logging** - Detailed time tracking with mandatory work session comments
- **Cross-platform Time Management** - Seamless timer functionality for tasks and maintenance activities
- **Total Time Aggregation** - Display cumulative time logged for tasks, projects, and maintenance items
- **Comment-linked Time Entries** - Associate detailed work descriptions with every time log
- **Developer Productivity Reports** - Monthly productivity analytics with comprehensive time metrics
- **Duration Formatting** - Human-readable time displays with smart formatting (hours, days, minutes)
- **Maintenance Time Tracking** - Specialized time tracking for IT product maintenance activities

### 📊 Advanced Reporting & Analytics
- **Project Recap Reports** - Comprehensive project portfolio analysis with executive-level signatures
- **Individual Project Reports** - Detailed project reports with departmental-level approval workflow
- **Weekly Report (Excel)** - Export department-based weekly activity with:
   - Scope selector: This week (projects with time logged) or All projects
   - Department grouping based on time log authors; a project can show under multiple departments
   - Bold headers, merged group titles, auto-filter, and a spacer row between groups
   - Filename includes a 6-character unique ID suffix
- **Story Points Tracking** - Agile story point management and reporting
- **Time Analytics** - Detailed time logging analysis across projects and developers
- **Professional PDF Export** - Multiple PDF report types with customizable columns and signature workflows
- **Signature Hierarchy System** - Role-based signature requirements (IT Supervisor, IT Department Head, IT Division Head)
- **Task Status Organization** - Categorized task reporting (To Do, Work In Progress, Under Review, Completed)
- **Completion Date Tracking** - Automated completion date capture for finished tasks
- **Filtering & Search** - Advanced filtering by status, date ranges, and project criteria

### 👥 User Management & Security
- **Role-Based Access Control** - Admin and regular user permissions
- **JWT Authentication** - Secure token-based authentication system
- **Advanced Security Protection** - XSS prevention, SQL injection protection, and input sanitization
- **Rate Limiting** - Brute force attack prevention with progressive delays
- **Security Monitoring** - Real-time threat detection and logging
- **Password Security** - Bcrypt hashing with strength validation
- **Profile Management** - User profiles with avatar support
- **Audit Trail** - Complete audit logging for all system changes

### ⚡ Enhanced Timer System & Maintenance
- **Unified Timer Architecture** - Single timer system for both regular tasks and maintenance operations
- **Product Maintenance Management** - Comprehensive maintenance task tracking for IT products
- **Maintenance Task Scheduling** - Create, assign, and track maintenance activities
- **Real-time Timer Broadcasting** - WebSocket-powered live timer updates across all clients
- **Comment-linked Time Logs** - Associate detailed work descriptions with time entries
- **Total Time Aggregation** - Display total time logged for tasks, projects, and maintenance items
- **Duration Formatting** - Human-readable time displays (e.g., "2h 30m", "1d 4h 15m")
- **Cross-platform Time Tracking** - Seamless timer functionality across regular and maintenance workflows

### 🎨 User Interface & Experience
- **Modern Dark/Light Theme** - Toggle between dark and light modes
- **Responsive Design** - Fully responsive across desktop, tablet, and mobile
- **Intuitive Dashboard** - Clean, modern interface with easy navigation
- **Real-time Notifications** - Toast notifications for user actions
- **File Attachments** - Upload and manage task attachments
- **Loading Animations** - Comprehensive loading states with skeletons and spinners
- **Smooth Transitions** - Fade-in animations and smooth page transitions

### 📈 Project Tracking Features
- **Gantt Chart Timeline** - Visual project timeline representation
- **Project Status Lifecycle** - Start → OnProgress → Resolve → Finish → Cancel
- **Version Control** - Project versioning with archived version access
- **Progress Tracking** - Visual progress indicators and completion percentages
- **Activity Feeds** - Real-time activity tracking across projects

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

## 👤 User Roles

### Admin Users
- Full system access
- User management capabilities
- Project creation and deletion
- Advanced reporting and analytics
- Team and assignment management

### Regular Users
- Project and task participation
- Time tracking and logging
- Comment and collaboration features
- Personal productivity tracking
- Limited reporting access

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

## 🏆 Key Features Highlights

- **Enterprise-Grade Security** - XSS protection, SQL injection prevention, rate limiting, and input sanitization
- **Unified Timer Architecture** - Single comprehensive timer system for tasks and maintenance operations
- **Real-time Collaboration** - WebSocket integration with live timer broadcasting and updates
- **Advanced Time Tracking** - Comment-linked time logs with total aggregation across projects
- **Product Maintenance System** - Complete IT product maintenance workflow management
- **Multi-tier PDF Reporting** - Professional PDF reports with role-based signature workflows
  - **Individual Project Reports** - IT Supervisor + IT Department Head approval
  - **Portfolio Recap Reports** - IT Division Head + IT Department Head approval
- **Task Status Organization** - Color-coded task categorization (To Do, In Progress, Under Review, Completed)
- **Automated Completion Tracking** - Automatic capture of task completion dates and timestamps
- **Story Points Management** - Agile development workflow support with story point analytics
- **Audit Trail System** - Complete change tracking and security monitoring
- **File Upload Support** - Secure file attachment handling for tasks
- **Responsive Design** - Optimized for all devices with modern UI/UX
- **Dark/Light Theme** - User preference toggle with persistent settings
- **Loading Animations** - Professional loading states with skeletons and spinners
- **Smooth Transitions** - Page animations and seamless user experience

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based Authentication** - Secure token system with configurable expiration
- **Role-based Access Control** - Admin and user permission levels
- **Session Management** - Secure cookie handling with httpOnly and sameSite flags

### Input Protection
- **XSS Prevention** - Real-time script injection detection and blocking
- **SQL Injection Protection** - Parameterized queries via Prisma ORM
- **Input Sanitization** - Comprehensive validation and cleaning of user inputs
- **NoSQL Injection Prevention** - Protection against NoSQL-based attacks

### Rate Limiting & DDoS Protection
- **Login Rate Limiting** - 5 attempts per 15 minutes with progressive delays
- **API Rate Limiting** - 100 requests per 15 minutes per IP address
- **Background Process Protection** - Automated request throttling

### Security Monitoring
- **Threat Detection** - Real-time suspicious activity monitoring
- **Security Logging** - Comprehensive audit trails for security events
- **IP Tracking** - Request origin tracking and logging
- **User Agent Analysis** - Browser fingerprinting for security assessment

### Data Protection
- **Password Security** - Bcrypt hashing with configurable salt rounds
- **Secure Headers** - Helmet.js implementation with CSP policies
- **CORS Configuration** - Controlled cross-origin resource sharing
- **File Upload Security** - Size limits and type validation

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
