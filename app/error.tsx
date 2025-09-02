'use client'

import { useEffect } from 'react'
import { useTranslations } from 'hasyx'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-3xl font-bold mb-4">{t('badma.app.somethingWentWrong')}</h2>
      <p className="text-xl mb-8">{t('badma.app.apologizeInconvenience')}</p>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        {t('badma.app.tryAgain')}
      </button>
    </div>
  )
} 