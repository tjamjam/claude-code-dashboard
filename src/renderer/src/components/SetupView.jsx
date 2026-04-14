import { useState } from 'react';

export default function SetupView({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  async function handleSetup() {
    setRunning(true);
    setError(null);
    const result = await window.api.invoke('/api/setup/run');
    setRunning(false);
    if (result.ok) {
      onComplete();
    } else {
      setError(result.error || 'Setup was cancelled. Both folders are required for the app to work.');
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', padding: 40,
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '48px 40px',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
          Claude Code Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
          The Mac App Store version needs your permission to read two folders. You'll see two dialogs, each pre-opened to the right location. Just click <strong style={{ color: 'var(--text)' }}>Open</strong> on both.
        </p>

        <div style={{
          background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
          padding: '14px 18px', marginBottom: 24, textAlign: 'left',
          fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7,
        }}>
          <strong style={{ color: 'var(--text)' }}>1.</strong>{' '}
          <code style={{ background: 'var(--border-light)', padding: '1px 5px', borderRadius: 3 }}>~/.claude</code>{' '}
          your Claude Code config
          <br />
          <strong style={{ color: 'var(--text)' }}>2.</strong>{' '}
          <code style={{ background: 'var(--border-light)', padding: '1px 5px', borderRadius: 3 }}>~/Documents/GitHub</code>{' '}
          your repositories
        </div>

        <button
          onClick={handleSetup}
          disabled={running}
          style={{
            padding: '10px 28px', fontSize: 14, fontWeight: 600,
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 100, cursor: running ? 'wait' : 'pointer',
            opacity: running ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {running ? 'Waiting for selection...' : 'Grant Access'}
        </button>

        {error && (
          <p className="error-text" style={{ fontSize: 12.5, marginTop: 14 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
