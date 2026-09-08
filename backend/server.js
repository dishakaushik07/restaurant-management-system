const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// BE2 ROUTES (Menu, KDS, Fleet, Guest)
// ==========================================
const categoryRoutes = require('./src/routes/categoryRoutes');
const menuItemRoutes = require('./src/routes/menuItemRoutes');
const kdsRoutes = require('./src/routes/kdsRoutes');
const fleetRoutes = require('./src/routes/fleetRoutes');
const guestRoutes = require('./src/routes/guestInteractionRoutes');

app.use('/api/menu/categories', categoryRoutes);
app.use('/api/menu/items', menuItemRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/fleet', fleetRoutes);


// ==========================================
// BASIC TEST ROUTE
// ==========================================
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: "SIH Restaurant Server is running!" });
});


// ==========================================
// GLOBAL ERROR HANDLER (Added for BE1 & BE2)
// ==========================================
app.use((err, req, res, next) => {
    console.error("Global Error:", err.message);
    res.status(500).json({ 
        success: false, 
        message: err.message || "Internal Server Error" 
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});