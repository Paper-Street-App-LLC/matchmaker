import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IntroductionWidget } from './IntroductionWidget'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<IntroductionWidget />
	</StrictMode>,
)
