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
- **Project Recap Reports** - Comprehensive project portfolio analysis
- **Story Points Tracking** - Agile story point management and reporting
- **Time Analytics** - Detailed time logging analysis across projects and developers
- **PDF Export** - Professional PDF reports with customizable columns
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

# WebSocket Configuration
NEXT_PUBLIC_WS_URL="ws://localhost:8008"
```

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
│   │   │   ├── Modal*/             # Modal components (Task, User, Maintenance)
│   │   │   ├── TaskCard/           # Task display components
│   │   │   ├── UserCard/           # User display components
│   │   │   ├── ProductMaintenanceCard/ # Maintenance item display
│   │   │   ├── MaintenanceTaskCard/ # Maintenance task display
│   │   │   └── AttachmentViewer/   # File attachment viewer
│   │   ├── lib/                    # Utility libraries
│   │   │   ├── pdfGenerator.ts     # PDF report generation
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
![Dashboard Overview - Home page with task overview and timer functionality]

### Project Management
![Project Management - Project creation, editing, and team assignment]

### Task Management
![Task Management - Task creation, editing, and assignment with attachments]

### Time Tracking
![Time Tracking - Built-in timer with work session comments]

### Reporting & Analytics
![Reporting - Developer productivity and project recap reports]

### Gantt Timeline
![Timeline - Visual project timeline with Gantt chart representation]

## 🏆 Key Features Highlights

- **Enterprise-Grade Security** - XSS protection, SQL injection prevention, rate limiting, and input sanitization
- **Unified Timer Architecture** - Single comprehensive timer system for tasks and maintenance operations
- **Real-time Collaboration** - WebSocket integration with live timer broadcasting and updates
- **Advanced Time Tracking** - Comment-linked time logs with total aggregation across projects
- **Product Maintenance System** - Complete IT product maintenance workflow management
- **Comprehensive Reporting** - PDF export capabilities with detailed analytics
- **Story Points Management** - Agile development workflow support
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
