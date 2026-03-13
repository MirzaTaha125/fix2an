import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'
import connectDB from '../config/database.js'

async function createAdmin() {
	try {
		console.log('🔐 Creating Admin User...')
		console.log('========================\n')

		// Connect to database
		await connectDB()
		console.log('✅ Connected to database\n')

		const adminEmail = 'admin@gmial.com'
		const adminPassword = 'adim123'
		const adminName = 'Admin User'

		// Check if admin already exists
		const existingAdmin = await User.findOne({ 
			email: { $regex: new RegExp(`^${adminEmail}$`, 'i') }
		})

		if (existingAdmin) {
			if (existingAdmin.role === 'ADMIN') {
				console.log('⚠️  Admin user already exists!')
				console.log(`   Email: ${existingAdmin.email}`)
				console.log(`   Role: ${existingAdmin.role}`)
				
				// Update password
				existingAdmin.password = adminPassword
				await existingAdmin.save()
				console.log('✅ Admin password updated successfully!')
			} else {
				// Promote to admin
				existingAdmin.role = 'ADMIN'
				existingAdmin.password = adminPassword
				existingAdmin.isActive = true
				await existingAdmin.save()
				console.log('✅ User promoted to admin successfully!')
			}
		} else {
			// Create new admin user
			const admin = await User.create({
				email: adminEmail,
				password: adminPassword,
				name: adminName,
				role: 'ADMIN',
				isActive: true,
			})

			console.log('✅ Admin user created successfully!')
			console.log(`   Email: ${admin.email}`)
			console.log(`   Name: ${admin.name}`)
			console.log(`   Role: ${admin.role}`)
			console.log(`   ID: ${admin._id}`)
		}

		console.log('\n📋 Admin Credentials:')
		console.log(`   Email: ${adminEmail}`)
		console.log(`   Password: ${adminPassword}`)
		console.log('\n✅ Done!')

		process.exit(0)
	} catch (error) {
		console.error('❌ Error creating admin user:', error)
		process.exit(1)
	}
}

// Run the script
createAdmin()

