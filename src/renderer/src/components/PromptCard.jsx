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
    <div className="accent-box" style={{
      background: 'var(--bg-card)',
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
          className={`btn-accent${copied ? ' copied' : ''}`}
          onClick={copy}
          style={{
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 0,
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
      }}>
        {prompt}
      </pre>
    </div>
  );
}
