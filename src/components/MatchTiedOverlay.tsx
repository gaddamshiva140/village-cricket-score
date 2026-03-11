import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MatchTiedOverlayProps {
  onStartSuperOver: () => void;
}

export default function MatchTiedOverlay({ onStartSuperOver }: MatchTiedOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="text-center space-y-6 px-6"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl"
        >
          🤝
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-black text-primary"
        >
          Match Tied!
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-lg text-muted-foreground font-medium"
        >
          Both teams scored the same runs. Time for a Super Over!
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <Button
            onClick={onStartSuperOver}
            size="lg"
            className="h-14 px-8 text-lg font-black rounded-xl"
          >
            ⚡ Start Super Over
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
