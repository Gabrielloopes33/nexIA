import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redireciona a raiz para a página de login
  // O middleware já cuida de redirecionar usuários autenticados para o dashboard apropriado
  redirect('/login')
}
