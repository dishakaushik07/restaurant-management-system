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

const categoryRoutes = require('./src/routes/categoryRoutes');
const menuItemRoutes = require('./src/routes/menuItemRoutes');
const kdsRoutes = require('./src/routes/kdsRoutes');
const fleetRoutes = require('./src/routes/fleetRoutes');

app.use('/api/menu/categories', categoryRoutes);
app.use('/api/menu/items', menuItemRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/fleet', fleetRoutes);


// Basic Test Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: "BE2 Server is running!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});