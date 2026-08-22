import { useState } from 'react';
import { Orb } from '../orb/Orb';
import { ChatPanel } from '../chat/ChatPanel';
import type { OrbState } from '../../engine/types';
import { motion, AnimatePresence } from 'framer-motion';

interface UltronViewProps {
  state: OrbState;
  onStateChange: (state: OrbState) => void;
  onRegisterSendHandler?: (handler: (text: string, isVoiceMode?: boolean) => void) => void;
}

export function UltronView({ state, onStateChange, onRegisterSendHandler }: UltronViewProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getStatusSubtitle = () => {
    switch (state) {
      case 'listening':
        return {
          title: 'Estou ouvindo, Lucas.',
          sub: 'Em que posso te ajudar agora?',
        };
      case 'thinking':
        return {
          title: 'Processando raciocínio...',
          sub: 'Analisando dados e memória',
        };
      case 'speaking':
        return {
          title: 'L.U.C.I. respondendo',
          sub: 'Sintetizando resposta',
        };
      default:
        return {
          title: 'Aguardando você chamar ("Ei, Luci")',
          sub: 'Sistema Cognitivo em Standby',
        };
    }
  };

  const statusSubtitle = getStatusSubtitle();

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-[#070B19]">
      {/* Central 3D Holographic Canvas */}
      <section className="layout__orb flex-1 relative flex items-center justify-center">
        <Orb state={state} />

        {/* Minimalist Subtitle */}
        <div className="orb-status-subtitle">
          <h2 className="orb-status-subtitle__title">{statusSubtitle.title}</h2>
          <p className="orb-status-subtitle__sub">{statusSubtitle.sub}</p>
        </div>

        {/* Floating Bottom-Right Chat Toggle Button (FAB) */}
        <button
          onClick={() => setIsChatOpen((prev) => !prev)}
          className="floating-chat-fab"
          title={isChatOpen ? 'Minimizar Chat' : 'Abrir Assistente de Texto'}
        >
          {isChatOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </section>

      {/* Floating Bottom-Right Assistant Chat Card */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="floating-chat-card"
          >
            <ChatPanel
              state={state}
              onStateChange={onStateChange}
              onRegisterSendHandler={onRegisterSendHandler}
              onClose={() => setIsChatOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
