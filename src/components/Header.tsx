/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon, Shield, Layout, ServerCrash, ExternalLink, LogOut, Code, Library } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentView: 'portal' | 'admin' | 'blueprint';
  setCurrentView: (view: 'portal' | 'admin' | 'blueprint') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: User | null;
  onLogout: () => void;
  onLoginRequest: () => void;
}

export default function Header({
  currentView,
  setCurrentView,
  darkMode,
  setDarkMode,
  currentUser,
  onLogout,
  onLoginRequest,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">
              CMS <span className="text-blue-600 dark:text-blue-400">Flex</span> Engine
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Constructor de Sitios Dinámicos</p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="hidden md:flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200/40 dark:border-gray-800/40">
          <button
            onClick={() => setCurrentView('portal')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentView === 'portal'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-100'
            }`}
            id="view-portal-btn"
          >
            <Layout className="h-3.5 w-3.5" />
            Portal Público
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentView === 'admin'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-100'
            }`}
            id="view-admin-btn"
          >
            <Shield className="h-3.5 w-3.5" />
            Panel Admin
          </button>
          <button
            onClick={() => setCurrentView('blueprint')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentView === 'blueprint'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-100'
            }`}
            id="view-blueprint-btn"
          >
            <Code className="h-3.5 w-3.5" />
            Blueprint Arquitectura
          </button>
        </div>

        {/* Actions (Theme toggle, login indicator) */}
        <div className="flex items-center gap-3">
          {/* Mobile Navigation Buttons */}
          <div className="md:hidden flex items-center gap-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setCurrentView('portal')}
              className={`p-1.5 rounded ${currentView === 'portal' ? 'bg-white dark:bg-gray-800 text-blue-600' : 'text-gray-500'}`}
              title="Portal Público"
            >
              <Layout className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`p-1.5 rounded ${currentView === 'admin' ? 'bg-white dark:bg-gray-800 text-blue-600' : 'text-gray-500'}`}
              title="Panel Admin"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentView('blueprint')}
              className={`p-1.5 rounded ${currentView === 'blueprint' ? 'bg-white dark:bg-gray-800 text-blue-600' : 'text-gray-500'}`}
              title="Blueprint Arquitectura"
            >
              <Code className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Theme Toggler */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            aria-label="Toggle theme"
            id="theme-toggle"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Status */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {currentUser.username}
                </span>
                <span className="text-[10px] text-gray-400 capitalize">
                  {currentUser.roleId}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Cerrar Sesión"
                id="logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginRequest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
              id="login-request-btn"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Acceso Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
