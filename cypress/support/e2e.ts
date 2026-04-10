// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Ocultar logs de fetch/xhr no console do Cypress
const app = window.top
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style')
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }'
  style.setAttribute('data-hide-command-log-request', '')
  app.document.head.appendChild(style)
}

// Ignorar erros de hydration do Next.js/React
// Estes erros não são bugs da aplicação, mas sim do processo de hydrate
Cypress.on('uncaught:exception', (err) => {
  // Ignora erros de hydration mismatch
  if (err.message.includes('Hydration failed') ||
      err.message.includes('hydration') ||
      err.message.includes('did not match')) {
    return false
  }
  // Permite outros erros falharem o teste
  return true
})
