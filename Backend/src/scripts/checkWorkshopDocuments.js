import 'dotenv/config'
import mongoose from 'mongoose'
import Workshop from '../models/Workshop.js'
import connectDB from '../config/database.js'

async function checkWorkshopDocuments() {
	try {
		console.log('🔍 Checking Workshop Documents in Database...')
		console.log('==========================================\n')

		// Connect to database
		await connectDB()
		console.log('✅ Connected to database\n')

		// Get all workshops (without lean to see actual document structure)
		const workshops = await Workshop.find({})

		console.log(`📊 Total Workshops: ${workshops.length}\n`)

		if (workshops.length === 0) {
			console.log('⚠️  No workshops found in database')
			process.exit(0)
		}

		// Check each workshop
		workshops.forEach((workshop, index) => {
			console.log(`\n${index + 1}. Workshop: ${workshop.companyName || 'N/A'}`)
			console.log(`   ID: ${workshop._id}`)
			console.log(`   Email: ${workshop.email || 'N/A'}`)
			console.log(`   Organization Number: ${workshop.organizationNumber || 'N/A'}`)
			
			if (workshop.documents) {
				console.log(`   ✅ Documents field exists`)
				console.log(`   📄 Number of documents: ${workshop.documents.length}`)
				
				if (workshop.documents.length > 0) {
					console.log(`   📋 Documents:`)
					workshop.documents.forEach((doc, docIndex) => {
						console.log(`      ${docIndex + 1}. ${doc.fileName || 'Unknown'}`)
						console.log(`         URL: ${doc.fileUrl || 'N/A'}`)
						console.log(`         Type: ${doc.mimeType || 'N/A'}`)
					})
				} else {
					console.log(`   ⚠️  Documents array is empty`)
				}
			} else {
				console.log(`   ❌ Documents field does NOT exist`)
			}
		})

		// Summary
		const workshopsWithDocuments = workshops.filter(w => w.documents && w.documents.length > 0)
		const workshopsWithoutDocuments = workshops.filter(w => !w.documents || w.documents.length === 0)

		console.log('\n' + '='.repeat(50))
		console.log('📊 SUMMARY:')
		console.log(`   Total Workshops: ${workshops.length}`)
		console.log(`   ✅ With Documents: ${workshopsWithDocuments.length}`)
		console.log(`   ❌ Without Documents: ${workshopsWithoutDocuments.length}`)
		console.log('='.repeat(50))

		process.exit(0)
	} catch (error) {
		console.error('❌ Error checking workshop documents:', error)
		process.exit(1)
	}
}

// Run the script
checkWorkshopDocuments()

