import mongoose from 'mongoose'

const vehicleSchema = new mongoose.Schema({
	make: { type: String, required: true },
	model: { type: String, required: true },
	year: { type: Number, required: true },
	makeSlug: { type: String },
	modelSlug: { type: String },
}, {
	timestamps: true,
})

export default mongoose.model('Vehicle', vehicleSchema)
