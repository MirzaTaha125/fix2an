import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './AppRoutes'
import ScrollToTop from './components/ScrollToTop'
import AppToaster from './components/ui/AppToaster'

function App() {
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
