import { Sparkles, RefreshCw } from 'lucide-react';

interface PrimaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  text: string;
  className?: string;
}

export function PrimaryButton({ onClick, disabled, loading, text, className = "" }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden group
        ${disabled 
          ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' 
          : 'bg-gradient-to-r from-white/90 to-orange-100/90 text-orange-900 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 border border-white/50'}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-white/50 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
      {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} className={!disabled ? "animate-pulse" : ""} />}
      <span className="relative">{loading ? "AI 思考中..." : text}</span>
    </button>
  );
}
