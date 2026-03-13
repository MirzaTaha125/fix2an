import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import Auth2FAVerifyPage from './pages/Auth2FAVerifyPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import MyCasesPage from './pages/MyCasesPage'
import UploadPage from './pages/UploadPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import WorkshopDashboardPage from './pages/WorkshopDashboardPage'
import WorkshopRequestsPage from './pages/WorkshopRequestsPage'
import WorkshopProfilePage from './pages/WorkshopProfilePage'
import WorkshopReviewsPage from './pages/WorkshopReviewsPage'
import WorkshopContractsPage from './pages/WorkshopContractsPage'
import WorkshopProposalsPage from './pages/WorkshopProposalsPage'
import CreateOfferPage from './pages/CreateOfferPage'
import AdminPage from './pages/AdminPage'
import WorkshopDetailsPage from './pages/WorkshopDetailsPage'
import HowItWorksPage from './pages/HowItWorksPage'
import WorkshopSignupPage from './pages/WorkshopSignupPage'
import OffersPage from './pages/OffersPage'
import BookAppointmentPage from './pages/BookAppointmentPage'

function PrivateRoute({ children, allowedRoles = [] }) {
	const { user, loading } = useAuth()

	if (loading) {
		return <div className="min-h-screen flex items-center justify-center">Loading...</div>
	}

	if (!user) {
		return <Navigate to="/auth/signin" replace />
	}

	if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		if (user.role === 'ADMIN') {
			return <Navigate to="/admin" replace />
		} else if (user.role === 'WORKSHOP') {
			return <Navigate to="/workshop/requests" replace />
		} else {
			return <Navigate to="/my-cases" replace />
		}
	}

	return children
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/en" element={<HomePage />} />
			<Route path="/sv" element={<HomePage />} />
			<Route path="/how-it-works" element={<HowItWorksPage />} />
			<Route path="/workshop/signup" element={<WorkshopSignupPage />} />
			<Route path="/auth/signin" element={<SignInPage />} />
			<Route path="/auth/signup" element={<SignUpPage />} />
			<Route path="/auth/verify-email" element={<VerifyEmailPage />} />
			<Route path="/auth/2fa-verify" element={<Auth2FAVerifyPage />} />
			<Route path="/signin" element={<SignInPage />} />
			<Route path="/signup" element={<SignUpPage />} />
			<Route
				path="/my-cases"
				element={
					<PrivateRoute allowedRoles={['CUSTOMER']}>
						<MyCasesPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/upload"
				element={
					<PrivateRoute allowedRoles={['CUSTOMER']}>
						<UploadPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/profile"
				element={
					<PrivateRoute allowedRoles={['CUSTOMER']}>
						<CustomerProfilePage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/workshop/dashboard"
				element={
					<PrivateRoute allowedRoles={['WORKSHOP']}>
						<WorkshopDashboardPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/workshop/requests"
				element={
					<PrivateRoute allowedRoles={['WORKSHOP']}>
						<WorkshopRequestsPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/workshop/profile"
				element={
					<PrivateRoute allowedRoles={['WORKSHOP']}>
						<WorkshopProfilePage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/workshop/reviews"
				element={
					<PrivateRoute allowedRoles={['WORKSHOP']}>
						<WorkshopReviewsPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/workshop/contracts"
				element={
					<PrivateRoute allowedRoles={['WORKSHOP']}>
						<WorkshopContractsPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/workshop/proposals"
				element={
					<PrivateRoute allowedRoles={['WORKSHOP']}>
						<WorkshopProposalsPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/workshop/requests/:id/offer"
				element={
					<PrivateRoute allowedRoles={['WORKSHOP']}>
						<CreateOfferPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/offers"
				element={
					<PrivateRoute allowedRoles={['CUSTOMER']}>
						<OffersPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/book-appointment"
				element={
					<PrivateRoute allowedRoles={['CUSTOMER']}>
						<BookAppointmentPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/admin"
				element={
					<PrivateRoute allowedRoles={['ADMIN']}>
						<AdminPage />
					</PrivateRoute>
				}
			/>
			<Route
				path="/admin/workshops/:id"
				element={
					<PrivateRoute allowedRoles={['ADMIN']}>
						<WorkshopDetailsPage />
					</PrivateRoute>
				}
			/>
		</Routes>
	)
}

export default AppRoutes
