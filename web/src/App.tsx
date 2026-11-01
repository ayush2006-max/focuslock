import { useEffect, useRef, useState } from 'react';
import { useFocusStore } from './hooks/useFocusStore';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { Landing } from './pages/Landing';
import { Setup } from './pages/Setup';
import { ActiveSession } from './pages/ActiveSession';
import { Completion } from './pages/Completion';
import { StatsPage } from './pages/Stats';
import { SettingsPage } from './pages/Settings';
import { playCompletionChime } from './utils/sound';

type View = 'landing' | 'setup' | 'active' | 'complete' | 'stats' | 'settings';

export default function App() {
  useTheme();
  const store = useFocusStore();
  const [view, setView] = useState<View>('landing');
  const prevSessionId = useRef<string | null>(null);
  const chimedFor = useRef<string | null>(null);

  // Adapt the view to reality: a session starting elsewhere opens Focus Mode,
  // and a timer completing automatically opens the completion screen.
  useEffect(() => {
    const s = store.session;
    if (s && prevSessionId.current !== s.id) {
      prevSessionId.current = s.id;
      setView('active');
    } else if (!s && prevSessionId.current) {
      prevSessionId.current = null;
      if (store.completedSession) setView('complete');
    }
  }, [store.session, store.completedSession]);

  // Play the completion chime once per session (respects the sound setting).
  useEffect(() => {
    const c = store.completedSession;
    if (c && store.settings.soundEnabled && chimedFor.current !== c.id) {
      chimedFor.current = c.id;
      playCompletionChime();
    }
  }, [store.completedSession, store.settings.soundEnabled]);

  const navigate = (next: View) => {
    if (view === 'complete' && next !== 'complete') store.dismissCompletion();
    setView(next);
  };

  return (
    <div className="min-h-screen">
      <Header
        view={view}
        onNavigate={navigate}
        activeSession={store.session != null}
        extensionAvailable={store.extensionAvailable}
        extensionVersion={store.extensionVersion}
      />
      {view === 'landing' && <Landing store={store} onNavigate={navigate} />}
      {view === 'setup' && <Setup store={store} onNavigate={navigate} />}
      {view === 'active' && (store.session ? <ActiveSession store={store} onNavigate={navigate} /> : <Landing store={store} onNavigate={navigate} />)}
      {view === 'complete' && <Completion session={store.completedSession} onNavigate={navigate} onDismiss={store.dismissCompletion} />}
      {view === 'stats' && <StatsPage store={store} />}
      {view === 'settings' && <SettingsPage store={store} onNavigate={navigate} />}

      {/* Quiet safety net: keep polling while the state may be changing. */}
      {store.session == null && store.completedSession == null && (
        <PollKeepAlive onTick={() => void store.refresh()} />
      )}
    </div>
  );
}

function PollKeepAlive({ onTick }: { onTick: () => void }) {
  const timer = useRef<number | null>(null);
  useEffect(() => {
    timer.current = window.setInterval(onTick, 20000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [onTick]);
  return null;
}
