/**
 * Meta Icon Component - Ícone oficial da Meta para sidebar
 * Cor branca para uso na sidebar roxa
 */

export function MetaIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 6.016 4.432 10.984 10.206 11.852V15.18H7.237v-3.154h2.969v-2.418c0-2.919 1.741-4.539 4.418-4.539 1.279 0 2.617.228 2.617.228v2.868h-1.473c-1.452 0-1.904.899-1.904 1.822v2.039h3.241l-.518 3.154h-2.723v8.662C19.568 22.984 24 18.016 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

/**
 * Meta Logo (M) - Versão alternativa do logo da Meta
 */
export function MetaLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c.79 0 1.54-.15 2.23-.43l-1.06-1.06c-.46.16-.95.25-1.46.25-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5c0 .68-.15 1.32-.42 1.89l1.05 1.05c.44-.86.69-1.83.69-2.86 0-3.31-2.69-6-6-6z" />
    </svg>
  )
}

/**
 * Meta Infinity Loop - Logo oficial moderno da Meta
 */
export function MetaInfinityIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 14.5c-1.5 0-2.5-1-3.5-2.5-1 1.5-2 2.5-3.5 2.5-2 0-3.5-1.5-3.5-3.5S6.5 9.5 8.5 9.5c1.5 0 2.5 1 3.5 2.5 1-1.5 2-2.5 3.5-2.5 2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5z" />
    </svg>
  )
}
