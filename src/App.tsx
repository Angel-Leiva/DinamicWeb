/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Page, PageVersion, User, MediaFile, FormSubmission, LogEntry } from './types';
import Header from './components/Header';
import PublicPortal from './components/PublicPortal';
import AdminPanel from './components/AdminPanel';
import ArchitectureBlueprint from './components/ArchitectureBlueprint';
import { Code, Info, Shield, Layers, BookOpen, Sparkles, Database } from 'lucide-react';

export default function App() {
  // 1. Persistent State Initializers
  const [pages, setPages] = useState<Page[]>([]);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'portal' | 'admin' | 'blueprint'>('blueprint'); // Starts at blueprint so the user sees the design first!
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cms_dark_mode');
      return saved === 'true';
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  });

  // Load public content (pages) from database on startup
  useEffect(() => {
    const fetchPublicPages = async () => {
      try {
        const res = await fetch('/api/pages');
        if (res.ok) {
          const dbPages = await res.json();
          setPages(dbPages);
        }
      } catch (error) {
        console.error('Error loading public pages from PostgreSQL:', error);
      }
    };
    fetchPublicPages();
  }, []);

  // Set up Custom JWT Auth session checking and auto-refresh
  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setAuthToken('cookie-session-active');
          await loadDatabaseContent('cookie-session-active');
        } else {
          // Attempt refresh
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setCurrentUser(refreshData.user);
            setAuthToken('cookie-session-active');
            await loadDatabaseContent('cookie-session-active');
          } else {
            setCurrentUser(null);
            setAuthToken(null);
          }
        }
      } catch (error) {
        console.error('Error verifying custom auth session:', error);
        setCurrentUser(null);
        setAuthToken(null);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuthSession();
  }, []);

  // Pull database records for authenticated sessions
  const loadDatabaseContent = async (token: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load pages
      const pagesRes = await fetch('/api/pages', { headers });
      if (pagesRes.ok) {
        const dbPages = await pagesRes.json();
        if (dbPages.length > 0) {
          setPages(dbPages);
        }
      }

      // Load media
      const mediaRes = await fetch('/api/media', { headers });
      if (mediaRes.ok) {
        const dbMedia = await mediaRes.json();
        setMedia(dbMedia);
      }

      // Load page versions
      const verRes = await fetch('/api/versions', { headers });
      if (verRes.ok) {
        const dbVersions = await verRes.json();
        setVersions(dbVersions);
      }

      // Load submissions
      const subRes = await fetch('/api/submissions', { headers });
      if (subRes.ok) {
        const dbSubmissions = await subRes.json();
        setSubmissions(dbSubmissions);
      }

      // Load logs
      const logsRes = await fetch('/api/logs', { headers });
      if (logsRes.ok) {
        const dbLogs = await logsRes.json();
        const formattedLogs: LogEntry[] = dbLogs.map((l: any) => ({
          id: `log-${l.id}`,
          timestamp: l.timestamp,
          user: l.user,
          action: l.action,
          details: l.details
        }));
        setLogs(formattedLogs);
      }
    } catch (error) {
      console.error('Error fetching databases tables:', error);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('cms_dark_mode', String(darkMode));
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 3. App Actions
  const handleAddLog = (action: string, details: string) => {
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${uniqueSuffix}`,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.email : 'anonimo@portal.com',
      action,
      details,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleFormSubmission = async (submission: FormSubmission) => {
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });
      if (res.ok) {
        const savedSub = await res.json();
        setSubmissions((prev) => [savedSub, ...prev]);
        handleAddLog('Envío de Formulario', `Se recibió una respuesta en el formulario "${submission.formTitle}".`);
      }
    } catch (error) {
      console.error('Error saving submission to database:', error);
    }
  };

  const handleLogout = async () => {
    handleAddLog('Cierre de Sesión', 'El usuario administrativo cerró la sesión.');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setCurrentUser(null);
    setAuthToken(null);
    setCurrentView('portal');
  };

  const handleLoginRequest = () => {
    setCurrentView('admin');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300 font-sans">
      
      {/* Dynamic Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginRequest={handleLoginRequest}
      />

      {/* Main Container */}
      <div className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Context Banner */}
        <div className="mb-6 p-4 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100/60 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Evaluación de Prototipo Activa</p>
              <p className="text-gray-500 dark:text-gray-400">Este prototipo simula una arquitectura de nivel enterprise con persistencia local persistente.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto font-bold">
            <span className="text-gray-500">Vista actual:</span>
            {currentView === 'blueprint' && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm flex items-center gap-1 font-mono uppercase text-[9px]">
                <Code className="h-3 w-3" /> Blueprint
              </span>
            )}
            {currentView === 'portal' && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center gap-1 font-mono uppercase text-[9px]">
                <Layers className="h-3 w-3" /> Portal Público
              </span>
            )}
            {currentView === 'admin' && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-sm flex items-center gap-1 font-mono uppercase text-[9px]">
                <Shield className="h-3 w-3" /> Panel Admin
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Views Router */}
        {currentView === 'blueprint' && <ArchitectureBlueprint />}
        
        {currentView === 'portal' && (
          <PublicPortal pages={pages} onSubmitForm={handleFormSubmission} />
        )}
        
        {currentView === 'admin' && (
          <AdminPanel
            pages={pages}
            setPages={setPages}
            versions={versions}
            setVersions={setVersions}
            media={media}
            setMedia={setMedia}
            submissions={submissions}
            setSubmissions={setSubmissions}
            currentUser={currentUser}
            onLoginSuccess={(user) => setCurrentUser(user)}
            authToken={authToken}
            setAuthToken={setAuthToken}
            logs={logs}
            onAddLog={handleAddLog}
          />
        )}
      </div>

      {/* Aesthetic Craft Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-950/40 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            <p>© 2026 CMS Enterprise S.A. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-4 font-mono text-[10px]">
            <span className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">FastAPI API v1.0.0</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Next.js App Router v15</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">PostgreSQL Engine JSONB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
