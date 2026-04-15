// Demo data for screenshots. Activate with DEMO=1 env var.

export const DEMO = process.env.DEMO === '1'

const demoHandlers = {}

demoHandlers['/api/setup/status'] = () => ({
  needsSetup: false, isMAS: false, paths: { claudeDir: '/Users/demo/.claude', reposDir: '/Users/demo/Documents/GitHub' },
})

demoHandlers['/api/overview'] = () => ({
  skills: 8, agents: 3, teams: 2, plans: 5, commands: 12,
  projects: 14, projectsWithMemory: 6,
  repoSkills: 11, repoCommands: 18, repoAgents: 4,
  totalRepos: 23, reposWithConfig: 15,
})

demoHandlers['/api/insights'] = () => [
  { id: 'model', type: 'info', title: 'Active model', message: "You're running claude-opus-4-6 globally." },
  { id: 'commands-vs-skills', type: 'tip', title: '12 commands in ~/.claude/commands/', message: 'Commands are simple prompt templates. Consider promoting frequently-used commands to skills for metadata, versioning, and more power.' },
  { id: 'hooks', type: 'info', title: '4 hooks configured', message: 'Automation running on: PreToolUse, PostToolUse, Notification, Stop.' },
  { id: 'repos-no-config', type: 'tip', title: '8 of 23 repos have no Claude config', message: 'These repos have no CLAUDE.md or .claude/ directory. Adding a CLAUDE.md gives Claude project-specific context.' },
]

demoHandlers['/api/skills'] = () => [
  { id: 'code-review', name: 'Code Review', description: 'Deep code review with security, performance, and style checks', frontmatter: { name: 'Code Review', description: 'Deep code review with security, performance, and style checks', trigger: 'When the user asks to review code or a PR' }, content: 'Review the code changes thoroughly...' },
  { id: 'gen-tests', name: 'Generate Tests', description: 'Auto-generate unit tests for changed files', frontmatter: { name: 'Generate Tests', description: 'Auto-generate unit tests for changed files' }, content: 'Detect the test framework...' },
  { id: 'scaffold', name: 'Scaffold Project', description: 'Bootstrap Claude Code configuration for a new repo', frontmatter: { name: 'Scaffold Project' }, content: 'Analyze the repo structure...' },
  { id: 'dep-audit', name: 'Dependency Audit', description: 'Check for outdated, vulnerable, or unused dependencies', frontmatter: { name: 'Dependency Audit' }, content: 'Scan package.json...' },
  { id: 'changelog', name: 'Changelog', description: 'Generate structured changelog from git history', frontmatter: { name: 'Changelog' }, content: 'Read git log between refs...' },
  { id: 'pre-flight', name: 'Pre-flight Check', description: 'Run type-check, lint, and tests before committing', frontmatter: { name: 'Pre-flight Check' }, content: 'Detect project type...' },
  { id: 'migrate-db', name: 'DB Migration', description: 'Generate and validate database migration files', frontmatter: { name: 'DB Migration' }, content: 'Check current schema...' },
  { id: 'api-docs', name: 'API Docs', description: 'Generate OpenAPI spec from route handlers', frontmatter: { name: 'API Docs' }, content: 'Scan route files...' },
]

demoHandlers['/api/agents'] = () => [
  { id: 'researcher', name: 'Researcher', frontmatter: { name: 'Researcher', model: 'claude-sonnet-4-6', description: 'Deep-dive research agent for exploring complex questions across a codebase' }, content: 'You are a research agent...' },
  { id: 'code-simplifier', name: 'Code Simplifier', frontmatter: { name: 'Code Simplifier', model: 'claude-sonnet-4-6', description: 'Simplifies and refines code for clarity and maintainability' }, content: 'Review recently changed code...' },
  { id: 'security-auditor', name: 'Security Auditor', frontmatter: { name: 'Security Auditor', model: 'claude-opus-4-6', description: 'Audits code for OWASP Top 10 vulnerabilities and security best practices' }, content: 'Scan the codebase for...' },
]

demoHandlers['/api/teams'] = () => [
  { id: 'engineering', name: 'Engineering', config: { name: 'Engineering' }, inboxes: [{ name: 'reviews', data: {} }, { name: 'deploys', data: {} }], hasConfig: true },
  { id: 'design', name: 'Design', config: { name: 'Design' }, inboxes: [{ name: 'feedback', data: {} }], hasConfig: true },
]

