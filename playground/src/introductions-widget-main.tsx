import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IntroductionsWidget } from './IntroductionsWidget'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<IntroductionsWidget />
	</StrictMode>,
)
