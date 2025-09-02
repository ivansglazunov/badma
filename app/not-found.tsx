import { useTranslations } from 'hasyx'

export default function NotFound() {
  const t = useTranslations();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">{t('badma.app.pageNotFound')}</h1>
      <p className="text-xl mb-8">{t('badma.app.pageNotExist')}</p>
      <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
        {t('badma.app.returnToHome')}
      </a>
    </div>
  )
} 