import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MatchesWidget } from './MatchesWidget'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MatchesWidget />
  </StrictMode>
)
