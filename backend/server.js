require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const robotRoutes = require('./routes/robotRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/robots', robotRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend is running smoothly' });
});

// Socket.io integration
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Pass io to request object if needed in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Setup Port
const PORT = process.env.PORT || 5000;

// Start Server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
