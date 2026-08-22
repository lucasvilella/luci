/**
 * ChatMessage — Single message in the Luci chat panel
 *
 * Minimalist, no speech bubbles, no avatars.
 * Inspired by: Apple Intelligence, Linear, Arc Browser.
 */

import { motion } from 'framer-motion';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <p className="chat-message__text">{message.content}</p>
    </motion.div>
  );
}
