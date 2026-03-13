import mongoose from 'mongoose'
import dns from 'dns'

dns.setServers(['8.8.8.8', '8.8.4.4'])

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixa2an')
		console.log(`MongoDB Connected: ${conn.connection.host}`)
	} catch (error) {
		console.error('MongoDB connection error:', error.message)
	}
}

export default connectDB
