'use client';

import Sidebar from './Sidebar';

export default function AppShell({ title, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <h2 className="topbar-title">{title}</h2>
          <div className="topbar-right">
            <div className="topbar-badge">
              <span className="dot" />
              Live
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
