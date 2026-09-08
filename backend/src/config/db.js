 const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // BE2 wala Real Database Connection (MongoDB Atlas / Local)
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Core MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// BE1 wala Tenant Logic (Jo Team leader ke routes ko chahiye)
const getTenantDB = (tenantId) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  return mongoose.connection.useDb(`rms_tenant_${tenantId}`, { useCache: true });
};

module.exports = { connectDB, getTenantDB };