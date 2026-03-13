import 'dotenv/config'
import mongoose from 'mongoose'
import Workshop from '../models/Workshop.js'
import connectDB from '../config/database.js'

async function addDocumentsFieldToWorkshops() {
	try {
		console.log('🔄 Adding Documents Field to Existing Workshops...')
		console.log('================================================\n')

		// Connect to database
		await connectDB()
		console.log('✅ Connected to database\n')

		// Get all workshops
		const allWorkshops = await Workshop.find({})
		console.log(`📊 Total workshops found: ${allWorkshops.length}\n`)

		if (allWorkshops.length === 0) {
			console.log('⚠️  No workshops found in database')
			process.exit(0)
		}

		// Update each workshop to have an empty documents array if it doesn't exist
		let updatedCount = 0
		for (const workshop of allWorkshops) {
			// Check if documents field exists and is an array
			const hasDocuments = workshop.documents !== undefined && Array.isArray(workshop.documents)
			
			if (!hasDocuments) {
				const result = await Workshop.findByIdAndUpdate(
					workshop._id,
					{ $set: { documents: [] } },
					{ new: true, upsert: false }
				)
				if (result) {
					updatedCount++
					console.log(`✅ Updated workshop: ${workshop.companyName || 'N/A'} (${workshop._id})`)
				}
			} else {
				console.log(`⏭️  Skipped workshop: ${workshop.companyName || 'N/A'} (already has documents field)`)
			}
		}

		console.log(`\n✅ Successfully updated ${updatedCount} workshop(s)`)
		console.log('📝 Note: Documents field is now initialized as empty array.')
		console.log('   To add documents, workshops need to re-register with documents.')

		process.exit(0)
	} catch (error) {
		console.error('❌ Error updating workshops:', error)
		process.exit(1)
	}
}

// Run the script
addDocumentsFieldToWorkshops()

