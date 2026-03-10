"use client"

export default function PerfilPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#46347F" }}>
          Configurações de Perfil
        </h1>
        <p className="text-sm text-gray-500">
          Gerencie seus dados pessoais e informações de perfil
        </p>
      </div>
      
      <div className="rounded-sm border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">Conteúdo em desenvolvimento</p>
      </div>
    </div>
  )
}
