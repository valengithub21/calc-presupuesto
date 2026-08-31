/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import BudgetCalculator from './components/BudgetCalculator';
import { Hammer, Moon, Sun, Download } from 'lucide-react';

export default function App() {
  const [budgetName, setBudgetName] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Actualiza el color de la barra de estado del celular para que
    // coincida con el fondo de la app (blanco en claro, negro en oscuro)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1c1917' : '#ffffff');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-[#c2a78b] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans font-medium selection:bg-amber-200 dark:selection:bg-amber-900 transition-colors duration-200">
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-800 dark:bg-amber-700 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight">Presupuestos</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Gestor de Materiales</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 sm:max-w-xs justify-end">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 outline-none transition-colors font-bold text-stone-800 dark:text-stone-100 placeholder:font-semibold placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm shadow-sm"
            />
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 bg-white dark:bg-stone-900"
              aria-label="Alternar tema oscuro"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="p-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 flex items-center gap-2 font-bold shadow-sm"
                aria-label="Instalar aplicación"
                title="Instalar aplicación"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Instalar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-8 md:py-12">
        <BudgetCalculator budgetName={budgetName} />
      </main>
    </div>
  );
}

