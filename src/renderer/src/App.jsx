import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SetupView from './components/SetupView';
import Overview from './components/Overview';
import SkillsView from './components/SkillsView';
import AgentsView from './components/AgentsView';
import TeamsView from './components/TeamsView';
import MemoryView from './components/MemoryView';
import PlansView from './components/PlansView';

import CommandsView from './components/CommandsView';
import ReposView from './components/ReposView';
import ClaudeMdView from './components/ClaudeMdView';
import UsageView from './components/UsageView';
import McpView from './components/McpView';
import RulesView from './components/RulesView';
import TasksView from './components/TasksView';
import HooksView from './components/HooksView';
import EnvVarsView from './components/EnvVarsView';
import PermissionsView from './components/PermissionsView';
import PluginsView from './components/PluginsView';
import ContextView from './components/ContextView';
import LaunchProfilesView from './components/LaunchProfilesView';
import OctopusArt from './components/OctopusArt';

const SECTIONS = {
  overview:    { label: 'Overview',   icon: '\u2302', component: Overview },
  repos:       { label: 'Repos',      icon: '\u2395', component: ReposView },
  usage:       { label: 'Insights', icon: '\u25F0', component: UsageView },
  _d1:         { divider: true, label: 'Content' },
  'claude-md': { label: 'CLAUDE.md',  icon: '\u2767', component: ClaudeMdView },
  skills:      { label: 'Skills',     icon: '\u2726', component: SkillsView },
  agents:      { label: 'Agents',     icon: '\u2699', component: AgentsView },
  teams:       { label: 'Teams',      icon: '\u2687', component: TeamsView },
  commands:    { label: 'Commands',   icon: '\u276F', component: CommandsView },
  rules:       { label: 'Rules',      icon: '\u2696', component: RulesView },
  _d2:         { divider: true, label: 'Persistence' },
  memory:      { label: 'Memory',     icon: '\u2630', component: MemoryView },
  plans:       { label: 'Plans',      icon: '\u2637', component: PlansView },
  tasks:       { label: 'Tasks',      icon: '\u2611', component: TasksView },
  _d3:         { divider: true, label: 'Infrastructure' },
  mcp:         { label: 'MCP',        icon: '\u2B62', component: McpView },
  plugins:     { label: 'Plugins',    icon: '\u29C9', component: PluginsView },
  hooks:       { label: 'Hooks',      icon: '\u21BB', component: HooksView },
  _d4:         { divider: true, label: 'Configuration' },
  permissions: { label: 'Permissions', icon: '\u229A', component: PermissionsView },
  'env-vars':  { label: 'Env Vars',   icon: '\u2261', component: EnvVarsView },
  context:     { label: 'Context',    icon: '\u2B1A', component: ContextView },
  profiles:    { label: 'Profiles',   icon: '\u25B6', component: LaunchProfilesView },
};

export default function App() {
  const [section, setSection] = useState('overview');
  const [needsSetup, setNeedsSetup] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const Current = SECTIONS[section].component;

  useEffect(() => {
    window.api.invoke('/api/setup/status').then(s => setNeedsSetup(s.needsSetup));
  }, []);

  if (needsSetup === null) return (
    <div className="splash">
      <OctopusArt width={160} />
      <p className="splash-title">Claude Code Dashboard</p>
    </div>
  );
  if (needsSetup) return <SetupView onComplete={() => setNeedsSetup(false)} />;

  return (
    <div className="app">
      <div className="titlebar" />
      <Sidebar
        sections={SECTIONS}
        active={section}
        onSelect={setSection}
        onAbout={() => setShowAbout(true)}
      />
      <main className="main">
        <Current onNavigate={setSection} />
      </main>
      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={e => e.stopPropagation()}>
            <OctopusArt width={140} />
            <h2 className="about-name">Claude Code Dashboard</h2>
            <p className="about-version">v1.0.1</p>
            <p className="about-desc">Configuration viewer for Claude Code</p>
            <p className="about-author">Built by Terrence Fradet</p>
            <button className="btn-back" onClick={() => setShowAbout(false)} style={{ marginTop: 20 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
