/**
 * Header — Minimal top bar for L.U.C.I. Desktop Interface
 *
 * Just the name and a subtle state indicator.
 * Inspired by Nothing OS / Arc Browser minimalism.
 */

import { motion } from 'framer-motion';
import type { OrbState } from '../../engine/types';

interface HeaderProps {
  state: OrbState;
}

export function Header({ state }: HeaderProps) {
  return (
    <motion.header
      className="header"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="header__brand">
        <span className="header__name">L.U.C.I.</span>
        <span className="header__subtitle">Cognitive Operating System</span>
      </div>
      <div className="header__right">
        <span className={`header__state header__state--${state}`}>
          {state === 'idle' ? 'standby' : state}
        </span>
      </div>
    </motion.header>
  );
}
