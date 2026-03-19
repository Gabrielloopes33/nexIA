'use client'

// Re-exporta a página de login (que já tem modo signup)
// Isso evita 404 quando usuários acessam /register diretamente
export { default } from '../login/page'
