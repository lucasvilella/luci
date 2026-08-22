import { useCallback, useRef } from 'react';
import { useOrbState } from '../../hooks/useOrbState';
import { useVoiceCapture } from '../../hooks/useVoiceCapture';
import { UltronView } from '../views/UltronView';

export function Layout() {
  const { state, transition } = useOrbState();
  const sendHandlerRef = useRef<((text: string, isVoiceMode?: boolean) => void) | null>(null);

  const handleRegisterSendHandler = useCallback((handler: (text: string, isVoiceMode?: boolean) => void) => {
    sendHandlerRef.current = handler;
  }, []);

  const handleSendVoiceMessage = useCallback((text: string, isVoiceMode = true) => {
    if (sendHandlerRef.current) {
      sendHandlerRef.current(text, isVoiceMode);
    }
  }, []);

  const { isSupported: _isSupported } = useVoiceCapture({
    state,
    onStateChange: transition,
    onSendTextMessage: handleSendVoiceMessage,
  });

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#0A1128]">
      <main className="flex-1 flex w-full h-full relative overflow-hidden">
        <UltronView
          state={state}
          onStateChange={transition}
          onRegisterSendHandler={handleRegisterSendHandler}
        />
      </main>
    </div>
  );
}
