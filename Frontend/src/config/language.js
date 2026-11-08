// Default app language when no saved preference exists.
export const DEFAULT_LANGUAGE = 'sv'

// Set to true to show the globe language switcher in the navbar.
export const SHOW_NAVBAR_LANGUAGE_SWITCHER = false

// Set to true to show language selection in customer/workshop profile settings.
export const SHOW_PROFILE_LANGUAGE_SETTINGS = false

export const isLanguageSelectionEnabled = () =>
	SHOW_NAVBAR_LANGUAGE_SWITCHER || SHOW_PROFILE_LANGUAGE_SETTINGS
