
import React, { useState } from 'react';
import { Upload, Loader2, Copy, CheckCircle, Palette, MousePointer2, Type as FontIcon, Search, ArrowRight } from 'lucide-react';
import { extractDesignFromImage } from '../services/gemini';
import { ExtractedDesign } from '../types';

interface DesignExtractorProps {
  onDesignExtracted: (image: string, design: ExtractedDesign) => void;
  initialImage: string | null;
  initialResult: ExtractedDesign | undefined;
  onUseDesign: () => void;
  onError?: (error: any) => void;
}

export const DesignExtractor: React.FC<DesignExtractorProps> = ({ 
  onDesignExtracted, 
  initialImage, 
  initialResult,
  onUseDesign,
  onError
}) => {
  const [image, setImage] = useState<string | null>(initialImage);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedDesign | null>(initialResult || null);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      setLoading(true);
      try {
        const extracted = await extractDesignFromImage(base64);
        setResult(extracted);
        onDesignExtracted(base64, extracted);
      } catch (err: any) {
        console.error(err);
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyPrompt = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">デザイン抽出</h1>
        <p className="text-gray-400 text-lg">画像をアップロードして、カラー、タイポグラフィ、構成などを抽出します。</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-10">
        <div className="lg:w-1/2 flex flex-col gap-6">
          <div className={`relative h-96 lg:h-full border-2 border-dashed rounded-3xl transition-all flex items-center justify-center overflow-hidden bg-[#111] group ${
            image ? 'border-indigo-500/50' : 'border-white/10 hover:border-indigo-500/30'
          }`}>
            {image ? (
              <img src={image} className="absolute inset-0 w-full h-full object-contain" alt="Preview" />
            ) : (
              <div className="text-center p-8">
                <div className="bg-indigo-600/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-indigo-400" size={32} />
                </div>
                <p className="text-gray-300 font-medium mb-1">デザインをアップロード</p>
                <p className="text-gray-500 text-sm">PNG, JPG, WEBP (最大10MB)</p>
              </div>
            )}
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={loading}
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-white font-medium">デザインDNAを抽出中...</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-1/2 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
              <button 
                onClick={onUseDesign}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
              >
                <ArrowRight size={20} />
                このデザインを構築に使用する
              </button>

              <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Palette size={14} /> カラーパレット
                </h3>
                <div className="flex flex-wrap gap-3">
                  {result.colors.map((color, idx) => (
                    <div key={idx} className="group flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-xl shadow-lg border border-white/10" style={{ backgroundColor: color }} />
                      <span className="text-[10px] text-gray-500 font-mono uppercase">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FontIcon size={14} /> タイポグラフィ
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{result.typography}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MousePointer2 size={14} /> 構図・レイアウト
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{result.composition}</p>
                </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={80} className="text-indigo-500" />
                </div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} /> AI生成プロンプト
                  </h3>
                  <button 
                    onClick={copyPrompt}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-indigo-300"
                    title="プロンプトをコピー"
                  >
                    {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-gray-300 text-sm italic leading-relaxed relative z-10">
                  "{result.prompt}"
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-white/5 bg-[#111] rounded-3xl p-10 text-center">
              <div className="bg-white/5 p-6 rounded-full mb-6">
                <Search size={40} className="text-gray-600" />
              </div>
              <h3 className="text-gray-400 font-medium text-lg mb-2">解析準備完了</h3>
              <p className="text-gray-500 max-w-xs text-sm">スクリーンショットをアップロードして、デザインの解析を開始してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Sparkles: React.FC<any> = ({ className, size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
