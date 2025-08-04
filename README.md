# 🚀 Project Management Application (PM-App)

A comprehensive project management system built with modern web technologies, featuring real-time collaboration, time tracking, and advanced reporting capabilities.

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
- **Built-in Timer** - Start/stop timers for tasks with automatic time logging
- **Time Log Management** - Detailed time tracking with comments and work descriptions
- **Developer Productivity Reports** - Monthly productivity analytics with time logged and task completion metrics
- **Work Session Comments** - Add detailed descriptions when stopping timers

### 📊 Advanced Reporting & Analytics
- **Project Recap Reports** - Comprehensive project portfolio analysis
- **Story Points Tracking** - Agile story point management and reporting
- **Time Analytics** - Detailed time logging analysis across projects and developers
- **PDF Export** - Professional PDF reports with customizable columns
- **Filtering & Search** - Advanced filtering by status, date ranges, and project criteria

### 👥 User Management & Security
- **Role-Based Access Control** - Admin and regular user permissions
- **User Authentication** - Secure JWT-based authentication system
- **Profile Management** - User profiles with avatar support
- **Audit Trail** - Complete audit logging for all system changes

### 🎨 User Interface & Experience
- **Modern Dark/Light Theme** - Toggle between dark and light modes
- **Responsive Design** - Fully responsive across desktop, tablet, and mobile
- **Intuitive Dashboard** - Clean, modern interface with easy navigation
- **Real-time Notifications** - Toast notifications for user actions
- **File Attachments** - Upload and manage task attachments

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
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM
- **[MySQL](https://www.mysql.com/)** - Relational database
- **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)** - Real-time communication
- **[JWT](https://jwt.io/)** - JSON Web Tokens for authentication
- **[Bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing
- **[Multer](https://github.com/expressjs/multer)** - File upload handling

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

# Server Configuration
PORT=8000
NODE_ENV="development"

# CORS Configuration
CLIENT_URL="http://localhost:3000"

# File Upload Configuration
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760" # 10MB in bytes
```

### Client Environment Variables

Create a `.env.local` file in the `client` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"

# WebSocket Configuration
NEXT_PUBLIC_WS_URL="ws://localhost:8000"
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
   Server will run on `http://localhost:8000`

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
│   │   │   ├── Modal*/             # Modal components
│   │   │   ├── TaskCard/           # Task display components
│   │   │   └── UserCard/           # User display components
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
│   │   │   ├── authController.ts   # Authentication logic
│   │   │   ├── projectController.ts # Project management
│   │   │   ├── taskController.ts   # Task management
│   │   │   ├── userController.ts   # User management
│   │   │   ├── timeLogController.ts # Time tracking
│   │   │   └── productivityController.ts # Analytics
│   │   ├── middleware/             # Express middleware
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
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Project Management
- `GET /projects` - Get all projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project by ID
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Soft delete project

### Task Management
- `GET /tasks` - Get all tasks
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get task by ID
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Time Tracking
- `POST /time-logs/start` - Start timer for task
- `POST /time-logs/stop` - Stop timer and log time
- `GET /time-logs` - Get time logs
- `GET /time-logs/user/:userId` - Get user's time logs

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

- **Real-time Collaboration** with WebSocket integration
- **Advanced Time Tracking** with detailed work session logging
- **Comprehensive Reporting** with PDF export capabilities
- **Story Points Management** for Agile development workflows
- **Audit Trail System** for complete change tracking
- **File Upload Support** for task attachments
- **Responsive Design** optimized for all devices
- **Dark/Light Theme** toggle for user preference

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

- [ ] Mobile application (React Native)
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Advanced Gantt chart features
- [ ] API rate limiting
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Internationalization (i18n)

## 📞 Support

For support, email support@pm-app.com or create an issue in the GitHub repository.

---

**Built with ❤️ by the PM-App Team**

*Empowering teams to manage projects efficiently with modern web technologies.*
