import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersonWidget } from './PersonWidget'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersonWidget />
  </StrictMode>
)
