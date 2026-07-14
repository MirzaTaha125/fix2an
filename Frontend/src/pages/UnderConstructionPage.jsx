import mainLogo from '../assets/main_logo.png'

export default function UnderConstructionPage() {
	return (
		<div className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden bg-[#f4f8fb]">
			{/* Soft brand atmosphere */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(52, 199, 89, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(5, 50, 79, 0.08), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 80%, rgba(28, 63, 148, 0.06), transparent 45%)',
				}}
			/>

			<main className="relative z-10 w-full max-w-lg text-center">
				<img
					src={mainLogo}
					alt="Fixa2an"
					className="mx-auto h-16 sm:h-20 w-auto object-contain mb-10"
				/>

				<p className="text-sm font-semibold tracking-wide uppercase text-[#34C759] mb-3">
					Kommer snart
				</p>

				<h1 className="text-[32px] sm:text-[40px] font-bold text-[#05324f] leading-tight mb-4">
					Webbplatsen är under uppbyggnad
				</h1>

				<p className="text-base sm:text-lg text-[#05324f]/80 leading-relaxed mb-10">
					Vi arbetar för fullt med att färdigställa Fixa2an. Snart kan du jämföra offerter
					från verkstäder runt om i Sverige. Tack för ditt tålamod.
				</p>

				<a
					href="mailto:info@fixa2an.se"
					className="inline-flex items-center justify-center rounded-xl bg-[#34C759] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
				>
					Kontakta oss · info@fixa2an.se
				</a>
			</main>

			<footer className="relative z-10 mt-16 text-sm text-[#05324f]/50">
				© {new Date().getFullYear()} Fixa2an
			</footer>
		</div>
	)
}
