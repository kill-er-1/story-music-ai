import React from 'react';
import { motion } from 'framer-motion';

interface InkTransitionProps {
  isActive: boolean;
  onComplete: () => void;
}

export function InkTransition({ isActive, onComplete }: InkTransitionProps) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* SVG Filter: 减少 baseFrequency 和 scale，让边缘更柔和，像宣纸上的墨迹，而不是破碎的波纹。 */}
      <svg className="absolute w-0 h-0">
        <filter id="watercolor-paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
          <feGaussianBlur stdDeviation="1" /> 
        </filter>
      </svg>

      {/* 第一层：暖橙色晕染 (Warmth) */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 5, opacity: 0 }}
        transition={{ duration: 2.8, ease: [0.25, 1, 0.5, 1] }}
        className="absolute w-[80vmax] h-[80vmax] rounded-full bg-orange-400 mix-blend-multiply"
        style={{ filter: 'url(#watercolor-paper)' }}
      />

      {/* 第二层：深青色晕染 (Coolness) */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4.5, opacity: 0 }}
        transition={{ duration: 3.2, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="absolute w-[70vmax] h-[70vmax] rounded-full bg-teal-600 mix-blend-multiply"
        style={{ filter: 'url(#watercolor-paper)' }}
      />
      
      {/* 第三层：画布重置 (Paper) */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 5, opacity: 0 }}
        transition={{ duration: 3.5, delay: 0.4, ease: "easeOut" }}
        className="absolute w-[60vmax] h-[60vmax] rounded-full bg-[#FFFBF0] mix-blend-normal"
        style={{ filter: 'url(#watercolor-paper)' }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}
