import React from 'react';
import { motion } from 'framer-motion';

/**
 * SaraAvatar — Animated 2D Micro-Expression Avatar for Sara
 * Dynamically switches visual expressions based on response sentiment:
 * - 'happy': smiling eyes + bright warm sparkle
 * - 'empathetic': soft warm gaze + gentle tilt
 * - 'listening': receptive tilt + subtle nod
 * - 'thinking': glowing purple pulse aura
 */
export default function SaraAvatar({ emotion = 'happy', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-28 h-28 text-5xl',
  }[size] || 'w-20 h-20 text-4xl';

  const emotionVariants = {
    happy: {
      rotate: [0, 2, -2, 0],
      scale: [1, 1.03, 1],
      transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
    },
    empathetic: {
      rotate: [-3, -3, -3],
      y: [0, 2, 0],
      transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
    },
    listening: {
      y: [0, -3, 0],
      transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
    },
    thinking: {
      scale: [1, 1.06, 1],
      transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
    },
  };

  const getEmojiSymbol = () => {
    switch (emotion) {
      case 'empathetic':
        return '🌸';
      case 'listening':
        return '✨';
      case 'thinking':
        return '🔮';
      case 'happy':
      default:
        return '🌟';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Background Pulse Ring */}
      <motion.div
        animate={{
          scale: emotion === 'thinking' ? [1, 1.2, 1] : [1, 1.08, 1],
          opacity: emotion === 'thinking' ? [0.6, 0.9, 0.6] : [0.3, 0.5, 0.3],
        }}
        transition={{ repeat: Infinity, duration: emotion === 'thinking' ? 1.5 : 3 }}
        className={`absolute inset-0 rounded-full ${
          emotion === 'empathetic'
            ? 'bg-amber-200'
            : emotion === 'thinking'
            ? 'bg-purple-300'
            : 'bg-primary-light'
        } blur-md`}
      />

      {/* Main Avatar Surface */}
      <motion.div
        variants={emotionVariants}
        animate={emotion}
        className={`${sizeClasses} rounded-full bg-gradient-to-tr from-primary via-accent-lilac to-primary-light p-1 shadow-card flex items-center justify-center relative z-10 border-2 border-white/80`}
      >
        <div className="w-full h-full rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
          {/* Avatar Face Representation */}
          <span className="select-none transition-transform duration-300 transform hover:scale-110">
            {getEmojiSymbol()}
          </span>

          {/* Micro Emotion Badge Indicator */}
          <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
        </div>
      </motion.div>
    </div>
  );
}
