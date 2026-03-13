import Request from '../models/Request.js'

/**
 * Marks all past-due NEW/IN_BIDDING requests as EXPIRED.
 * Safe to call multiple times — only touches un-expired records.
 */
export async function expireRequests() {
	try {
		const result = await Request.updateMany(
			{
				status: { $in: ['NEW', 'IN_BIDDING'] },
				expiresAt: { $lte: new Date() },
			},
			{ $set: { status: 'EXPIRED' } }
		)
		if (result.modifiedCount > 0) {
			console.log(`[expireRequests] Marked ${result.modifiedCount} request(s) as EXPIRED`)
		}
	} catch (error) {
		console.error('[expireRequests] Failed:', error.message)
	}
}
