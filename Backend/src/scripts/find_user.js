import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Connecting to:', uri);

await mongoose.connect(uri);
console.log('Connected!');

// Define schemas dynamically
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { strict: false });

const RequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleId: mongoose.Schema.Types.ObjectId,
  description: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Request = mongoose.model('Request', RequestSchema);

const requestId = '6a1a1c51efaafe30f198f337';
const request = await Request.findById(requestId).populate('customerId');

if (!request) {
  console.log('Request not found!');
} else {
  console.log('Request found:', JSON.stringify(request, null, 2));
}

await mongoose.disconnect();
console.log('Disconnected!');
