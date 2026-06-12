import ProfessorChat from '@/components/ProfessorChat'

export const metadata = { title: 'Professor de Música — SmartCifra' }

export default function ProfessorPage() {
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <div className="border-b border-gray-800 bg-gray-950 px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-xl">
              🎓
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Professor de Música</h1>
              <p className="text-sm text-gray-400">
                Teoria musical, harmonia e cifras — baseado em Almir Chediak e teoria funcional
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-3xl flex-col">
          <ProfessorChat />
        </div>
      </div>
    </div>
  )
}