demoHandlers['/api/memory'] = () => [
  {
    id: '-Users-demo-Documents-GitHub-webapp',
    displayPath: '/Users/demo/Documents/GitHub/webapp',
    memoryIndex: '- [User role](user_role.md) — Senior fullstack engineer, React + Node focus\n- [Testing preferences](feedback_testing.md) — Integration tests over mocks\n- [Project context](project_v2.md) — v2 rewrite in progress, shipping Q2',
    memories: [
      { id: 'user_role', file: 'user_role.md', frontmatter: { name: 'User role', type: 'user', description: 'Senior fullstack engineer' }, content: 'Senior fullstack engineer with React and Node.js focus. Prefers concise responses.' },
      { id: 'feedback_testing', file: 'feedback_testing.md', frontmatter: { name: 'Testing preferences', type: 'feedback', description: 'Integration tests over mocks' }, content: 'Use real database in tests, not mocks. **Why:** prior incident where mock/prod divergence masked a broken migration.' },
      { id: 'project_v2', file: 'project_v2.md', frontmatter: { name: 'v2 rewrite context', type: 'project', description: 'v2 rewrite in progress' }, content: 'Major rewrite targeting Q2. **Why:** Migrating from Pages Router to App Router.' },
    ],
    claudeMd: '# Webapp\n\nNext.js App Router + Supabase. Run `npm run dev` for local development.\n\n## Conventions\n- Use server components by default\n- Colocate types with their modules',
    hasMemory: true, hasIndex: true, hasClaude: true,
  },
  {
    id: '-Users-demo-Documents-GitHub-mobile-app',
    displayPath: '/Users/demo/Documents/GitHub/mobile-app',
    memoryIndex: '- [Stack context](project_stack.md) — React Native + Expo, EAS builds',
    memories: [
      { id: 'project_stack', file: 'project_stack.md', frontmatter: { name: 'Stack context', type: 'project', description: 'React Native + Expo' }, content: 'React Native with Expo managed workflow. EAS builds for iOS and Android.' },
    ],
    claudeMd: null,
    hasMemory: true, hasIndex: true, hasClaude: false,
  },
]

demoHandlers['/api/plans'] = () => [
  { id: 'auth-migration', file: 'auth-migration.md', title: 'Migrate auth from NextAuth to Clerk', frontmatter: {}, content: '# Migrate auth from NextAuth to Clerk\n\n## Context\nNextAuth session handling is causing issues with edge runtime...\n\n## Steps\n1. Install @clerk/nextjs\n2. Replace session providers\n3. Update middleware\n4. Migrate user references' },
  { id: 'dark-mode', file: 'dark-mode.md', title: 'Add dark mode with system preferences', frontmatter: {}, content: '# Dark mode\n\nUse CSS prefers-color-scheme media query...' },
  { id: 'perf-audit', file: 'perf-audit.md', title: 'Performance audit for dashboard pages', frontmatter: {}, content: '# Performance audit\n\nInvestigate slow initial load on /dashboard...' },
  { id: 'api-v2', file: 'api-v2.md', title: 'API v2 with versioned endpoints', frontmatter: {}, content: '# API v2\n\nIntroduce /api/v2/ prefix with breaking changes...' },
  { id: 'ci-pipeline', file: 'ci-pipeline.md', title: 'Set up GitHub Actions CI pipeline', frontmatter: {}, content: '# CI Pipeline\n\nAdd type-check, lint, test, and deploy stages...' },
]

demoHandlers['/api/commands'] = () => [
  { id: 'commit', name: 'commit', files: ['commit.md'], content: 'Review all staged changes and create a well-structured commit message following conventional commits.' },
  { id: 'review-pr', name: 'review-pr', files: ['review-pr.md'], content: 'Review the current PR. Check for bugs, performance issues, and style.' },
  { id: 'fix-types', name: 'fix-types', files: ['fix-types.md'], content: 'Run tsc --noEmit and fix all type errors in the project.' },
  { id: 'explain', name: 'explain', files: ['explain.md'], content: 'Explain the current file or function in detail.' },
  { id: 'refactor', name: 'refactor', files: ['refactor.md'], content: 'Refactor the selected code for clarity and performance.' },
  { id: 'test', name: 'test', files: ['test.md'], content: 'Generate tests for the current file.' },
  { id: 'deploy', name: 'deploy', files: ['deploy.md'], content: 'Run the deploy pipeline for the current project.' },
  { id: 'debug', name: 'debug', files: ['debug.md'], content: 'Investigate and fix the described bug.' },
  { id: 'docs', name: 'docs', files: ['docs.md'], content: 'Generate documentation for the current module.' },
  { id: 'migrate', name: 'migrate', files: ['migrate.md'], content: 'Create a database migration for the described schema change.' },
  { id: 'perf', name: 'perf', files: ['perf.md'], content: 'Profile and optimize the described performance issue.' },
  { id: 'security', name: 'security', files: ['security.md'], content: 'Audit the current file for security vulnerabilities.' },
]

