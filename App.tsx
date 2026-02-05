
import React, { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { DesignTemplates } from './components/DesignTemplates';
import { DesignExtractor } from './components/DesignExtractor';
import { ProjectArchitect } from './components/ProjectArchitect';
import { QuotaErrorBanner } from './components/QuotaErrorBanner';
import { AppView, AppState, ExtractedDesign, ProjectTreeNode, UIDesignStyle, ChatMessage, NodePosition } from './types';

const INITIAL_TEMPLATES: UIDesignStyle[] = [
  {
    id: 'tpl-1',
    name: 'ネオ・ミニマリズム',
    description: '極限まで無駄を削ぎ落としつつ、微細なグラデーションとシャドウで奥行きを表現した次世代のミニマリズム。情報の純度を高めます。',
    prompt: 'A sleek, ultra-minimalist SaaS dashboard interface with micro-shadows, subtle gradients, and sharp typography.',
    colors: { primary: '#000000', secondary: '#F8F9FA', accent: '#6366F1', background: '#FFFFFF', surface: '#FDFDFD', text: '#1A1A1A' },
    typography: { fontFamily: 'Inter', headingWeight: '800', googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap' },
    sampleContent: { title: '引き算の美学', subtitle: '洗練されたタイポグラフィが物語る、静寂なインターフェース。', buttonLabel: '詳しく見る' },
    uiTraits: { borderRadius: '12px', borderWidth: '1px', shadow: '0 4px 20px rgba(0,0,0,0.03)', spacing: '24px' }
  },
  {
    id: 'tpl-2',
    name: 'グラスモーフィズム・ダーク',
    description: '背景のブラーと透明感を活かした、未来的でプレミアムな質感。深みのあるネイビーと光の反射が美しく調和します。',
    prompt: 'A premium glassmorphism dark mode UI with translucent layers, background blur, and neon indigo highlights.',
    colors: { primary: '#4F46E5', secondary: '#1E293B', accent: '#10B981', background: '#0F172A', surface: 'rgba(30, 41, 59, 0.7)', text: '#F1F5F9' },
    typography: { fontFamily: 'JetBrains Mono', headingWeight: '500', googleFontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap' },
    sampleContent: { title: 'ベールの先へ', subtitle: '半透明のレイヤーが織りなす、深淵なるユーザー体験。', buttonLabel: '始める' },
    uiTraits: { borderRadius: '24px', borderWidth: '1px', shadow: '0 8px 32px rgba(0,0,0,0.4)', spacing: '20px' }
  },
  {
    id: 'tpl-3',
    name: 'ソフト・プレイフル',
    description: '丸みを帯びたフォルムとパステル調のカラーが親しみやすさを演出。親しみやすさと使いやすさを両立したデザインです。',
    prompt: 'A friendly and playful UI with soft rounded corners, pastel colors, and approachable typography.',
    colors: { primary: '#FF6B6B', secondary: '#FFE66D', accent: '#4ECDC4', background: '#FFFAFA', surface: '#FFFFFF', text: '#2F2F2F' },
    typography: { fontFamily: 'Noto Sans JP', headingWeight: '700', googleFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap' },
    sampleContent: { title: 'ハッピー・デザイン', subtitle: '使うたびに心が弾む、柔らかで優しいプロダクト。', buttonLabel: 'あそぶ' },
    uiTraits: { borderRadius: '40px', borderWidth: '0px', shadow: '0 10px 25px rgba(255,107,107,0.1)', spacing: '32px' }
  }
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'templates',
    selectedTheme: '',
    extractedDesign: undefined,
    extractorImage: null,
    projectTree: null,
    nodePositions: {},
    architectMessages: [],
    generatedTemplates: INITIAL_TEMPLATES,
    hasGeneratedTemplates: false,
  });

  const [quotaError, setQuotaError] = useState(false);

  const setView = (view: AppView) => setState(prev => ({ ...prev, currentView: view }));
  
  const setSelectedTheme = (theme: string) => {
    setState(prev => ({ ...prev, selectedTheme: theme }));
  };

  const setExtractedDesignData = (image: string, design: ExtractedDesign) => {
    setState(prev => ({ 
      ...prev, 
      extractorImage: image,
      extractedDesign: design, 
      selectedTheme: design.vibe 
    }));
  };

  const setProjectTree = (tree: ProjectTreeNode) => {
    setState(prev => ({ ...prev, projectTree: tree }));
  };

  const setNodePositions = (positions: Record<string, NodePosition>) => {
    setState(prev => ({ ...prev, nodePositions: { ...prev.nodePositions, ...positions } }));
  };

  const setArchitectMessages = (messages: ChatMessage[]) => {
    setState(prev => ({ ...prev, architectMessages: messages }));
  };

  const updateTemplates = (templates: UIDesignStyle[]) => {
    setState(prev => ({ ...prev, generatedTemplates: templates, hasGeneratedTemplates: true }));
  };

  const handleGlobalError = (error: any) => {
    if (error?.message === 'QUOTA_EXCEEDED') {
      setQuotaError(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] overflow-hidden text-gray-100">
      <main className="flex-1 overflow-y-auto relative bg-[#0d0d0d] pb-24">
        {quotaError && <QuotaErrorBanner onClose={() => setQuotaError(false)} />}
        
        {state.currentView === 'templates' && (
          <DesignTemplates 
            onSelectTheme={setSelectedTheme} 
            selectedTheme={state.selectedTheme}
            templates={state.generatedTemplates}
            setTemplates={updateTemplates}
            hasGenerated={state.hasGeneratedTemplates}
            onError={handleGlobalError}
          />
        )}
        {state.currentView === 'extractor' && (
          <DesignExtractor 
            onDesignExtracted={setExtractedDesignData}
            initialImage={state.extractorImage}
            initialResult={state.extractedDesign}
            onUseDesign={() => setView('architect')}
            onError={handleGlobalError}
          />
        )}
        {state.currentView === 'architect' && (
          <ProjectArchitect 
            initialTheme={state.selectedTheme}
            currentTree={state.projectTree}
            nodePositions={state.nodePositions}
            onPositionsUpdate={setNodePositions}
            messages={state.architectMessages}
            setMessages={setArchitectMessages}
            onTreeUpdate={setProjectTree}
            onError={handleGlobalError}
          />
        )}
      </main>

      <BottomNav currentView={state.currentView} setView={setView} />
    </div>
  );
};

export default App;
