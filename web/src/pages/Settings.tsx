import { useState } from 'react';
import type { SiteEntry } from '@shared/types';
import type { FocusStore } from '../hooks/useFocusStore';
import { SiteListEditor } from '../components/SiteListEditor';
import { EmergencyExitModal } from '../components/EmergencyExitModal';
import { ThemeToggle } from '../components/Header';

type View = 'landing' | 'setup' | 'active' | 'complete' | 'stats' | 'settings';

function settingRow(label: string, desc: string, control: React.ReactNode) {
  return (
    <div className="flex items-center justify-between gap-6 py-1">
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{desc}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-accent-600' : 'bg-zinc-300 dark:bg-white/15'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

export function SettingsPage({ store, onNavigate }: { store: FocusStore; onNavigate: (v: View) => void }) {
  const { settings, setSettings, session } = store;
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const update = (patch: Partial<typeof settings>) => setSettings({ ...settings, ...patch });

  const defaultList: SiteEntry[] = settings.defaultBlockList.map((domain, i) => ({
    id: `default-${i}`,
    domain,
    enabled: true,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>

      <div className="mt-8 space-y-6">
        <section className="card p-6">
          <h2 className="font-semibold">Appearance</h2>
          <div className="mt-3 space-y-2">
            {settingRow('Theme', 'Match the app to your setup.', <ThemeToggle />)}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Focus Defaults</h2>
          <p className="mt-1 text-xs text-zinc-400">Prefilled on the next session, nothing is blocked automatically.</p>
          <div className="mt-3 space-y-4">
            {settingRow(
              'Default Focus Duration',
              'Used when opening the session setup.',
              (
                <select
                  value={settings.defaultDurationMinutes}
                  onChange={(e) => update({ defaultDurationMinutes: Number(e.target.value) })}
                  className="input !w-32"
                  aria-label="Default focus duration"
                >
                  {[15, 25, 30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {m === 60 ? '1 hour' : m === 120 ? '2 hours' : `${m} min`}
                    </option>
                  ))}
                </select>
              ),
            )}
            <div className="border-t border-zinc-100 pt-4 dark:border-white/5">
              <p className="mb-1 font-medium">Default Block List</p>
              <p className="mb-3 text-xs text-zinc-400">Websites kept ready for your next session.</p>
              <SiteListEditor
                sites={defaultList}
                onChange={(sites) => update({ defaultBlockList: sites.filter((s) => s.enabled).map((s) => s.domain) })}
                placeholder="youtube.com"
              />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Sound &amp; Notifications</h2>
          <div className="mt-3 divide-y divide-zinc-100 dark:divide-white/5">
            {settingRow('Completion Sound', 'Play a gentle chime when a session ends.', (
              <Toggle checked={settings.soundEnabled} onChange={(v) => update({ soundEnabled: v })} label="Sound" />
            ))}
            {settingRow('Notifications', 'Show a browser notification when a session ends.', (
              <Toggle checked={settings.notificationsEnabled} onChange={(v) => update({ notificationsEnabled: v })} label="Notifications" />
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Privacy</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            FocusLock never collects or stores your browsing history and does not inspect page contents.
            Only your selected blocked domains, focus sessions, preferences, and basic statistics are kept —
            all locally on this device. No servers, no accounts, no analytics.
          </p>
        </section>

        <section className="card border-rose-200/70 p-6 dark:border-rose-500/20">
          <h2 className="font-semibold text-rose-600 dark:text-rose-400">Emergency Exit</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Always available. Immediately stops any running session — you can never be locked out.
          </p>
          <button onClick={() => setEmergencyOpen(true)} className="btn-danger mt-4">
            Open Emergency Exit
          </button>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">About FocusLock</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            FocusLock v1.0 · local-first distraction blocking for Chromium browsers.
            Built with a Manifest V3 extension using declarativeNetRequest — no content inspection, ever.
          </p>
        </section>
      </div>

      <EmergencyExitModal
        open={emergencyOpen}
        onCancel={() => setEmergencyOpen(false)}
        onConfirm={() => {
          if (session) void store.emergency();
          setEmergencyOpen(false);
          onNavigate('landing');
        }}
      />
    </main>
  );
}
