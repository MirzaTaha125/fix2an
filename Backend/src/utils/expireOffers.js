import Offer from '../models/Offer.js'

/**
 * Marks all past-due SENT offers as EXPIRED.
 * Safe to call multiple times — only touches un-expired records.
 */
export async function expireOffers() {
	try {
		const result = await Offer.updateMany(
			{
				status: 'SENT',
				expiresAt: { $lte: new Date() },
			},
			{ $set: { status: 'EXPIRED' } }
		)
		if (result.modifiedCount > 0) {
			console.log(`[expireOffers] Marked ${result.modifiedCount} offer(s) as EXPIRED`)
		}
	} catch (error) {
		console.error('[expireOffers] Failed:', error.message)
	}
}
