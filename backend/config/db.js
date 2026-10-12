const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined. Copy backend/.env.example to backend/.env and set MONGO_URI.');
  }
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Retrying in 5s...');
  setTimeout(() => {
    if (mongoose.connection.readyState === 0) mongoose.connect(process.env.MONGO_URI).catch((e) => console.error('Reconnect failed:', e.message));
  }, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = { connectDB };