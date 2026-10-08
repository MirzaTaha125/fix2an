import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './AppRoutes'
import ScrollToTop from './components/ScrollToTop'
import AppToaster from './components/ui/AppToaster'
import UnderConstructionPage from './pages/UnderConstructionPage'
import { shouldShowMaintenancePage } from './utils/maintenance'

function App() {
	// Public live site gate — no auth/API calls while under construction
	if (shouldShowMaintenancePage()) {
		return <UnderConstructionPage />
	}

	return (
		<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
			<AuthProvider>
				<ScrollToTop />
				<AppRoutes />
				<AppToaster />
			</AuthProvider>
		</BrowserRouter>
	)
}

export default App
