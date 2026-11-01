import { useEffect, useState } from 'react';
import { formatDuration } from '@shared/utils';
import { TYPING_SENTENCES } from '@shared/presets';
import { Modal } from './Modal';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

type ChallengeKind = 'math' | 'memory' | 'typing' | 'wait';

interface EndSessionModalProps {
  open: boolean;
  remainingMinutes: number;
  onContinue: () => void;
  /** Called only after the challenge is completed successfully. */
  onPassed: () => void;
}

/**
 * "End session early?" confirmation + randomized Escape Challenge.
 * Adds just enough friction for a conscious decision — always escapable.
 */
export function EndSessionModal({ open, remainingMinutes, onContinue, onPassed }: EndSessionModalProps) {
  const [stage, setStage] = useState<'confirm' | 'challenge'>('confirm');
  const [challenge] = useState<ChallengeKind>(() =>
    pick<ChallengeKind>(['math', 'memory', 'typing', 'wait']),
  );
  const titles: Record<ChallengeKind, string> = {
    math: 'Quick Math',
    memory: 'Memory',
    typing: 'Typing',
    wait: 'Take a Breath',
  };

  useEffect(() => {
    if (open) setStage('confirm');
  }, [open]);

  const close = () => onContinue();

  return (
    <Modal open={open} onClose={close} labelledBy="end-session-modal-title">
      {stage === 'confirm' ? (
        <>
          <h2 id="end-session-modal-title" className="text-xl font-bold">
            End Focus Session?
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            You still have <span className="font-semibold text-zinc-800 dark:text-zinc-100">{formatDuration(remainingMinutes)}</span> remaining.
            Do you really want to stop?
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
            <button onClick={close} className="btn-primary flex-1">
              Continue Focus
            </button>
            <button onClick={() => setStage('challenge')} className="btn-secondary flex-1">
              End Early
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-500">Escape Challenge</p>
          <h2 id="end-session-modal-title" className="mt-2 text-xl font-bold">
            {titles[challenge]}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            A small pause before you stop focusing. Complete it to end the session.
          </p>
          <div className="mt-5">
            {challenge === 'math' && <MathChallenge onSuccess={onPassed} />}
            {challenge === 'memory' && <MemoryChallenge onSuccess={onPassed} />}
            {challenge === 'typing' && <TypingChallenge onSuccess={onPassed} />}
            {challenge === 'wait' && <WaitingChallenge onSuccess={onPassed} />}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={close}
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ‹ Continue Focus
            </button>
            <span className="text-xs text-zinc-400">You can retry — it is friction, not a lock.</span>
          </div>
        </>
      )}
    </Modal>
  );
}

function Shell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-white/5">
      {children}
      <div className="mt-4">{footer}</div>
    </div>
  );
}

function MathChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [problem] = useState(() => {
    const a = 21 + Math.floor(Math.random() * 79);
    const b = 3 + Math.floor(Math.random() * 7);
    return { a, b };
  });
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const expected = String(problem.a * problem.b);

  const submit = () => {
    if (answer.trim() === expected) onSuccess();
    else setError(true);
  };

  return (
    <Shell
      footer={
        <button className="btn-primary w-full" onClick={submit}>
          Submit
        </button>
      }
    >
      <p className="text-center text-lg">
        Solve{' '}
        <span className="tabular font-bold">
          {problem.a} × {problem.b}
        </span>
      </p>
      <input
        autoFocus
        inputMode="numeric"
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value.replace(/\D/g, ''));
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Answer"
        className="input tabular mt-4 text-center text-2xl font-bold"
      />
      {error && <p className="mt-2 text-center text-xs font-medium text-rose-500">You got it wrong. Try again.</p>}
    </Shell>
  );
}

function MemoryChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [sequence] = useState(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)));
  const [phase, setPhase] = useState<'show' | 'answer'>('show');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const expected = sequence.join('');

  useEffect(() => {
    if (phase !== 'show') return;
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          setPhase('answer');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const submit = () => {
    if (answer.trim() === expected) onSuccess();
    else setError(true);
  };

  return (
    <Shell
      footer={
        phase === 'show' ? (
          <p className="text-center text-xs text-zinc-400">Memorize it — hiding in {secondsLeft}s</p>
        ) : (
          <button className="btn-primary w-full" onClick={submit}>
            Submit
          </button>
        )
      }
    >
      {phase === 'show' ? (
        <p className="tabular text-center text-3xl font-extrabold tracking-[0.45em]">{sequence.join(' ')}</p>
      ) : (
        <input
          autoFocus
          inputMode="numeric"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value.replace(/\D/g, ''));
            setError(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Enter the 5 digits, in order"
          className="input tabular text-center text-xl font-bold"
        />
      )}
      {phase === 'answer' && error && (
        <p className="mt-2 text-center text-xs font-medium text-rose-500">You got it wrong. Try again.</p>
      )}
    </Shell>
  );
}

function TypingChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [sentence] = useState(() => pick(TYPING_SENTENCES));
  const [typed, setTyped] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (typed.trim().toLowerCase() === sentence.toLowerCase()) onSuccess();
    else setError(true);
  };

  return (
    <Shell
      footer={
        <button className="btn-primary w-full" onClick={submit}>
          Submit
        </button>
      }
    >
      <p className="text-center text-lg font-semibold italic">“{sentence}”</p>
      <input
        autoFocus
        value={typed}
        onChange={(e) => {
          setTyped(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Type it exactly"
        className="input mt-4"
      />
      {error && <p className="mt-2 text-center text-xs font-medium text-rose-500">You got it wrong. Try again.</p>}
    </Shell>
  );
}

const WAIT_SECONDS = 30;

function WaitingChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Shell
      footer={
        secondsLeft > 0 ? (
          <p className="text-center text-xs text-zinc-400">
            Keep this open — your session continues in the background.
          </p>
        ) : (
          <button className="btn-primary w-full" onClick={onSuccess}>
            End Session
          </button>
        )
      }
    >
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Take {WAIT_SECONDS} seconds before ending your session.
      </p>
      <p className="tabular mt-3 text-center text-5xl font-extrabold text-accent-600 dark:text-accent-400">
        {secondsLeft}
      </p>
    </Shell>
  );
}
