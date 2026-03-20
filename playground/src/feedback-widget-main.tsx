import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FeedbackWidget } from './FeedbackWidget'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<FeedbackWidget />
	</StrictMode>,
)
