import mongoose from 'mongoose'

const platformSettingsSchema = new mongoose.Schema({
	commissionRate: { type: Number, default: 10, min: 0, max: 100 },
	vatRate: { type: Number, default: 15, min: 0, max: 100 },
}, {
	timestamps: true,
})

export default mongoose.model('PlatformSettings', platformSettingsSchema)
