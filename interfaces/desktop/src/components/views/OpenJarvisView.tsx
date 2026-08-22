/**
 * OpenJarvisView — Multi-Agent Studio Interface
 * Inspired by OpenJarvis workflow execution & multi-agent system.
 */

import { useState } from 'react';
import type { OrbState } from '../../engine/types';
import { ChatPanel } from '../chat/ChatPanel';

interface OpenJarvisViewProps {
  state: OrbState;
  onStateChange: (state: OrbState) => void;
  onRegisterSendHandler?: (handler: (text: string, isVoiceMode?: boolean) => void) => void;
}

export function OpenJarvisView({ state, onStateChange, onRegisterSendHandler }: OpenJarvisViewProps) {
  const [agents] = useState([
    { name: 'Orchestrator Agent', role: 'Planner', status: 'Running', avatar: '🧠' },
    { name: 'Web Perception Agent', role: 'Search & Fetch', status: 'Idle', avatar: '🌐' },
    { name: 'System Tool Agent', role: 'Desktop Launcher', status: 'Idle', avatar: '💻' },
    { name: 'Memory Graph Agent', role: 'Fact Extraction', status: 'Active', avatar: '📚' },
  ]);

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-[#060D1A]">
      {/* Studio WorkArea */}
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-mono font-bold text-white flex items-center gap-2">
              <span>⚡</span> OpenJarvis Agentic Workflow Studio
            </h1>
            <p className="text-xs text-white/50 font-mono mt-1">Multi-Agent Execution Pipeline & Tool Router</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full font-mono text-xs">
              AGENT COUNT: 4
            </span>
          </div>
        </div>

        {/* Multi-Agent Cards Grid */}
        <div className="grid grid-cols-4 gap-4">
          {agents.map((agent, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{agent.avatar}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    agent.status === 'Running' || agent.status === 'Active'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white font-mono">{agent.name}</div>
                <div className="text-xs text-white/50 font-mono">{agent.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Agentic Trace Flow Timeline */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-mono font-bold text-white">Live Execution Trace</h2>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-start gap-3 border-l-2 border-purple-500 pl-4 py-1">
              <div className="text-purple-400 font-bold">15:30:12</div>
              <div>
                <div className="text-white font-semibold">User Intent Received: &quot;Olá, quem é você?&quot;</div>
                <div className="text-white/40">Routed to IntentClassifier (SmolLM2 fast path)</div>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-cyan-500 pl-4 py-1">
              <div className="text-cyan-400 font-bold">15:30:13</div>
              <div>
                <div className="text-white font-semibold">Cloud Reasoning Triggered</div>
                <div className="text-white/40">Provider: Groq Llama 3.3 70B (Fallback: Gemini Provider)</div>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-emerald-500 pl-4 py-1">
              <div className="text-emerald-400 font-bold">15:30:14</div>
              <div>
                <div className="text-white font-semibold">Speech Stream Active &amp; Memory Synced</div>
                <div className="text-white/40">4-Layer Graph Memory Updated for user &apos;Lucas&apos;</div>
              </div>
            </div>
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
