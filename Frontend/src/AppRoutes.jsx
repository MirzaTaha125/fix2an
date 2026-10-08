import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { CustomerOfferCountProvider } from './context/CustomerOfferCountContext'
import { CustomerUnreadCountProvider } from './context/CustomerUnreadCountContext'
import { WorkshopUnreadCountProvider } from './context/WorkshopUnreadCountContext'
import { MobileBackProvider } from './context/MobileBackContext'
import { RouteLoadingSkeleton } from './components/ui/Skeleton'
import Navbar from './components/Navbar'
import BottomNavManager from './components/BottomNavManager'
import SignInPage from './pages/SignInPage'
import WorkshopLoginPage from './pages/WorkshopLoginPage'
import SignUpPage from './pages/SignUpPage'
import Auth2FAVerifyPage from './pages/Auth2FAVerifyPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import MyCasesPage from './pages/MyCasesPage'
import UploadPage from './pages/UploadPage'
import MagicLinkVerifyPage from './pages/MagicLinkVerifyPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import WorkshopDashboardPage from './pages/WorkshopDashboardPage'
import CustomerDashboardPage from './pages/CustomerDashboardPage'
import WorkshopLandingPage from './pages/WorkshopLandingPage'
import WorkshopRequestsPage from './pages/WorkshopRequestsPage'
import WorkshopProfilePage from './pages/WorkshopProfilePage'
import WorkshopReviewsPage from './pages/WorkshopReviewsPage'
import CustomerWorkshopReviewsPage from './pages/CustomerWorkshopReviewsPage'
import WorkshopContractsPage from './pages/WorkshopContractsPage'
import WorkshopProposalsPage from './pages/WorkshopProposalsPage'
import CreateOfferPage from './pages/CreateOfferPage'
import WorkshopCaseDetailPage from './pages/WorkshopCaseDetailPage'
import WorkshopCalendarPage from './pages/WorkshopCalendarPage'
import WorkshopMessagesPage from './pages/WorkshopMessagesPage'
import WorkshopStatisticsPage from './pages/WorkshopStatisticsPage'
import WorkshopSettingsPage from './pages/WorkshopSettingsPage'
import AdminPage from './pages/AdminPage'
import WorkshopDetailsPage from './pages/WorkshopDetailsPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'
import WorkshopSignupPage from './pages/WorkshopSignupPage'
import OffersPage from './pages/OffersPage'
import BookAppointmentPage from './pages/BookAppointmentPage'
import PaymentReviewPage from './pages/PaymentReviewPage'
import HelpSupportPage from './pages/HelpSupportPage'
import LegalPage from './pages/LegalPage'
import WorkshopPendingPage from './pages/WorkshopPendingPage'
import WorkshopRejectedPage from './pages/WorkshopRejectedPage'


function PrivateRoute({ children, allowedRoles = [] }) {
	const { user, loading } = useAuth()
	const location = useLocation()

	if (loading) {
		return (
			<>
				<Navbar />
				<RouteLoadingSkeleton />
			</>
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
		} else if (userRole === 'WORKSHOP' && !location.pathname.startsWith('/workshop')) {
			return <Navigate to="/workshop/dashboard" replace />
		} else if (userRole !== 'ADMIN' && userRole !== 'WORKSHOP' && !['/dashboard', '/contract', '/offers', '/upload', '/profile', '/book-appointment', '/payment'].some((p) => location.pathname.startsWith(p))) {
			return <Navigate to="/dashboard" replace />
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
            return <Navigate to="/workshop/dashboard" replace />
        }
    }

	return children
}

function RequestRedirect() {
	const { id } = useParams()
	return <Navigate to={`/offers?requestId=${id}`} replace />
}

