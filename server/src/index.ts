// server/src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import http from 'http';
import { initWebSocket } from './websocket';
import { generalLimiter } from './middleware/rateLimiter';
import { xssProtection, noSQLProtection, securityLogger } from './middleware/securityMiddleware';
import { createEncryptionMiddleware } from './middleware/encryption';

// Route Import
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import searchRoutes from './routes/searchRoutes';
import userRoutes from './routes/userRoutes';
import teamRoutes from './routes/teamRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import commentRoutes from './routes/commentRoutes';
import authRoutes from './routes/authRoutes';
import timeLogRoutes from './routes/timeLogRoutes';
import productivityRoutes from './routes/productivityRoutes';
import productMaintenanceRoutes from './routes/productMaintenanceRoutes';
import maintenanceTaskRoutes from './routes/maintenanceTaskRoutes';
import osticketRoutes from './routes/osticketRoutes';

// Configurations
dotenv.config();
const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Encrypted'],
  exposedHeaders: ['X-Encrypted']
};
app.use(cors(corsOptions)); // Use the new options

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "http:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Security logging middleware
app.use(securityLogger);

// NoSQL injection protection
app.use(noSQLProtection);

// XSS protection middleware
app.use(xssProtection);

app.use(express.json({ limit: '10mb' }));
app.use(morgan('common'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, '../public')));

// Optional application-layer encryption (enabled when client sends X-Encrypted: v1)
app.use(createEncryptionMiddleware());

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the Project Management API');
});

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/search', searchRoutes);
app.use('/users', userRoutes)
app.use('/teams', teamRoutes);
app.use('/attachments', attachmentRoutes);
app.use('/comments', commentRoutes);
app.use('/timelogs', timeLogRoutes);
app.use('/productivity', productivityRoutes);
app.use('/product-maintenance', productMaintenanceRoutes);
app.use('/maintenance-tasks', maintenanceTaskRoutes);
app.use('/osticket', osticketRoutes);

// Server
const port = process.env.PORT || 8008;
const server = http.createServer(app);

// Initialize WebSocket Server
initWebSocket(server);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})