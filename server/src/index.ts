// server/src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Route Import
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import searchRoutes from './routes/searchRoutes';
import userRoutes from './routes/userRoutes';
import teamRoutes from './routes/teamRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import commentRoutes from './routes/commentRoutes';
import authRoutes from './routes/authRoutes';

// Configurations
dotenv.config();
const app = express();

const corsOptions = {
  origin: 'http://localhost:3000', // Your frontend's address
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions)); // Use the new options

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

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

// Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})