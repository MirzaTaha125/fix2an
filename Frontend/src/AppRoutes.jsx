import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Skeleton } from './components/ui/Skeleton'
import Navbar from './components/Navbar'
import BottomNavManager from './components/BottomNavManager'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import Auth2FAVerifyPage from './pages/Auth2FAVerifyPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import MyCasesPage from './pages/MyCasesPage'
import UploadPage from './pages/UploadPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import WorkshopDashboardPage from './pages/WorkshopDashboardPage'
import WorkshopLandingPage from './pages/WorkshopLandingPage'
import WorkshopRequestsPage from './pages/WorkshopRequestsPage'
import WorkshopProfilePage from './pages/WorkshopProfilePage'
import WorkshopReviewsPage from './pages/WorkshopReviewsPage'
import CustomerWorkshopReviewsPage from './pages/CustomerWorkshopReviewsPage'
import WorkshopContractsPage from './pages/WorkshopContractsPage'
import WorkshopProposalsPage from './pages/WorkshopProposalsPage'
import CreateOfferPage from './pages/CreateOfferPage'
import AdminPage from './pages/AdminPage'
import WorkshopDetailsPage from './pages/WorkshopDetailsPage'
import HowItWorksPage from './pages/HowItWorksPage'
import WorkshopSignupPage from './pages/WorkshopSignupPage'
import OffersPage from './pages/OffersPage'
import BookAppointmentPage from './pages/BookAppointmentPage'
import WorkshopPendingPage from './pages/WorkshopPendingPage'
import WorkshopRejectedPage from './pages/WorkshopRejectedPage'


function PrivateRoute({ children, allowedRoles = [] }) {
	const { user, loading } = useAuth()
	const location = useLocation()

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
					<div className="space-y-8 animate-pulse">
						<div className="h-10 w-1/3 bg-gray-200 rounded-lg mx-auto sm:mx-0"></div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[1, 2, 3, 4, 5, 6].map(i => (
								<div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-48"></div>
							))}
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Normalize role to uppercase for safe comparison
	const userRole = user?.role?.toUpperCase()

	if (!user) {
		return <Navigate to="/auth/signin" replace />
	}

	if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
		if (userRole === 'ADMIN' && location.pathname !== '/admin') {
			return <Navigate to="/admin" replace />
		} else if (userRole === 'WORKSHOP' && location.pathname !== '/workshop/requests') {
			return <Navigate to="/workshop/requests" replace />
		} else if (userRole !== 'ADMIN' && userRole !== 'WORKSHOP' && location.pathname !== '/my-cases') {
			return <Navigate to="/my-cases" replace />
		}
	}
    
    
    // Workshop verification check
    if (userRole === 'WORKSHOP') {
        const rawStatus = user.workshop?.verificationStatus?.toUpperCase();
        const verificationStatus = user.isVerified ? 'APPROVED' : (rawStatus || 'PENDING');
        
        if (verificationStatus === 'REJECTED' && location.pathname !== '/workshop/rejected') {
            return <Navigate to="/workshop/rejected" replace />
        }
        if (verificationStatus === 'PENDING' && location.pathname !== '/workshop/pending') {
            return <Navigate to="/workshop/pending" replace />
        }
        if (verificationStatus === 'APPROVED' && (location.pathname === '/workshop/pending' || location.pathname === '/workshop/rejected')) {
            return <Navigate to="/workshop/requests" replace />
        }
    }

	return children
}

function AppRoutes() {
	return (
		<>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/en" element={<HomePage />} />
				<Route path="/sv" element={<HomePage />} />
				<Route path="/workshop" element={<WorkshopLandingPage />} />
				<Route path="/how-it-works" element={<HowItWorksPage />} />
				<Route path="/workshop/signup" element={<WorkshopSignupPage />} />
				<Route path="/auth/signin" element={<SignInPage />} />
				<Route path="/auth/signup" element={<SignUpPage />} />
				<Route path="/auth/verify-email" element={<VerifyEmailPage />} />
				<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
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
					path="/workshop/pending"
					element={
						<PrivateRoute allowedRoles={['WORKSHOP']}>
							<WorkshopPendingPage />
						</PrivateRoute>
					}
				/>
				<Route
					path="/workshop/rejected"
					element={
						<PrivateRoute allowedRoles={['WORKSHOP']}>
							<WorkshopRejectedPage />
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
					path="/workshop/:id/reviews"
					element={
						<PrivateRoute allowedRoles={['CUSTOMER']}>
							<CustomerWorkshopReviewsPage />
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
			<BottomNavManager />
		</>
	)
}

export default AppRoutes
