/** Customer nav icons matching the provided Home / Document / Chat / User set. */

export function NavHomeIcon({ className = 'w-6 h-6', strokeWidth = 1.8, filled = false, ...props }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
			<path
				d="M3.8 11.2 12 4.2l8.2 7V19.2c0 .9-.7 1.6-1.6 1.6H14.5v-5.4c0-.6-.5-1.1-1.1-1.1h-3c-.6 0-1.1.5-1.1 1.1v5.4H5.4c-.9 0-1.6-.7-1.6-1.6v-8Z"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				strokeLinecap="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
			{filled ? (
				<path d="M10.2 20.8v-5.2c0-.3.2-.5.5-.5h2.6c.3 0 .5.2.5.5v5.2" fill="white" />
			) : (
				<path
					d="M10.2 20.8v-5.2c0-.3.2-.5.5-.5h2.6c.3 0 .5.2.5.5v5.2"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
			)}
		</svg>
	)
}

export function NavCasesIcon({ className = 'w-6 h-6', strokeWidth = 1.8, filled = false, ...props }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
			<path
				d="M5.5 3h8.4L19 8.1v12.4c0 1-.8 1.8-1.8 1.8H5.5c-1 0-1.8-.8-1.8-1.8V4.8C3.7 3.8 4.5 3 5.5 3Z"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				strokeLinecap="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
			<path
				d="M13.9 3V7.4c0 .6.5 1.1 1.1 1.1H19"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				strokeLinecap="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
			<path
				d="M8.2 12.2h7.6M8.2 15.8h5.4"
				stroke={filled ? 'white' : 'currentColor'}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
			/>
		</svg>
	)
}

export function NavMessagesIcon({ className = 'w-6 h-6', strokeWidth = 1.8, filled = false, ...props }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
			<path
				d="M5.2 5h13.6A2.6 2.6 0 0 1 21.4 7.6v6.8a2.6 2.6 0 0 1-2.6 2.6H10.5l-4.2 2.9a.55.55 0 0 1-.85-.46V17H5.2A2.6 2.6 0 0 1 2.6 14.4V7.6A2.6 2.6 0 0 1 5.2 5Z"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				strokeLinecap="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
		</svg>
	)
}

export function NavProfileIcon({ className = 'w-6 h-6', strokeWidth = 1.8, filled = false, ...props }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
			<circle
				cx="12"
				cy="8.2"
				r="3.5"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				fill={filled ? 'currentColor' : 'none'}
			/>
			<path
				d="M5.2 19.5c1-3.15 3.35-4.7 6.8-4.7s5.8 1.55 6.8 4.7"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
		</svg>
	)
}

export function NavSettingsIcon({ className = 'w-6 h-6', strokeWidth = 1.8, filled = false, ...props }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
			<path
				d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
			<path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.18a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.82 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8.18 1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				strokeLinecap="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
			{filled ? <circle cx="12" cy="12" r="1.6" fill="white" /> : null}
		</svg>
	)
}

/** Workshop jobs / wrench icon — same fill behavior as customer nav set. */
export function NavJobsIcon({ className = 'w-6 h-6', strokeWidth = 1.8, filled = false, ...props }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
			<path
				d="M14.7 6.3a4.1 4.1 0 0 0-5.7 5.7l-5.2 5.2a1.6 1.6 0 0 0 2.3 2.3l5.2-5.2a4.1 4.1 0 0 0 5.7-5.7l-2.1 2.1-2.2-2.2 2-2.2Z"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				strokeLinecap="round"
				fill={filled ? 'currentColor' : 'none'}
			/>
			{filled ? (
				<path
					d="M15.2 7.1 16.9 8.8"
					stroke="white"
					strokeWidth={strokeWidth}
					strokeLinecap="round"
				/>
			) : null}
		</svg>
	)
}