demoHandlers['/api/claude-md'] = () => ({
  global: '# Global Instructions\n\n## Writing Style\n- Keep responses concise. No trailing summaries.\n- When writing copy, match a direct and natural tone.\n\n## Tech Stack Defaults\n- TypeScript (strict), Next.js App Router, Tailwind CSS\n- Vitest for testing, Supabase for backend\n- Anthropic SDK for AI features\n\n## Code Conventions\n- Prefer @/ path aliases\n- No unnecessary abstractions\n- Only add comments where logic is not self-evident',
})

demoHandlers['/api/settings'] = () => ({
  global: {
    model: 'claude-opus-4-6',
    permissions: {
      allow: ['Read', 'Glob', 'Grep', 'Bash(npm run *)'],
      deny: ['Bash(rm -rf *)'],
    },
    hooks: {
      PreToolUse: [{ matcher: 'Bash', command: 'echo "Running bash"' }],
      PostToolUse: [{ matcher: '*', command: 'echo "Done"' }],
      Notification: [{ command: 'terminal-notifier -message "$CLAUDE_NOTIFICATION"' }],
      Stop: [{ command: 'echo "Session ended"' }],
    },
  },
  local: null,
})

demoHandlers['/api/plugins'] = () => ({
  config: null,
  installed: {
    'playwright@npm': [{ installedAt: '2026-03-10T10:00:00Z' }],
    'vercel@npm': [{ installedAt: '2026-02-15T14:30:00Z' }],
    'linear@npm': [{ installedAt: '2026-01-20T09:00:00Z' }],
  },
})

demoHandlers['/api/permissions'] = () => ({
  allow: ['Read', 'Glob', 'Grep', 'Bash(npm run *)'],
  deny: ['Bash(rm -rf *)'],
  mcpServers: {
    plugin_playwright_playwright: { plugin: 'playwright', registry: 'npm', serverKey: 'playwright', config: { type: 'stdio' } },
    plugin_vercel_vercel: { plugin: 'vercel', registry: 'npm', serverKey: 'vercel', config: { type: 'http', url: 'https://mcp.vercel.com' } },
    plugin_linear_linear: { plugin: 'linear', registry: 'npm', serverKey: 'linear', config: { type: 'http', url: 'https://mcp.linear.app' } },
  },
})

