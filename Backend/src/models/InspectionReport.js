import mongoose from 'mongoose'

const inspectionReportSchema = new mongoose.Schema({
	fileName: { type: String, required: true },
	fileUrl: { type: String, required: true },
	fileSize: { type: Number, required: true },
	mimeType: { type: String, required: true },
}, {
	timestamps: true,
})

export default mongoose.model('InspectionReport', inspectionReportSchema)
