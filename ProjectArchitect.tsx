
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, GitBranch, Trash2, Sparkles, AlertCircle, Send, X, PlusCircle, Settings2, User, Bot } from 'lucide-react';
import { generateProjectTree, modifyProjectTree } from '../services/gemini';
import { ProjectTreeNode, ChatMessage, NodePosition } from '../types';
import { TreeDiagram } from './TreeDiagram';

interface ProjectArchitectProps {
  initialTheme: string;
  currentTree: ProjectTreeNode | null;
  nodePositions: Record<string, NodePosition>;
  onPositionsUpdate: (positions: Record<string, NodePosition>) => void;
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  onTreeUpdate: (tree: ProjectTreeNode) => void;
  onError?: (error: any) => void;
}

export const ProjectArchitect: React.FC<ProjectArchitectProps> = ({ 
  initialTheme, 
  currentTree, 
  nodePositions,
  onPositionsUpdate,
  messages,
  setMessages,
  onTreeUpdate,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tempNodeName, setTempNodeName] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedNodeId && currentTree) {
      const node = findNode(currentTree, selectedNodeId);
      if (node) setTempNodeName(node.name || "");
    }
  }, [selectedNodeId, currentTree]);

  const handleBuild = async () => {
    if (!formData.name.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const tree = await generateProjectTree({
        ...formData,
        features: (formData.features || []).filter(f => f?.trim()).join(", ")
      }, initialTheme);
      onTreeUpdate(tree);
      setMessages([{ id: 'init', role: 'ai', text: `「${formData.name}」の設計が完了しました。さらに要素を追加したり、構成を微調整したい場合はこちらからどうぞ。`, timestamp: Date.now() }]);
    } catch (err: any) {
      console.error(err);
      if (onError) onError(err);
      setError(err.message === 'QUOTA_EXCEEDED' ? "APIの制限に達しました。上部の警告を確認してください。" : (err.message || "エラーが発生しました。"));
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !currentTree || loading) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    
    const input = chatInput;
    setChatInput("");
    setLoading(true);

    try {
      const result = await modifyProjectTree(currentTree, input);
      if (result.tree) onTreeUpdate(result.tree);
      
      const aiMsg: ChatMessage = { 
        id: (Date.now()+1).toString(), 
        role: 'ai', 
        text: result.feedback || "承知しました。構造を最適化しました。", 
        timestamp: Date.now() 
      };
      setMessages([...newMessages, aiMsg]);
      setSelectedNodeId(null);
    } catch (err: any) {
      console.error(err);
      if (onError) onError(err);
      setError(err.message === 'QUOTA_EXCEEDED' ? "APIの制限に達しました。上部の警告を確認してください。" : "修正中に問題が発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const findNode = (node: ProjectTreeNode, id: string): ProjectTreeNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNodeNameInTree = (node: ProjectTreeNode, id: string, name: string): ProjectTreeNode => {
    if (node.id === id) return { ...node, name };
    if (node.children) {
      return { ...node, children: node.children.map(c => updateNodeNameInTree(c, id, name)) };
    }
    return node;
  };

  const handleNameBlur = () => {
    if (selectedNodeId && currentTree && tempNodeName.trim()) {
      onTreeUpdate(updateNodeNameInTree(currentTree, selectedNodeId, tempNodeName));
    }
  };

  const addNodeToData = (node: ProjectTreeNode, parentId: string): ProjectTreeNode => {
    if (node.id === parentId) {
      const newNode = { id: `item-${Date.now()}`, name: "新規要素", category: node.category };
      return { ...node, children: [...(node.children || []), newNode] };
    }
    if (node.children) {
      return { ...node, children: node.children.map(c => addNodeToData(c, parentId)) };
    }
    return node;
  };

  const deleteNodeFromData = (node: ProjectTreeNode, id: string): ProjectTreeNode | null => {
    if (node.id === id) return null;
    if (node.children) {
      const newChildren = node.children
        .map(c => deleteNodeFromData(c, id))
        .filter((c): c is ProjectTreeNode => c !== null);
      return { ...node, children: newChildren };
    }
    return node;
  };

  const [formData, setFormData] = useState({
    name: "新規プロジェクト",
    features: ["トップページ", "ダッシュボード"],
    notes: "モダンなUI/UX",
    deploy: "Vercel"
  });

  const selectedNode = currentTree && selectedNodeId ? findNode(currentTree, selectedNodeId) : null;

  return (
    <div className="flex h-full w-full bg-[#050505]">
      <div className="w-[450px] border-r border-white/5 flex flex-col bg-[#080808] z-20 shadow-xl overflow-hidden relative">
        <div className="p-8 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
              <div className="p-2 bg-cyan-600 rounded-lg shadow-lg shadow-cyan-600/20">
                <GitBranch size={20} />
              </div>
              Architect AI
            </h2>
            {currentTree && (
              <button onClick={() => { onTreeUpdate(null as any); onPositionsUpdate({}); setMessages([]); }} className="text-[10px] text-gray-600 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">Reset</button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
          {!currentTree ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest block">プロジェクト名</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-cyan-500 transition-all shadow-inner"
                />
              </div>
              <button 
                onClick={handleBuild}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                プロジェクト構築
              </button>
            </div>
          ) : selectedNode ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={14} /> Edit Element
                </h3>
                <button onClick={() => setSelectedNodeId(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest">ラベル</label>
                  <input 
                    type="text" 
                    value={tempNodeName}
                    onChange={(e) => setTempNodeName(e.target.value)}
                    onBlur={handleNameBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => onTreeUpdate(addNodeToData(currentTree, selectedNode.id))}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5 transition-all"
                  >
                    <PlusCircle size={16} /> 追加
                  </button>
                  {selectedNode.id !== currentTree.id && (
                    <button 
                      onClick={() => {
                        const nextTree = deleteNodeFromData(currentTree, selectedNode.id);
                        if (nextTree) onTreeUpdate(nextTree);
                        setSelectedNodeId(null);
                      }}
                      className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-cyan-600 shadow-lg shadow-cyan-600/30' : 'bg-white/5 border border-white/10'}`}>
                    {m.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-cyan-400" />}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] shadow-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-white/[0.03] text-gray-300 border border-white/5 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && messages.length > 0 && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
                    <Bot size={14} className="text-cyan-400 animate-pulse" />
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
          {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-400 text-[11px] font-bold"><AlertCircle size={16} />{error}</div>}
        </div>

        {currentTree && !selectedNodeId && (
          <div className="p-6 border-t border-white/5 bg-[#080808]/90 backdrop-blur-xl absolute bottom-0 left-0 right-0">
            <div className="bg-black border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl focus-within:border-cyan-500/50 transition-all">
              <input 
                type="text" 
                placeholder="アーキテクチャへの指示を送信..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                className="flex-1 bg-transparent px-4 py-3 text-xs text-white outline-none"
              />
              <button 
                onClick={handleChat}
                disabled={!chatInput.trim() || loading}
                className="bg-cyan-600 p-3 rounded-xl text-white disabled:opacity-20 transition-all hover:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-600/30"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden bg-black">
        {loading && !messages.length && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl z-50">
            <div className="relative mb-8">
              <Loader2 className="text-cyan-500 animate-spin" size={64} />
              <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full" />
            </div>
            <p className="text-white text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Forging System Architecture</p>
          </div>
        )}
        {currentTree ? (
          <TreeDiagram data={currentTree} nodePositions={nodePositions} onPositionsUpdate={onPositionsUpdate} selectedNodeId={selectedNodeId || undefined} onSelectNode={(node) => setSelectedNodeId(node.id)} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="relative group">
               <div className="absolute inset-0 bg-cyan-600/5 blur-[120px] rounded-full group-hover:bg-cyan-600/10 transition-all duration-1000" />
               <GitBranch size={160} className="text-white/5 transition-all group-hover:text-white/10" />
            </div>
            <p className="text-white/10 font-black uppercase tracking-[1em] text-xs mt-8">Waiting for Build Instruction</p>
          </div>
        )}
      </div>
    </div>
  );
};
