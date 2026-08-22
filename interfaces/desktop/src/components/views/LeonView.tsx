/**
 * LeonView — Executive Operations Hub Interface
 * Inspired by Leon 2.0 execution dashboard & skill modules architecture.
 */

import { useState } from 'react';
import type { OrbState } from '../../engine/types';
import { ChatPanel } from '../chat/ChatPanel';

interface LeonViewProps {
  state: OrbState;
  onStateChange: (state: OrbState) => void;
  onRegisterSendHandler?: (handler: (text: string, isVoiceMode?: boolean) => void) => void;
}

export function LeonView({ state, onStateChange, onRegisterSendHandler }: LeonViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'terminal'>('overview');

  const skills = [
    { name: 'System Launcher', status: 'Active', category: 'Desktop', icon: '🚀' },
    { name: 'Tavily Web Search', status: 'Active', category: 'Web Perception', icon: '🌐' },
    { name: 'Graph Memory Manager', status: 'Active', category: 'Memory & Context', icon: '🧠' },
    { name: 'Mode Engine (Leon 2.0)', status: 'Active', category: 'Routing', icon: '⚙️' },
    { name: 'Voice Pipeline Manager', status: 'Active', category: 'Speech Processing', icon: '🎙️' },
    { name: 'Sensitive Data Redactor', status: 'Active', category: 'Privacy & Security', icon: '🛡️' },
  ];

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-[#0D1322]">
      {/* Left Operations Sidebar */}
      <div className="w-64 border-r border-white/10 bg-white/[0.02] p-4 flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold text-sm">
            L
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono">LEON 2.0 ENGINE</div>
            <div className="text-[10px] text-white/50">OPERATIONS HUB</div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="space-y-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span>📊</span> Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all ${
              activeTab === 'skills'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span>🧩</span> Active Skills (6)
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all ${
              activeTab === 'terminal'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span>💻</span> Execution Terminal
          </button>
        </nav>

        {/* System Health Widget */}
        <div className="mt-auto bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
          <div className="text-[10px] font-mono text-white/40 uppercase">System Hardware Health</div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-white/70">
              <span>CPU LOAD</span>
              <span className="text-emerald-400">14%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[14%]" />
            </div>
            <div className="flex justify-between text-white/70">
              <span>RAM ALLOCATED</span>
              <span className="text-amber-400">42%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[42%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Center Main Dashboard Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-mono font-bold text-white">System Operations & Executions</h1>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono text-xs">
                MODE: SMART ROUTER
              </span>
            </div>

            {/* Grid of Status Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <div className="text-[11px] font-mono text-white/50">TOTAL INTENTIONS ROUTED</div>
                <div className="text-2xl font-mono font-bold text-white">1,428</div>
                <div className="text-[10px] text-emerald-400 font-mono">99.4% Latency &lt; 50ms</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <div className="text-[11px] font-mono text-white/50">MEMORY FACTS PERSISTED</div>
                <div className="text-2xl font-mono font-bold text-amber-400">312</div>
                <div className="text-[10px] text-white/40 font-mono">Sensors & Privacy Active</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <div className="text-[11px] font-mono text-white/50">ACTIVE MCP SKILLS</div>
                <div className="text-2xl font-mono font-bold text-cyan-400">6</div>
                <div className="text-[10px] text-cyan-400/80 font-mono">Auto-discovered</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            <h1 className="text-lg font-mono font-bold text-white">Registered Skill Modules</h1>
            <div className="grid grid-cols-2 gap-4">
              {skills.map((skill, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white font-mono">{skill.name}</div>
                      <div className="text-xs text-white/50">{skill.category}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    {skill.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="space-y-3 font-mono">
            <h1 className="text-lg font-bold text-white">Execution Console Stream</h1>
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono space-y-2 h-96 overflow-y-auto text-green-400">
              <div>[Leon Engine] Initializing core modules...</div>
              <div>[ModeEngine] Active mode set to SMART</div>
              <div>[SmartToolRouter] Indexing 6 tool embeddings into semantic space...</div>
              <div>[MemoryManager] Graph loaded 312 facts for user &apos;Lucas&apos;</div>
              <div className="text-white/60">[Router] Ready and waiting for user query input...</div>
            </div>
          </div>
        )}
      </div>

      {/* Glass Chat Panel */}
      <div className="layout__chat shrink-0">
        <ChatPanel state={state} onStateChange={onStateChange} onRegisterSendHandler={onRegisterSendHandler} />
      </div>
    </div>
  );
}
