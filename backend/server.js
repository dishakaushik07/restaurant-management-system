const express = require('express');
const cors = require('cors');
require('dotenv').config();

// (Agar tumhara DB config alag file mein hai, toh yahan import karo)
// const connectDB = require('./src/config/db'); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// 1. BE1 ROUTES (Team Leader ka kaam)
// ==========================================
const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const robotRoutes = require('./src/routes/robotRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/robots-be1', robotRoutes); 
// Note: Agar tumhare aur BE1 ke robot route ka naam same ho raha tha, toh yahan URL thoda alag rakhna best hai.

// ==========================================
// 2. BE2 ROUTES (Tumhara Kaam - Menu, KDS, Fleet, Guest)
// ==========================================
const categoryRoutes = require('./src/routes/categoryRoutes');
const menuItemRoutes = require('./src/routes/menuItemRoutes');
const kdsRoutes = require('./src/routes/kdsRoutes');
const fleetRoutes = require('./src/routes/fleetRoutes');
const guestInteractionRoutes = require('./src/routes/guestInteractionRoutes');

app.use('/api/menu/categories', categoryRoutes);
app.use('/api/menu/items', menuItemRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/guest', guestInteractionRoutes);

// ==========================================
// 3. GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ==========================================
// 4. SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Master Server is running on port ${PORT}`);
});