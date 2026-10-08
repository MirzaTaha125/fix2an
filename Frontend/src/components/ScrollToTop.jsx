import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
	const { pathname, search, hash } = useLocation()

	useEffect(() => {
		if (hash) return

		window.scrollTo(0, 0)
		document.documentElement.scrollTop = 0
		document.body.scrollTop = 0

		document.querySelectorAll('[data-scroll-reset], .list-page-content, main').forEach((el) => {
			if (el.scrollTop > 0) el.scrollTop = 0
		})
	}, [pathname, search, hash])

	return null
}
