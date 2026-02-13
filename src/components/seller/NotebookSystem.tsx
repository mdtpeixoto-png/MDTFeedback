import { useState } from "react";
import { Notebook, Plus, Trash2, FileText, Edit3, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotePage {
  id: string;
  title: string;
  content: string;
}

interface NotebookItem {
  id: string;
  name: string;
  pages: NotePage[];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function NotebookSystem() {
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([
    {
      id: 'nb1',
      name: 'Meu Caderno',
      pages: [{ id: 'p1', title: 'Primeira página', content: '' }],
    },
  ]);
  const [activeNotebook, setActiveNotebook] = useState<string>('nb1');
  const [activePage, setActivePage] = useState<string>('p1');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const notebook = notebooks.find(n => n.id === activeNotebook);
  const page = notebook?.pages.find(p => p.id === activePage);

  const addNotebook = () => {
    const id = generateId();
    const pageId = generateId();
    setNotebooks(prev => [...prev, { id, name: 'Novo Caderno', pages: [{ id: pageId, title: 'Página 1', content: '' }] }]);
    setActiveNotebook(id);
    setActivePage(pageId);
  };

  const deleteNotebook = (id: string) => {
    if (notebooks.length <= 1) return;
    const remaining = notebooks.filter(n => n.id !== id);
    setNotebooks(remaining);
    if (activeNotebook === id) {
      setActiveNotebook(remaining[0].id);
      setActivePage(remaining[0].pages[0]?.id || '');
    }
  };

  const startRename = (id: string, currentName: string) => {
    setEditingName(id);
    setEditName(currentName);
  };

  const confirmRename = (id: string) => {
    setNotebooks(prev => prev.map(n => n.id === id ? { ...n, name: editName || n.name } : n));
    setEditingName(null);
  };

  const addPage = () => {
    if (!notebook) return;
    const pageId = generateId();
    setNotebooks(prev => prev.map(n =>
      n.id === activeNotebook
        ? { ...n, pages: [...n.pages, { id: pageId, title: `Página ${n.pages.length + 1}`, content: '' }] }
        : n
    ));
    setActivePage(pageId);
  };

  const deletePage = (pageId: string) => {
    if (!notebook || notebook.pages.length <= 1) return;
    setNotebooks(prev => prev.map(n =>
      n.id === activeNotebook
        ? { ...n, pages: n.pages.filter(p => p.id !== pageId) }
        : n
    ));
    if (activePage === pageId) {
      const remaining = notebook.pages.filter(p => p.id !== pageId);
      setActivePage(remaining[0]?.id || '');
    }
  };

  const updatePageContent = (content: string) => {
    setNotebooks(prev => prev.map(n =>
      n.id === activeNotebook
        ? { ...n, pages: n.pages.map(p => p.id === activePage ? { ...p, content } : p) }
        : n
    ));
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Notebooks list */}
      <div className="w-56 shrink-0 glass-card flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Notebook className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Cadernos</span>
          </div>
          <button onClick={addNotebook} className="p-1 rounded hover:bg-secondary transition-colors" title="Novo caderno">
            <Plus className="h-3.5 w-3.5 text-primary" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {notebooks.map(n => (
            <div
              key={n.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors group",
                activeNotebook === n.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              )}
              onClick={() => { setActiveNotebook(n.id); setActivePage(n.pages[0]?.id || ''); }}
            >
              {editingName === n.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 bg-transparent border-b border-primary text-sm text-foreground outline-none"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && confirmRename(n.id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <button onClick={e => { e.stopPropagation(); confirmRename(n.id); }}><Check className="h-3 w-3 text-success" /></button>
                  <button onClick={e => { e.stopPropagation(); setEditingName(null); }}><X className="h-3 w-3 text-destructive" /></button>
                </div>
              ) : (
                <>
                  <Notebook className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">{n.name}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button onClick={e => { e.stopPropagation(); startRename(n.id, n.name); }}>
                      <Edit3 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                    {notebooks.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); deleteNotebook(n.id); }}>
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pages list */}
      {notebook && (
        <div className="w-44 shrink-0 glass-card flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Páginas</span>
            <button onClick={addPage} className="p-1 rounded hover:bg-secondary transition-colors" title="Nova página">
              <Plus className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {notebook.pages.map(p => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors group",
                  activePage === p.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setActivePage(p.id)}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{p.title}</span>
                {notebook.pages.length > 1 && (
                  <button
                    className="hidden group-hover:block"
                    onClick={e => { e.stopPropagation(); deletePage(p.id); }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 glass-card flex flex-col">
        <div className="px-5 py-3 border-b border-border">
          <input
            value={page?.title || ''}
            onChange={e => {
              setNotebooks(prev => prev.map(n =>
                n.id === activeNotebook
                  ? { ...n, pages: n.pages.map(p => p.id === activePage ? { ...p, title: e.target.value } : p) }
                  : n
              ));
            }}
            className="bg-transparent text-sm font-semibold text-foreground outline-none w-full"
            placeholder="Título da página"
          />
        </div>
        <textarea
          value={page?.content || ''}
          onChange={e => updatePageContent(e.target.value)}
          placeholder="Escreva suas anotações aqui..."
          className="flex-1 bg-transparent p-5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none font-mono leading-relaxed"
        />
      </div>
    </div>
  );
}
