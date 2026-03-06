import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

type AnimationType = 'four' | 'six' | 'wicket' | 'fifty' | 'hundred';

interface CricketAnimationProps {
  type: AnimationType | null;
  onComplete: () => void;
}

export default function CricketAnimation({ type, onComplete }: CricketAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (type) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onComplete, 300);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  const config: Record<AnimationType, { text: string; emoji: string; color: string; bg: string }> = {
    four: { text: 'FOUR!', emoji: '🏏', color: 'text-cricket-sky', bg: 'from-cricket-sky/20 to-transparent' },
    six: { text: 'SIX!', emoji: '🚀', color: 'text-cricket-gold', bg: 'from-cricket-gold/20 to-transparent' },
    wicket: { text: 'OUT!', emoji: '🔥', color: 'text-cricket-red', bg: 'from-cricket-red/20 to-transparent' },
    fifty: { text: 'FIFTY!', emoji: '⭐', color: 'text-cricket-gold', bg: 'from-cricket-gold/20 to-transparent' },
    hundred: { text: 'CENTURY!', emoji: '💯', color: 'text-cricket-gold', bg: 'from-cricket-gold/30 to-transparent' },
  };

  if (!type) return null;
  const c = config[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-radial ${c.bg} backdrop-blur-sm`}
          onClick={() => { setShow(false); onComplete(); }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="text-7xl"
            >
              {c.emoji}
            </motion.span>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-6xl font-black tracking-wider ${c.color} drop-shadow-lg`}
              style={{ textShadow: '0 0 40px currentColor' }}
            >
              {c.text}
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
