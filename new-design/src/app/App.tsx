import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import * as Tabs from '@radix-ui/react-tabs';
import { GitBranch, FileText, FileDiff, Terminal as TerminalIcon, Plus, X } from 'lucide-react';

// Mock data for demonstration
const mockRepositories = [
  {
    id: '1',
    name: 'my-project',
    branch: 'main',
    changes: [
      { path: 'src/components/Header.tsx', status: 'modified', additions: 12, deletions: 3 },
      { path: 'src/utils/helpers.ts', status: 'modified', additions: 8, deletions: 2 },
      { path: 'README.md', status: 'modified', additions: 5, deletions: 1 },
      { path: 'src/components/Footer.tsx', status: 'added', additions: 45, deletions: 0 },
      { path: 'src/styles/old-theme.css', status: 'deleted', additions: 0, deletions: 120 },
    ]
  },
  {
    id: '2',
    name: 'another-repo',
    branch: 'feature/new-ui',
    changes: [
      { path: 'components/Button.tsx', status: 'modified', additions: 5, deletions: 2 },
      { path: 'styles/global.css', status: 'modified', additions: 15, deletions: 8 },
    ]
  }
];

const mockDiff = `@@ -1,5 +1,8 @@
 import React from 'react';
+import { useState } from 'react';

 export function Header() {
+  const [isOpen, setIsOpen] = useState(false);
+
   return (
-    <header className="py-4">
+    <header className="py-6 px-4">
       <h1>My App</h1>
+      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
     </header>
   );
 }`;

