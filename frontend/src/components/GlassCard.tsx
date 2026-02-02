import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all relative overflow-hidden ${className}`}>
      {/* 卡片内部的高光装饰 */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-black/20 to-transparent opacity-50" />
      {children}
    </div>
  );
}
