const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const conn = await mongoose.connect(uri);
    console.log(`Core MongoDB (In-Memory) Connected: ${conn.connection.host}`);
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
