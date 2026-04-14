import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './AppRoutes'

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppRoutes />
				<Toaster 
					position="top-right" 
					toastOptions={{
						duration: 4000,
						style: {
							background: '#ffffff',
							color: '#1a1a1a',
							borderRadius: '16px',
							fontSize: '14px',
							fontWeight: '600',
							padding: '12px 24px',
							border: '1px solid rgba(0, 0, 0, 0.05)',
							boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
						},
						success: {
							iconTheme: {
								primary: '#34C759',
								secondary: '#fff',
							},
						},
						error: {
							style: {
								background: '#FEE2E2',
								color: '#991B1B',
							},
							iconTheme: {
								primary: '#EF4444',
								secondary: '#fff',
							},
						},
					}}
				/>
			</AuthProvider>
		</BrowserRouter>
	)
}

export default App
