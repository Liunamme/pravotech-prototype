import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/golos-text';
import '@fontsource-variable/source-serif-4';
import '@/shared/styles/tokens.css';
import '@/shared/styles/reset.css';

import { hydrateFromRegistry } from '@/store/hydrate';
import { App } from '@/app/App';

// Наполняем стор сидами всех зарегистрированных пространств ДО первого рендера,
// чтобы очередь «Сегодня» и вкладки контекста были готовы сразу, без вспышки
// пустого состояния. dev-ассерты целостности источников прогоняются здесь же.
hydrateFromRegistry();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