demoHandlers['/api/repos'] = () => [
  { name: 'webapp', path: '/Users/demo/Documents/GitHub/webapp', hasDotClaude: true, claudeMd: '# Webapp\nNext.js App Router + Supabase.', settings: { model: 'claude-opus-4-6' }, settingsLocal: null, skills: [{ id: 'deploy', name: 'Deploy', description: 'Deploy to Vercel', frontmatter: {}, content: '' }], commands: [{ id: 'commit', name: 'commit', content: 'Review staged changes...' }], agents: [{ id: 'reviewer', name: 'Code Reviewer', frontmatter: { model: 'claude-sonnet-4-6' }, content: '' }], rules: [], hooks: { PreToolUse: [{ matcher: 'Bash', command: 'echo "ok"' }] }, memoryCount: 3, configItems: ['CLAUDE.md', '.claude/', 'settings', '1 skill', '1 command', '1 agent', '3 memories', 'hooks'], hasConfig: true },
  { name: 'mobile-app', path: '/Users/demo/Documents/GitHub/mobile-app', hasDotClaude: true, claudeMd: '# Mobile App\nReact Native + Expo.', settings: null, settingsLocal: null, skills: [{ id: 'build', name: 'EAS Build', description: 'Run EAS build', frontmatter: {}, content: '' }, { id: 'test-e2e', name: 'E2E Tests', description: 'Run Detox E2E tests', frontmatter: {}, content: '' }], commands: [{ id: 'deploy', name: 'deploy', content: 'Run eas build...' }], agents: [], rules: [{ id: 'no-inline', name: 'no-inline-styles', content: 'Never use inline styles.' }], hooks: null, memoryCount: 1, configItems: ['CLAUDE.md', '.claude/', '2 skills', '1 command', '1 rule', '1 memory'], hasConfig: true },
  { name: 'api-gateway', path: '/Users/demo/Documents/GitHub/api-gateway', hasDotClaude: true, claudeMd: '# API Gateway\nExpress + TypeScript.', settings: null, settingsLocal: null, skills: [], commands: [{ id: 'migrate', name: 'migrate', content: 'Run migrations...' }], agents: [], rules: [], hooks: null, memoryCount: 2, configItems: ['CLAUDE.md', '.claude/', '1 command', '2 memories'], hasConfig: true },
  { name: 'design-system', path: '/Users/demo/Documents/GitHub/design-system', hasDotClaude: true, claudeMd: null, settings: null, settingsLocal: null, skills: [], commands: [], agents: [], rules: [], hooks: null, memoryCount: 0, configItems: ['.claude/'], hasConfig: true },
  { name: 'marketing-site', path: '/Users/demo/Documents/GitHub/marketing-site', hasDotClaude: false, claudeMd: '# Marketing Site\nAstro + Tailwind.', settings: null, settingsLocal: null, skills: [], commands: [], agents: [], rules: [], hooks: null, memoryCount: 0, configItems: ['CLAUDE.md'], hasConfig: true },
  { name: 'data-pipeline', path: '/Users/demo/Documents/GitHub/data-pipeline', hasDotClaude: false, claudeMd: null, settings: null, settingsLocal: null, skills: [], commands: [], agents: [], rules: [], hooks: null, memoryCount: 0, configItems: [], hasConfig: false },
  { name: 'playground', path: '/Users/demo/Documents/GitHub/playground', hasDotClaude: false, claudeMd: null, settings: null, settingsLocal: null, skills: [], commands: [], agents: [], rules: [], hooks: null, memoryCount: 0, configItems: [], hasConfig: false },
  { name: 'dotfiles', path: '/Users/demo/Documents/GitHub/dotfiles', hasDotClaude: false, claudeMd: null, settings: null, settingsLocal: null, skills: [], commands: [], agents: [], rules: [], hooks: null, memoryCount: 0, configItems: [], hasConfig: false },
]

demoHandlers['/api/dev-servers'] = () => [
  { pid: 12345, port: 3000, command: 'next', cwd: '/Users/demo/Documents/GitHub/webapp', repoPath: '/Users/demo/Documents/GitHub/webapp', repoName: 'webapp' },
  { pid: 12346, port: 8080, command: 'node', cwd: '/Users/demo/Documents/GitHub/api-gateway', repoPath: '/Users/demo/Documents/GitHub/api-gateway', repoName: 'api-gateway' },
]

demoHandlers['/api/usage'] = () => ({
  hasReport: false,
  reportPath: null,
  reportHtml: null,
  totalSessions: 247,
  analyzedSessions: 189,
  totalMessages: 8430,
  totalCommits: 312,
  totalHours: 186,
  dateFrom: '2026-01-15',
  dateTo: '2026-04-14',
  topTools: [
    { name: 'Edit', count: 2840 },
    { name: 'Read', count: 2210 },
    { name: 'Bash', count: 1890 },
    { name: 'Grep', count: 1340 },
    { name: 'Glob', count: 980 },
    { name: 'Write', count: 720 },
    { name: 'Agent', count: 410 },
    { name: 'WebFetch', count: 190 },
  ],
  topProjects: [
    { name: 'webapp', count: 84 },
    { name: 'mobile-app', count: 52 },
    { name: 'api-gateway', count: 38 },
    { name: 'design-system', count: 24 },
    { name: 'marketing-site', count: 18 },
    { name: 'data-pipeline', count: 12 },
    { name: 'claude-code-dashboard', count: 9 },
  ],
  outcomes: { success: 142, partial: 31, abandoned: 16 },
  frictionCats: { 'permission-denied': 24, 'context-limit': 18, 'tool-error': 12, 'unclear-instructions': 8 },
})

export { demoHandlers }