function AppFrame({ children }) {
	const { pathname } = useLocation()
	const isAdmin = pathname.startsWith('/admin')
	const isWorkshopArea = pathname === '/workshop' || pathname.startsWith('/workshop/')
	const isCustomerWorkshopReviews = /^\/workshop\/[^/]+\/reviews\/?$/.test(pathname)
	const isCustomer = !isAdmin && (!isWorkshopArea || isCustomerWorkshopReviews)
	return <div className={isCustomer ? 'app-layout customer-app' : 'app-layout'}>{children}</div>
}

function AppRoutes() {
	return (
		<CustomerOfferCountProvider>
		<CustomerUnreadCountProvider>
		<WorkshopUnreadCountProvider>
			<MobileBackProvider>
			<AppFrame>
				<Routes>
				<Route path="/" element={<SignInPage />} />
				<Route path="/en" element={<SignInPage />} />
				<Route path="/sv" element={<SignInPage />} />
				<Route path="/workshop" element={<WorkshopLandingPage />} />
				<Route path="/how-it-works" element={<HowItWorksPage />} />
				<Route path="/about" element={<AboutPage />} />
				<Route path="/support" element={<Navigate to="/support/contact" replace />} />
				<Route path="/support/:tab" element={<HelpSupportPage />} />
				<Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
				<Route path="/terms" element={<LegalPage pageKey="terms" />} />
				<Route path="/cookies" element={<LegalPage pageKey="cookies" />} />
				<Route path="/workshop/signup" element={<WorkshopSignupPage />} />
				<Route path="/workshop/login" element={<WorkshopLoginPage />} />
				<Route path="/auth/signin" element={<SignInPage />} />
				<Route path="/auth/signup" element={<SignUpPage />} />
				<Route path="/auth/verify-email" element={<VerifyEmailPage />} />
				<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
				<Route path="/auth/magic-link" element={<MagicLinkVerifyPage />} />
				<Route path="/auth/2fa-verify" element={<Auth2FAVerifyPage />} />
				<Route path="/signin" element={<SignInPage />} />
				<Route path="/signup" element={<SignUpPage />} />
				<Route
					path="/dashboard"
					element={
						<PrivateRoute allowedRoles={['CUSTOMER']}>
							<CustomerDashboardPage />
						</PrivateRoute>
					}
				/>
				<Route path="/my-cases" element={<Navigate to="/contract" replace />} />
				<Route
					path="/contract"
					element={
						<PrivateRoute allowedRoles={['CUSTOMER']}>
							<MyCasesPage />
						</PrivateRoute>
					}
				/>
				<Route path="/requests/:id" element={<RequestRedirect />} />
				<Route path="/upload" element={<UploadPage />} />
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
					path="/workshop/calendar"
					element={
						<PrivateRoute allowedRoles={['WORKSHOP']}>
							<WorkshopCalendarPage />
						</PrivateRoute>
					}
				/>
				<Route
					path="/workshop/messages"
					element={
						<PrivateRoute allowedRoles={['WORKSHOP']}>
							<WorkshopMessagesPage />
						</PrivateRoute>
					}
				/>
				<Route
					path="/workshop/statistics"
					element={
						<PrivateRoute allowedRoles={['WORKSHOP']}>
							<WorkshopStatisticsPage />
						</PrivateRoute>
					}
				/>
				<Route
					path="/workshop/settings"
					element={
						<PrivateRoute allowedRoles={['WORKSHOP']}>
							<WorkshopSettingsPage />
						</PrivateRoute>
					}
				/>
				<Route
					path="/workshop/requests/:id"
					element={
						<PrivateRoute allowedRoles={['WORKSHOP']}>
							<WorkshopCaseDetailPage />
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
					path="/payment"
					element={
						<PrivateRoute allowedRoles={['CUSTOMER']}>
							<PaymentReviewPage />
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
			</AppFrame>
			</MobileBackProvider>
		</WorkshopUnreadCountProvider>
		</CustomerUnreadCountProvider>
		</CustomerOfferCountProvider>
	)
}

export default AppRoutes
