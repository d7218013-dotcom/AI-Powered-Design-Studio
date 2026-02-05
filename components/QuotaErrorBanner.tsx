
import React from 'react';
import { AlertTriangle, Key, ExternalLink, X } from 'lucide-react';

interface QuotaErrorBannerProps {
  onClose: () => void;
}

export const QuotaErrorBanner: React.FC<QuotaErrorBannerProps> = ({ onClose }) => {
  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        onClose();
        // キー選択後は自動的にリロードや再試行を促すのが一般的ですが、
        // ここではバナーを閉じるだけにとどめます。
      }
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-2xl">
      <div className="bg-[#1a0a0a] border border-red-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
        <div className="flex items-start gap-4">
          <div className="bg-red-500/20 p-3 rounded-2xl shrink-0">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">APIクォータ制限に達しました</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                無料枠の利用制限を超えたため、現在AIの呼び出しができません。
                少し待ってから再度お試しいただくか、ご自身のAPIキー（有料プロジェクト）を使用してください。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleOpenKeySelector}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
              >
                <Key size={14} /> 自分のAPIキーを使用する
              </button>
              
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 transition-all"
              >
                <ExternalLink size={14} /> 課金詳細を確認
              </a>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
