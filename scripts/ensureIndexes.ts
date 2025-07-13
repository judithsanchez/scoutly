import mongoose from 'mongoose';
import { User } from '../src/models/User';
// Import other models as needed
import { apiBaseUrl } from '../src/config/environment';

const MONGODB_URI = apiBaseUrl.mongoUri;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment variables or apiBaseUrl.');
  process.exit(1);
}

async function ensureIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    await User.ensureIndexes();
    // Add other models here, e.g.:
    // await UserCredential.ensureIndexes();
    console.log('Indexes ensured for all models.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error ensuring indexes:', err);
    process.exit(1);
  }
}

ensureIndexes();
