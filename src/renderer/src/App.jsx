import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import SkillsView from './components/SkillsView';
import AgentsView from './components/AgentsView';
import TeamsView from './components/TeamsView';
import MemoryView from './components/MemoryView';
import PlansView from './components/PlansView';
import SettingsView from './components/SettingsView';
import CommandsView from './components/CommandsView';
import ReposView from './components/ReposView';
import ClaudeMdView from './components/ClaudeMdView';
import UsageView from './components/UsageView';
import McpView from './components/McpView';

const SECTIONS = {
  overview:  { label: 'Overview',   icon: '\u2302', component: Overview },
  repos:     { label: 'Repos',      icon: '\u2395', component: ReposView },
  skills:    { label: 'Skills',     icon: '\u2726', component: SkillsView },
  agents:    { label: 'Agents',     icon: '\u2699', component: AgentsView },
  teams:     { label: 'Teams',      icon: '\u2687', component: TeamsView },
  memory:    { label: 'Memory',     icon: '\u2630', component: MemoryView },
  plans:     { label: 'Plans',      icon: '\u2637', component: PlansView },
  commands:  { label: 'Commands',   icon: '\u276F', component: CommandsView },
  mcp:       { label: 'MCP',        icon: '\u2B62', component: McpView },
  'claude-md': { label: 'CLAUDE.md', icon: '\u2767', component: ClaudeMdView },
  usage:     { label: 'Self-Improvement', icon: '\u25F0', component: UsageView },
  settings:  { label: 'Settings',   icon: '\u2638', component: SettingsView },
};

export default function App() {
  const [section, setSection] = useState('overview');
  const Current = SECTIONS[section].component;

  return (
    <div className="app">
      <div className="titlebar" />
      <Sidebar
        sections={SECTIONS}
        active={section}
        onSelect={setSection}
      />
      <main className="main">
        <Current onNavigate={setSection} />
      </main>
    </div>
  );
}
