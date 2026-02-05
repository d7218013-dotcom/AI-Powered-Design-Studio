
import React, { useState, useEffect } from 'react';
import { Loader2, Palette, Sparkles, CheckCircle2, Layout, Terminal } from 'lucide-react';
import { generateDesignTemplates } from '../services/gemini';
import { UIDesignStyle } from '../types';

interface DesignTemplatesProps {
  onSelectTheme: (theme: string) => void;
  selectedTheme: string;
  templates: UIDesignStyle[];
  setTemplates: (templates: UIDesignStyle[]) => void;
  hasGenerated: boolean;
  onError?: (error: any) => void;
}

export const DesignTemplates: React.FC<DesignTemplatesProps> = ({ 
  onSelectTheme, 
  selectedTheme, 
  templates, 
  setTemplates, 
  hasGenerated,
  onError
}) => {
  const [prefs, setPrefs] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const results = await generateDesignTemplates(prefs);
      setTemplates(results);
    } catch (e: any) {
      console.error(e);
      if (onError) onError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (templates.length > 0) {
      templates.forEach((tpl) => {
        if (tpl?.typography?.googleFontUrl && !document.getElementById(`font-${tpl.id}`)) {
          const link = document.createElement('link');
          link.id = `font-${tpl.id}`;
          link.rel = 'stylesheet';
          link.href = tpl.typography.googleFontUrl;
          document.head.appendChild(link);
        }
      });
    }
  }, [templates]);

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">デザインテンプレート</h1>
          <p className="text-gray-400 text-lg">AIがフォントとテキストで10通りのビジュアルを提案します。</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#111] p-1 rounded-2xl border border-white/5 w-full md:w-auto shadow-2xl">
          <input
            type="text"
            placeholder="好きなカラーやデザインの指定を入力..."
            value={prefs}
            onChange={(e) => setPrefs(e.target.value)}
            className="bg-transparent px-4 py-2 outline-none text-sm w-full md:w-80"
          />
          <button 
            onClick={fetchTemplates}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {hasGenerated ? "再生成する" : "テンプレートを生成"}
          </button>
        </div>
      </div>

      {loading && templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 size={48} className="text-amber-600 animate-spin mb-4" />
          <p className="text-gray-500 animate-pulse">スタイルを構築中...</p>
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {templates.map((tpl) => (
            <div 
              key={tpl.id}
              onClick={() => onSelectTheme(tpl.name)}
              className={`group relative bg-[#111] rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/5 ${
                selectedTheme === tpl.name ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div 
                className="h-56 relative overflow-hidden flex flex-col p-6 gap-4 rounded-t-3xl"
                style={{ 
                  backgroundColor: tpl?.colors?.background || '#000',
                  fontFamily: tpl?.typography?.fontFamily || 'sans-serif' 
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md" style={{ backgroundColor: tpl?.colors?.primary || '#fff' }} />
                    <span className="text-[10px] font-bold" style={{ color: tpl?.colors?.text || '#fff' }}>BrandUI</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <h2 
                    className="text-xl leading-tight" 
                    style={{ 
                      color: tpl?.colors?.text || '#fff', 
                      fontWeight: tpl?.typography?.headingWeight || 'bold',
                    }}
                  >
                    {tpl?.sampleContent?.title || 'Untitled Style'}
                  </h2>
                </div>

                <div className="mt-auto flex gap-3 items-end">
                  <button 
                    className="px-4 py-2 text-[10px] font-bold shadow-sm"
                    style={{ 
                      backgroundColor: tpl?.colors?.primary || '#4f46e5',
                      color: '#fff',
                      borderRadius: tpl?.uiTraits?.borderRadius || '8px',
                    }}
                  >
                    {tpl?.sampleContent?.buttonLabel || 'Select'}
                  </button>
                </div>
              </div>

              <div className="p-5 border-t border-white/5 bg-[#141414] rounded-b-3xl flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-gray-100">{tpl.name}</h3>
                  {selectedTheme === tpl.name && <CheckCircle2 size={18} className="text-amber-400" />}
                </div>
                
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{tpl.description}</p>
                
                {tpl.prompt && (
                  <div className="bg-black/50 border border-white/5 rounded-xl p-3 relative group/prompt">
                    <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                      <Terminal size={10} className="text-amber-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">AI DNA Prompt</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono italic leading-normal line-clamp-3">
                      "{tpl.prompt}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 mt-auto">
                  <div className="flex gap-2">
                    {tpl?.colors && Object.entries(tpl.colors).slice(0, 4).map(([key, c], i) => (
                      <div key={i} className="h-4 w-4 rounded-full border border-black/20" style={{ backgroundColor: c as string }} />
                    ))}
                  </div>
                  <span className="text-[9px] text-amber-500 font-mono font-bold tracking-tight">{tpl?.typography?.fontFamily}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
