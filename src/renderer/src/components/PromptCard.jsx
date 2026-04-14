import { useState } from 'react';

export default function PromptCard({ title, description, prompt }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(139,92,246,0.2)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      marginTop: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {description || 'Paste this into any Claude Code session to get started'}
          </div>
        </div>
        <button
          onClick={copy}
          style={{
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 600,
            background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.1)',
            color: copied ? '#059669' : '#7c3aed',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.25)'}`,
            borderRadius: 100,
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? 'Copied!' : 'Copy prompt'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        fontSize: 12,
        lineHeight: 1.65,
        color: 'var(--text-secondary)',
        background: 'var(--bg)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: "'SF Mono','Fira Code',monospace",
      }}>
        {prompt}
      </pre>
    </div>
  );
}
