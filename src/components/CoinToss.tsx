import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CoinTossProps {
  teamAName: string;
  teamBName: string;
  onTossComplete: (tossWinner: 'A' | 'B', tossCall: 'heads' | 'tails', battingFirst: 'A' | 'B') => void;
}

export default function CoinToss({ teamAName, teamBName, onTossComplete }: CoinTossProps) {
  const [step, setStep] = useState<'call' | 'flipping' | 'result' | 'decision'>('call');
  const [caller, setCaller] = useState<'A' | 'B'>('A');
  const [call, setCall] = useState<'heads' | 'tails'>('heads');
  const [result, setResult] = useState<'heads' | 'tails'>('heads');
  const [winner, setWinner] = useState<'A' | 'B'>('A');

  const handleFlip = () => {
    setStep('flipping');
    const flipResult: 'heads' | 'tails' = Math.random() > 0.5 ? 'heads' : 'tails';
    setResult(flipResult);
    const tossWinner = flipResult === call ? caller : (caller === 'A' ? 'B' : 'A');
    setWinner(tossWinner);
    setTimeout(() => setStep('result'), 2000);
  };

  const handleDecision = (choice: 'bat' | 'bowl') => {
    const battingFirst = choice === 'bat' ? winner : (winner === 'A' ? 'B' : 'A');
    onTossComplete(winner, call, battingFirst);
  };

  return (
    <div className="space-y-6 text-center">
      <AnimatePresence mode="wait">
        {step === 'call' && (
          <motion.div key="call" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <h3 className="text-lg font-bold">Who calls the toss?</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B'] as const).map(t => (
                <Button key={t} variant={caller === t ? 'default' : 'outline'} className="h-14 font-bold rounded-xl" onClick={() => setCaller(t)}>
                  {t === 'A' ? teamAName : teamBName}
                </Button>
              ))}
            </div>
            <h3 className="text-lg font-bold mt-4">Call:</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant={call === 'heads' ? 'default' : 'outline'} className="h-14 font-bold rounded-xl text-lg" onClick={() => setCall('heads')}>
                👑 Heads
              </Button>
              <Button variant={call === 'tails' ? 'default' : 'outline'} className="h-14 font-bold rounded-xl text-lg" onClick={() => setCall('tails')}>
                🦅 Tails
              </Button>
            </div>
            <Button onClick={handleFlip} className="w-full h-14 text-lg font-black rounded-xl mt-4" size="lg">
              🪙 Flip Coin
            </Button>
          </motion.div>
        )}

        {step === 'flipping' && (
          <motion.div key="flipping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
            <motion.div
              className="text-8xl mx-auto w-fit"
              animate={{ rotateY: [0, 1800] }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              🪙
            </motion.div>
            <p className="mt-4 text-muted-foreground animate-pulse font-bold">Flipping...</p>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="text-6xl">{result === 'heads' ? '👑' : '🦅'}</div>
            <p className="text-2xl font-black uppercase">{result}!</p>
            <p className="text-muted-foreground">
              {caller === 'A' ? teamAName : teamBName} called <span className="font-bold">{call}</span>
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-primary/10 border-2 border-primary/30 p-4"
            >
              <p className="text-lg font-black text-primary">
                🏆 {winner === 'A' ? teamAName : teamBName} won the toss!
              </p>
            </motion.div>
            <Button onClick={() => setStep('decision')} className="w-full h-12 font-bold rounded-xl" size="lg">
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'decision' && (
          <motion.div key="decision" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-lg font-bold">
              {winner === 'A' ? teamAName : teamBName} elected to...
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-20 text-lg font-black rounded-xl flex-col gap-1" onClick={() => handleDecision('bat')}>
                🏏 Bat First
              </Button>
              <Button variant="outline" className="h-20 text-lg font-black rounded-xl flex-col gap-1" onClick={() => handleDecision('bowl')}>
                ⚾ Bowl First
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
