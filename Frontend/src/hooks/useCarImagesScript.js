import { useEffect, useState } from 'react'

let scriptPromise = null

function loadCarImagesScript(apiKey) {
	if (typeof window === 'undefined' || !apiKey) return Promise.resolve(false)
	if (window.CI_API_KEY === apiKey && document.querySelector('script[data-carimages-loader]')) {
		return Promise.resolve(true)
	}

	if (scriptPromise) return scriptPromise

	scriptPromise = new Promise((resolve) => {
		window.CI_API_KEY = apiKey
		const existing = document.querySelector('script[data-carimages-loader]')
		if (existing) {
			existing.remove()
		}

		const script = document.createElement('script')
		script.async = true
		script.dataset.carimagesLoader = 'true'
		const cacheBust = new Date().toISOString().slice(0, 10).replace(/-/g, '')
		script.src = `https://carimagesapi.com/assets/js/carimages.js?v=${cacheBust}`
		script.onload = () => resolve(true)
		script.onerror = () => {
			scriptPromise = null
			resolve(false)
		}
		document.head.appendChild(script)
	})

	return scriptPromise
}

export function useCarImagesScript() {
	const apiKey = import.meta.env.VITE_CAR_IMAGES_API_KEY
	const [ready, setReady] = useState(false)

	useEffect(() => {
		if (!apiKey) {
			setReady(false)
			return
		}

		let active = true
		loadCarImagesScript(apiKey).then((ok) => {
			if (active) setReady(ok)
		})

		return () => {
			active = false
		}
	}, [apiKey])

	return { ready, apiKey }
}
