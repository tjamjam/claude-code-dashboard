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

const SECTIONS = {
  overview: { label: 'Overview', icon: '\u2302', component: Overview },
  repos: { label: 'Repos', icon: '\u2395', component: ReposView },
  skills: { label: 'Skills', icon: '\u2726', component: SkillsView },
  agents: { label: 'Agents', icon: '\u2699', component: AgentsView },
  teams: { label: 'Teams', icon: '\u2687', component: TeamsView },
  memory: { label: 'Memory', icon: '\u2630', component: MemoryView },
  plans: { label: 'Plans', icon: '\u2637', component: PlansView },
  settings: { label: 'Settings', icon: '\u2638', component: SettingsView },
  commands: { label: 'Commands', icon: '\u276F', component: CommandsView },
};

export default function App() {
  const [section, setSection] = useState('overview');
  const Current = SECTIONS[section].component;

  return (
    <div className="app">
      <Sidebar
        sections={SECTIONS}
        active={section}
        onSelect={setSection}
      />
      <main className="main">
        <Current />
      </main>
    </div>
  );
}
