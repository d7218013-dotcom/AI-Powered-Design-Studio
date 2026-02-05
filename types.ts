
export type AppView = 'templates' | 'extractor' | 'architect';

export interface UIDesignStyle {
  id: string;
  name: string;
  description: string;
  prompt: string; // デザインを再現するためのAI用プロンプト
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: string;
    googleFontUrl: string;
  };
  sampleContent: {
    title: string;
    subtitle: string;
    buttonLabel: string;
  };
  uiTraits: {
    borderRadius: string;
    borderWidth: string;
    shadow: string;
    spacing: string;
  };
}

export interface ExtractedDesign {
  colors: string[];
  typography: string;
  vibe: string;
  composition: string;
  prompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface ProjectTreeNode {
  id: string;
  name: string;
  description?: string;
  category?: 'strategy' | 'design' | 'implementation';
  children?: ProjectTreeNode[];
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface AppState {
  currentView: AppView;
  selectedTheme: string;
  extractedDesign?: ExtractedDesign;
  extractorImage: string | null;
  projectTree: ProjectTreeNode | null;
  nodePositions: Record<string, NodePosition>;
  architectMessages: ChatMessage[];
  generatedTemplates: UIDesignStyle[];
  hasGeneratedTemplates: boolean;
}
