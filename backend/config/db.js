const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rms_core');
    console.log(`Core MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const getTenantDB = (tenantId) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  return mongoose.connection.useDb(`rms_tenant_${tenantId}`, { useCache: true });
};

module.exports = { connectDB, getTenantDB };
