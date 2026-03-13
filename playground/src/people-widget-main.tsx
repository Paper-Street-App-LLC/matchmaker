import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PeopleWidget } from './PeopleWidget'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<PeopleWidget />
	</StrictMode>,
)
