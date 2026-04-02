/**
 * Utilitários para sons de notificação
 * Usa Web Audio API para gerar sons sem arquivos externos
 */

// Contexto de áudio (lazy loaded)
let audioContext: AudioContext | null = null

/**
 * Inicializa o contexto de áudio (deve ser chamado após interação do usuário)
 */
function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioContext
}

/**
 * Toca um som de notificação suave (ping curto)
 * Frequência: 800Hz, duração: 150ms
 */
export function playNotificationSound(): void {
  const ctx = initAudioContext()
  if (!ctx) return

  const play = () => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Configura o oscilador (som suave)
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime) // Nota Lá5 (880Hz)
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15) // Desce para Lá4

    // Configura o envelope (volume)
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05) // Attack suave
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15) // Decay

    // Toca
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  }

  // Resume o contexto se estiver suspenso (política de autoplay) e aguarda antes de tocar
  if (ctx.state === 'suspended') {
    ctx.resume().then(play)
  } else {
    play()
  }
}

/**
 * Toca som apenas se a aba não estiver ativa
 * Útil para notificações de mensagens quando o usuário está em outra aba
 */
export function playNotificationIfHidden(): void {
  if (typeof document !== 'undefined' && document.hidden) {
    playNotificationSound()
  }
}

/**
 * Toca som de mensagem nova (mais suave ainda)
 * Frequência: 600Hz, duração: 100ms
 */
export function playMessageSound(): void {
  const ctx = initAudioContext()
  if (!ctx) return

  const play = () => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.03)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  // Resume o contexto se estiver suspenso (política de autoplay) e aguarda antes de tocar
  if (ctx.state === 'suspended') {
    ctx.resume().then(play)
  } else {
    play()
  }
}
