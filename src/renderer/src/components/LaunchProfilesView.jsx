import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PromptCard from './PromptCard';
import { SectionDivider } from './RepoItemsSection';

const PROFILES_PROMPT = `Help me set up launch profiles for Claude Code. Based on my current settings and how I use Claude across repos, suggest shell aliases or scripts I should create for common workflows, like a quick review alias, a planning mode alias, and a headless mode for CI pipelines. Write them for my shell config.`;

function ProfileCard({ profile }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(profile.command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>{profile.name}</h3>
          <p style={{ margin: 0 }}>{profile.description}</p>
        </div>
        <button
          onClick={copy}
          style={{
            fontSize: 11, fontWeight: 600, padding: '5px 12px',
            background: copied ? 'var(--success-soft)' : 'var(--border-light)',
            color: copied ? 'var(--success)' : 'var(--text-secondary)',
            border: 'none', borderRadius: 0, cursor: 'pointer',
            flexShrink: 0, transition: 'all 0.15s',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <code style={{
        display: 'block', marginTop: 10, padding: '8px 12px',
        background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
        fontSize: 12, color: 'var(--text)', wordBreak: 'break-all',
      }}>
        {profile.command}
      </code>
    </div>
  );
}

export default function LaunchProfilesView() {
  const data = useApi('/launch-profiles');

  if (data.loading) return <div className="loading">Loading</div>;
  if (data.error) return <div className="loading">Failed to load profiles</div>;

  const profiles = data.data?.profiles || [];
  const categories = [...new Set(profiles.map(p => p.category))];

  return (
    <div>
      <div className="section-header">
        <h1>Launch Profiles</h1>
        <p>Common CLI flag combinations for different workflows</p>
      </div>

      {data.data?.currentModel && (
        <div style={{
          padding: '10px 16px', marginBottom: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Current default model:</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px',
            background: 'var(--accent-soft)', color: 'var(--accent-light)', borderRadius: 0,
          }}>
            {data.data.currentModel}
          </span>
        </div>
      )}

      {categories.map(cat => {
        const catProfiles = profiles.filter(p => p.category === cat);
        return (
          <div key={cat}>
            <SectionDivider label={cat} />
            <div className="card-grid">
              {catProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </div>
        );
      })}

      <PromptCard title="Create shell aliases" description="Ask Claude Code to write launch aliases for your shell config." prompt={PROFILES_PROMPT} />
    </div>
  );
}
