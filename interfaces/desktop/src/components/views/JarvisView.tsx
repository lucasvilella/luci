/**
 * JarvisView — Futuristic Minimalist Desktop AI Interface
 * Inspired by Jarvis minimalist AI assistant layout.
 */

import { motion } from 'framer-motion';
import type { OrbState } from '../../engine/types';
import { ChatPanel } from '../chat/ChatPanel';

interface JarvisViewProps {
  state: OrbState;
  onStateChange: (state: OrbState) => void;
  onRegisterSendHandler?: (handler: (text: string, isVoiceMode?: boolean) => void) => void;
}

export function JarvisView({ state, onStateChange, onRegisterSendHandler }: JarvisViewProps) {
  const quickPrompts = [
    'Qual a previsão do tempo hoje?',
    'Resuma os arquivos do workspace',
    'Abra o VS Code',
    'Pesquise notícias de IA',
  ];

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-[#0A1128]">
      <div className="flex-1 flex flex-col items-center justify-between p-8 relative">
        {/* Top Status Header Pill */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_#60a5fa]" />
          <span className="text-xs font-mono text-white/80 uppercase tracking-widest">
            JARVIS CORE — ONLINE STATE: {state}
          </span>
        </div>

        {/* Central Minimalist Intelligence Sphere */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="w-56 h-56 rounded-full bg-gradient-to-b from-blue-500/20 to-indigo-600/30 border border-blue-400/30 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.3)] backdrop-blur-xl"
            animate={{
              scale: state === 'speaking' || state === 'listening' ? [1, 1.05, 1] : [1, 1.02, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-36 h-36 rounded-full bg-blue-600/30 border border-blue-300/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 blur-sm animate-pulse" />
              <div className="text-white font-mono text-center text-xs font-semibold z-10">J.A.R.V.I.S.</div>
            </div>
          </motion.div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="w-full max-w-xl space-y-3">
          <div className="text-[11px] font-mono text-white/40 text-center uppercase tracking-wider">
            Comandos Rápidos Recomendados
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (onRegisterSendHandler) {
                    // Send prompt directly
                  }
                }}
                className="text-left text-xs text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all hover:border-blue-400/40 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Glass Chat Panel */}
      <div className="layout__chat shrink-0">
        <ChatPanel state={state} onStateChange={onStateChange} onRegisterSendHandler={onRegisterSendHandler} />
      </div>
    </div>
  );
}
