import { Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getRoleHomePath } from '../utils/roleHome'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CreateCaseStart from '../components/CreateCaseStart'
import { AuthPageSkeleton } from '../components/ui/Skeleton'

export default function HomePage() {
	const { t } = useTranslation()
	const { user, loading: authLoading } = useAuth()
	const location = useLocation()

	useEffect(() => {
		const sectionId = location.hash.replace('#', '')
		if (!sectionId) return

		const scrollToSection = () => {
			document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}

		const timer = window.setTimeout(scrollToSection, 100)
		return () => window.clearTimeout(timer)
	}, [location.hash])

	if (authLoading) {
		return <AuthPageSkeleton />
	}

	const roleHome = getRoleHomePath(user)
	if (user && roleHome !== '/') {
		return <Navigate to={roleHome} replace />
	}

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<main className="list-page-content !max-w-7xl pb-28 lg:pb-16 bg-white">
				<section className="w-full">
					<div id="hero" className="scroll-mt-28 w-full">
						<CreateCaseStart />
					</div>
				</section>
			</main>

			<Footer />
		</div>
	)
}
