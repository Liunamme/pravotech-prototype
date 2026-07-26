import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /*
         * Один файл на 600 кБ означал: любая правка кнопки заставляет
         * браузер качать заново и React, и Radix, и иконки. Разводим редко
         * меняющиеся библиотеки по отдельным чанкам — между релизами
         * прототипа они лежат в кэше и не перекачиваются.
         *
         * Прикладной код специально НЕ дробим по маршрутам: страниц всего
         * четыре, а сид рабочих пространств нужен ещё до первого рендера
         * (`hydrateFromRegistry` в `main.tsx`), поэтому ленивая загрузка
         * пространств дала бы пустой экран вместо выигрыша.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'react';
          if (id.includes('node_modules/@radix-ui/')) return 'radix';
          if (id.includes('node_modules/lucide-react/')) return 'icons';
          if (id.includes('node_modules/date-fns/')) return 'dates';
          return undefined;
        },
      },
    },
  },
})
