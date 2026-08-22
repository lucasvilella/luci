/**
 * InterfaceSelector — Top Header Tab Bar for Switching Repository Theme Interfaces
 */

export type ActiveInterface = 'ultron' | 'friday' | 'jarvis' | 'leon' | 'openjarvis';

interface InterfaceSelectorProps {
  active: ActiveInterface;
  onChange: (view: ActiveInterface) => void;
}

export function InterfaceSelector({ active, onChange }: InterfaceSelectorProps) {
  const tabs: { id: ActiveInterface; label: string; icon: string; tag: string }[] = [
    { id: 'ultron', label: 'Ultron 3D Orb', icon: '🔮', tag: 'Three.js & Gestos' },
    { id: 'friday', label: 'Friday HUD', icon: '💎', tag: 'Tony Stark Glass' },
    { id: 'jarvis', label: 'Jarvis Desktop', icon: '🤖', tag: 'Minimalist AI' },
    { id: 'leon', label: 'Leon 2.0', icon: '🦁', tag: 'Executive Operations' },
    { id: 'openjarvis', label: 'OpenJarvis', icon: '⚡', tag: 'Agentic Studio' },
  ];

  return (
    <header className="w-full bg-[#070c1e]/90 backdrop-blur-md border-b border-white/10 px-6 py-2.5 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Active Mode Badge */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 text-xs font-bold shadow-[0_0_12px_rgba(0,210,255,0.3)]">
          L
        </div>
        <span className="font-mono text-sm tracking-wider font-semibold text-white/90">
          Luci <span className="text-xs font-normal text-cyan-400/80">UI SHOWCASE</span>
        </span>
      </div>

      {/* Tabs list */}
      <nav className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/5">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-200 shadow-[0_0_15px_rgba(0,210,255,0.2)]'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5 border border-transparent'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-white/40'
                  }`}
              >
                {tab.tag}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Live System Indicator */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
        <span>BACKEND PORT 3000: ONLINE</span>
      </div>
    </header>
  );
}
