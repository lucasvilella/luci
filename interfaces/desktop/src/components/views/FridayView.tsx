/**
 * FridayView — Tony Stark Futuristic Glass HUD Interface
 * Inspired by Friday / Iron Man Mark L HUD design.
 */

import { motion } from 'framer-motion';
import type { OrbState } from '../../engine/types';
import { ChatPanel } from '../chat/ChatPanel';

interface FridayViewProps {
  state: OrbState;
  onStateChange: (state: OrbState) => void;
  onRegisterSendHandler?: (handler: (text: string, isVoiceMode?: boolean) => void) => void;
}

export function FridayView({ state, onStateChange, onRegisterSendHandler }: FridayViewProps) {
  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-[#050B18]">
      {/* Background Cyber Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff08_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Main HUD Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        {/* Floating System Diagnostic Widgets (Left Side HUD) */}
        <div className="absolute left-8 top-12 flex flex-col gap-4 w-64 pointer-events-none">
          <div className="bg-[#00d2ff]/5 border border-[#00d2ff]/20 rounded-xl p-4 backdrop-blur-md">
            <div className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-1">STARK TECH MARK L</div>
            <div className="text-sm font-semibold text-white">F.R.I.D.A.Y. CORE</div>
            <div className="mt-3 flex items-center justify-between text-xs text-white/60 font-mono">
              <span>SYSTEM DIAGNOSTIC</span>
              <span className="text-cyan-400">99.8%</span>
            </div>
            <div className="w-full bg-cyan-950 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-cyan-400 h-full w-[99.8%] shadow-[0_0_8px_#00d2ff]" />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-widest uppercase mb-2">TELEMETRY DATA</div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-white/70">
                <span>SUIT INTEGRITY</span>
                <span className="text-emerald-400">NOMINAL</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>NEURAL BUS</span>
                <span className="text-cyan-400">12.4 TFLOPS</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>LATENCY</span>
                <span className="text-cyan-400">1.3ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Central Arc Reactor Visualizer */}
        <div className="relative flex items-center justify-center w-[400px] h-[400px]">
          {/* Rotating Outer Telemetry Ring 1 */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />

          {/* Rotating Outer Telemetry Ring 2 */}
          <motion.div
            className="absolute inset-4 rounded-full border border-cyan-400/20 border-t-cyan-400 border-b-cyan-400"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />

          {/* Pulsing Arc Reactor Core */}
          <motion.div
            className="w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-600 via-cyan-400 to-white flex items-center justify-center shadow-[0_0_80px_rgba(0,210,255,0.6)] relative cursor-pointer"
            animate={{
              scale: state === 'listening' || state === 'speaking' ? [1, 1.08, 1] : 1,
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Triangular Core Segments */}
            <div className="w-36 h-36 rounded-full bg-[#050B18] border-4 border-cyan-300 flex items-center justify-center relative overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-cyan-400/20 animate-ping absolute" />
              <div className="text-cyan-300 font-mono text-center text-xs font-bold tracking-wider z-10">
                F.R.I.D.A.Y.
                <div className="text-[9px] font-normal text-white/70 tracking-normal mt-0.5">{state.toUpperCase()}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Audio Waveform Bars (Bottom HUD) */}
        <div className="mt-8 flex items-center gap-1.5 h-12">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00d2ff]"
              animate={{
                height: state === 'speaking' || state === 'listening' ? [12, Math.random() * 40 + 12, 12] : 12,
              }}
              transition={{
                duration: 0.3 + (i % 5) * 0.1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Subtitle */}
        <div className="mt-4 text-center">
          <h2 className="text-sm font-mono text-cyan-200 tracking-wide">
            {state === 'listening' && 'F.R.I.D.A.Y. está ouvindo seu comando de voz...'}
            {state === 'thinking' && 'Analisando telemetria e calculando resposta...'}
            {state === 'speaking' && 'F.R.I.D.A.Y. transmitindo áudio...'}
            {state === 'idle' && 'Aguardando palavra de ativação ("Ei, Luci" / "Friday")'}
          </h2>
        </div>
      </div>

      {/* Glass Chat Panel */}
      <div className="layout__chat shrink-0">
        <ChatPanel state={state} onStateChange={onStateChange} onRegisterSendHandler={onRegisterSendHandler} />
      </div>
    </div>
  );
}
