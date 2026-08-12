import { motion } from 'framer-motion';

/**
 * ChatBubble — DESIGN_SYSTEM.md Section 7.2
 * User bubble: filled primary purple, white text, right-aligned.
 * AI bubble: white card, text-primary, left-aligned.
 * Animation: slide-in from sender's side, 150ms.
 *
 * Props:
 *   message  — text content
 *   role     — "user" | "assistant"
 *   animate  — whether to animate entry (default: true)
 */
export default function ChatBubble({ message, role, animate = true }) {
  const isUser = role === 'user';

  const motionProps = animate
    ? {
        initial: { opacity: 0, x: isUser ? 20 : -20, y: 5 },
        animate: { opacity: 1, x: 0, y: 0 },
        transition: { duration: 0.15, ease: 'easeOut' },
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mr-2.5 mt-1 shrink-0">
          <span className="text-[13px] font-bold text-primary-dark">S</span>
        </div>
      )}

      <div
        className={`
          max-w-[75%] px-4.5 py-3 text-[14.5px] leading-relaxed
          ${
            isUser
              ? 'bg-primary text-white rounded-[20px] rounded-br-[6px]'
              : 'bg-white text-text-primary rounded-[20px] rounded-bl-[6px] shadow-card'
          }
        `}
      >
        {/* Render markdown-like formatting for AI messages */}
        {!isUser ? (
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: message
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/• /g, '<br/>• ')
            }}
          />
        ) : (
          <p className="whitespace-pre-wrap">{message}</p>
        )}
      </div>
    </motion.div>
  );
}