export default function App() {
  const [repositories, setRepositories] = useState(mockRepositories);
  const [activeRepo, setActiveRepo] = useState(repositories[0].id);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const currentRepo = repositories.find(r => r.id === activeRepo);

  const addRepository = () => {
    const newRepo = {
      id: String(repositories.length + 1),
      name: `repo-${repositories.length + 1}`,
      branch: 'main',
      changes: []
    };
    setRepositories([...repositories, newRepo]);
    setActiveRepo(newRepo.id);
  };

  const closeRepository = (repoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = repositories.filter(r => r.id !== repoId);
    setRepositories(filtered);
    if (activeRepo === repoId && filtered.length > 0) {
      setActiveRepo(filtered[0].id);
    }
  };

  return (
    <div className="h-screen w-full bg-[#1e1e1e] flex flex-col overflow-hidden">
      {/* Tabs for repositories */}
      <Tabs.Root value={activeRepo} onValueChange={setActiveRepo} className="flex-1 flex flex-col min-h-0">
        <div className="bg-[#2d2d2d] border-b border-[#3e3e3e] flex items-center">
          <Tabs.List className="flex items-center gap-0.5 px-2 flex-1 overflow-x-auto">
            {repositories.map((repo) => (
              <Tabs.Trigger
                key={repo.id}
                value={repo.id}
                className="group flex items-center gap-2 px-4 py-2.5 text-sm text-[#cccccc] hover:text-white border-b-2 border-transparent data-[state=active]:border-[#007acc] data-[state=active]:text-white transition-colors whitespace-nowrap"
              >
                <GitBranch className="w-4 h-4" />
                <span>{repo.name}</span>
                <span className="text-xs text-[#888888]">({repo.branch})</span>
                {repositories.length > 1 && (
                  <button
                    onClick={(e) => closeRepository(repo.id, e)}
                    className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-[#3e3e3e] rounded p-0.5 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <button
            onClick={addRepository}
            className="px-3 py-2 text-[#cccccc] hover:text-white hover:bg-[#3e3e3e] transition-colors"
            title="Add repository"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {repositories.map((repo) => (
          <Tabs.Content
            key={repo.id}
            value={repo.id}
            className="flex-1 min-h-0 outline-none"
          >
            <PanelGroup direction="vertical" className="h-full">
              {/* Top section: Files and Diff */}
              <Panel defaultSize={70} minSize={30}>
                <PanelGroup direction="horizontal">
                  {/* Changed Files List */}
                  <Panel defaultSize={30} minSize={20} className="bg-[#252526]">
                    <div className="h-full flex flex-col">
                      <div className="px-4 py-3 border-b border-[#3e3e3e] flex items-center gap-2 text-sm font-medium text-[#cccccc]">
                        <FileDiff className="w-4 h-4" />
                        <span>Changes ({repo.changes.length})</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {repo.changes.map((change, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedFile(change.path)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-[#2a2d2e] transition-colors border-l-2 ${
                              selectedFile === change.path
                                ? 'border-[#007acc] bg-[#2a2d2e]'
                                : 'border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#888888] flex-shrink-0" />
                              <span className="text-[#cccccc] truncate">{change.path}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-6 text-xs">
                              {change.status === 'modified' && (
                                <>
                                  <span className="text-[#4ec9b0]">M</span>
                                  <span className="text-[#4ec9b0]">+{change.additions}</span>
                                  <span className="text-[#f48771]">-{change.deletions}</span>
                                </>
                              )}
                              {change.status === 'added' && (
                                <>
                                  <span className="text-[#89d185]">A</span>
                                  <span className="text-[#89d185]">+{change.additions}</span>
                                </>
                              )}
                              {change.status === 'deleted' && (
                                <>
                                  <span className="text-[#f48771]">D</span>
                                  <span className="text-[#f48771]">-{change.deletions}</span>
                                </>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </Panel>

                  <PanelResizeHandle className="w-1 bg-[#3e3e3e] hover:bg-[#007acc] transition-colors cursor-col-resize" />

                  {/* Diff View */}
                  <Panel defaultSize={70} minSize={40} className="bg-[#1e1e1e]">
                    <div className="h-full flex flex-col">
                      <div className="px-4 py-3 border-b border-[#3e3e3e] flex items-center gap-2 text-sm font-medium text-[#cccccc]">
                        <FileDiff className="w-4 h-4" />
                        <span>{selectedFile || 'Select a file to view diff'}</span>
                      </div>
                      <div className="flex-1 overflow-auto">
                        {selectedFile ? (
                          <pre className="p-4 text-sm font-mono text-[#d4d4d4] leading-relaxed">
                            {mockDiff.split('\n').map((line, i) => (
                              <div
                                key={i}
                                className={`px-2 ${
                                  line.startsWith('+') && !line.startsWith('+++')
                                    ? 'bg-[#1e4620] text-[#4ec9b0]'
                                    : line.startsWith('-') && !line.startsWith('---')
                                    ? 'bg-[#4b1818] text-[#f48771]'
                                    : line.startsWith('@@')
                                    ? 'text-[#569cd6]'
                                    : ''
                                }`}
                              >
                                {line}
                              </div>
                            ))}
                          </pre>
                        ) : (
                          <div className="flex items-center justify-center h-full text-[#888888]">
                            <div className="text-center">
                              <FileDiff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Select a changed file to view the diff</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                </PanelGroup>
              </Panel>

              <PanelResizeHandle className="h-1 bg-[#3e3e3e] hover:bg-[#007acc] transition-colors cursor-row-resize" />

              {/* Terminal */}
              <Panel defaultSize={30} minSize={15} className="bg-[#1e1e1e]">
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-[#3e3e3e] flex items-center gap-2 text-sm font-medium text-[#cccccc]">
                    <TerminalIcon className="w-4 h-4" />
                    <span>Terminal</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                    <div className="text-[#4ec9b0]">
                      <span className="text-[#569cd6]">~/projects/{repo.name}</span>
                      <span className="text-[#cccccc]"> $ </span>
                      <span className="text-[#d4d4d4]">git status</span>
                    </div>
                    <div className="mt-2 text-[#d4d4d4]">
                      <div>On branch <span className="text-[#4ec9b0]">{repo.branch}</span></div>
                      <div className="mt-2">Changes not staged for commit:</div>
                      <div className="ml-4 mt-1">
                        {repo.changes.slice(0, 3).map((change, i) => (
                          <div key={i} className="text-[#f48771]">
                            {change.status === 'modified' && 'modified:   '}
                            {change.status === 'added' && 'new file:   '}
                            {change.status === 'deleted' && 'deleted:    '}
                            <span className="text-[#cccccc]">{change.path}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 text-[#4ec9b0] flex">
                      <span className="text-[#569cd6]">~/projects/{repo.name}</span>
                      <span className="text-[#cccccc]"> $ </span>
                      <span className="text-[#d4d4d4] ml-1 animate-pulse">▊</span>
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}