import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/core/layout/AppShell';
import { TodayPage } from '@/pages/TodayPage';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { SettingsPage, KitchenSinkPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * HashRouter — вместе с vite.config `base: './'` даёт работоспособность
 * на любом статическом хостинге (в т.ч. GitHub Pages) без правки конфига.
 */
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/today" element={<TodayPage />} />
          <Route path="/w/:workspaceId" element={<WorkspacePage />} />
          <Route path="/w/:workspaceId/t/:threadId" element={<WorkspacePage />} />
          <Route path="/w/:workspaceId/tab/:tabId" element={<WorkspacePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/kitchen-sink" element={<KitchenSinkPage />} />
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
