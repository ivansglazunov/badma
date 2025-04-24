/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    // Включаем сканирование компонентов из пакета hasyx
    './node_modules/hasyx/lib/**/*.{js,ts,jsx,tsx}',
    './node_modules/hasyx/components/**/*.{js,ts,jsx,tsx}',
    './node_modules/hasyx/app/**/*.{js,ts,jsx,tsx}',
    './node_modules/hasyx/hooks/**/*.{js,ts,jsx,tsx}'
  ],
  plugins: [],
} 