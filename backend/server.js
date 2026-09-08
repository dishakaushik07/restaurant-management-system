 require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./src/config/db');

// ==========================================
// ROUTES IMPORTS (BE1 & BE2 Combined)
// ==========================================
// BE1 Routes
const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const robotRoutes = require('./src/routes/robotRoutes');

// BE2 Routes (Menu, KDS, Fleet, Guest)
const categoryRoutes = require('./src/routes/categoryRoutes');
const menuItemRoutes = require('./src/routes/menuItemRoutes');
const kdsRoutes = require('./src/routes/kdsRoutes');
const fleetRoutes = require('./src/routes/fleetRoutes');
const guestRoutes = require('./src/routes/guestInteractionRoutes');

// Initialize Express app & HTTP Server for Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Connect to Database
connectDB();

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Make 'io' accessible inside controllers via req.io
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ==========================================
// API ROUTES REGISTRATION
// ==========================================
// BE1 Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/robots-legacy', robotRoutes);

// BE2 Endpoints (Menu, KDS, Fleet, Guest)
app.use('/api/menu/categories', categoryRoutes);
app.use('/api/menu/items', menuItemRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/fleet', fleetRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'SIH Restaurant Unified Backend is running smoothly!' });
});

// ==========================================
// SOCKET.IO CONNECTION
// ==========================================
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error("Global Error:", err.message);
    res.status(err.statusCode || 500).json({ 
        success: false, 
        message: err.message || "Internal Server Error" 
    });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});