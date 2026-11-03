import { useState } from 'react';
import { DriverMonitor } from './features/driver/DriverMonitor';
import { AdminStub } from './features/admin/AdminStub';

export function App() {
  const [currentView, setCurrentView] = useState<'driver' | 'admin'>('driver');

  return (
    <div className="min-h-screen bg-automotive-dark flex flex-col automotive-grid-bg text-slate-100 selection:bg-automotive-cyan selection:text-slate-950">
      {currentView === 'driver' ? (
        <DriverMonitor 
          currentView={currentView} 
          onViewChange={setCurrentView} 
        />
      ) : (
        <div className="min-h-screen flex flex-col">
          {/* Header Bar cho Admin view */}
          <header className="w-full bg-automotive-card/95 backdrop-blur-md border-b border-automotive-border px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="font-mono font-bold text-slate-200 text-sm">
                PREDRIVE AI &bull; QUẢN TRỊ
              </span>
              <button
                onClick={() => setCurrentView('driver')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-automotive-cyan"
              >
                Vào buồng lái Tài xế
              </button>
            </div>
          </header>
          
          <main className="flex-1 flex items-center justify-center p-4">
            <AdminStub onBackToDriver={() => setCurrentView('driver')} />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
