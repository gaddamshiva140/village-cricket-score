import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';
import { Match } from '@/types/cricket';
import { saveMatch } from '@/lib/matchStore';

interface PlayerOfTheMatchProps {
  match: Match;
  onComplete: (match: Match) => void;
}

interface PlayerStat {
  playerId: string;
  name: string;
  team: string;
  runs: number;
  balls: number;
  wickets: number;
  catches?: number;
}

export default function PlayerOfTheMatch({ match, onComplete }: PlayerOfTheMatchProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Gather all players with their combined stats from both innings
  const players: PlayerStat[] = [];

  match.innings.forEach((innings, inningsIdx) => {
    // Batsmen from this innings
    innings.battingOrder
      .filter(b => b.balls > 0 || b.isOut)
      .forEach(b => {
        const existing = players.find(p => p.playerId === b.playerId);
        if (existing) {
          existing.runs += b.runs;
          existing.balls += b.balls;
        } else {
          players.push({
            playerId: b.playerId,
            name: b.playerName,
            team: innings.teamName,
            runs: b.runs,
            balls: b.balls,
            wickets: 0,
          });
        }
      });

    // Bowlers from this innings
    innings.bowlingFigures
      .filter(b => b.overs > 0 || b.balls > 0)
      .forEach(b => {
        const existing = players.find(p => p.playerId === b.playerId);
        if (existing) {
          existing.wickets += b.wickets;
        } else {
          players.push({
            playerId: b.playerId,
            name: b.playerName,
            team: innings.teamName,
            runs: 0,
            balls: 0,
            wickets: b.wickets,
          });
        }
      });
  });

  // Sort by impact: runs + wickets*25
  players.sort((a, b) => (b.runs + b.wickets * 25) - (a.runs + a.wickets * 25));

  const handleSelect = () => {
    if (!selected) return;
    const player = players.find(p => p.playerId === selected);
    if (!player) return;

    match.playerOfTheMatch = selected;
    match.playerOfTheMatchName = player.name;
    saveMatch(match);
    setShowCelebration(true);

    setTimeout(() => {
      onComplete(match);
    }, 3000);
  };

  if (showCelebration) {
    const player = players.find(p => p.playerId === selected);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      >
        {/* Confetti particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: -20, opacity: 1 }}
            animate={{
              y: window.innerHeight + 20,
              x: (Math.random() - 0.5) * 200,
              rotate: Math.random() * 720,
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="text-center space-y-4 z-10"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-7xl"
          >
            🏆
          </motion.div>
          <h2 className="text-2xl font-black">Player of the Match</h2>
          <div className="bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/30">
            <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-3">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-black">{player?.name}</h3>
            <p className="text-sm text-muted-foreground">{player?.team}</p>
            <div className="flex justify-center gap-6 mt-3">
              {(player?.runs ?? 0) > 0 && (
                <div className="text-center">
                  <p className="text-lg font-black">{player?.runs}</p>
                  <p className="text-xs text-muted-foreground">Runs ({player?.balls}b)</p>
                </div>
              )}
              {(player?.wickets ?? 0) > 0 && (
                <div className="text-center">
                  <p className="text-lg font-black">{player?.wickets}</p>
                  <p className="text-xs text-muted-foreground">Wickets</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
        <h2 className="text-xl font-black">Select Player of the Match</h2>
        <p className="text-sm text-muted-foreground">Choose the best performer</p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {players.map(p => (
          <Card
            key={p.playerId}
            className={`p-3 cursor-pointer transition-all ${
              selected === p.playerId
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-accent'
            }`}
            onClick={() => setSelected(p.playerId)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.team}</p>
              </div>
              <div className="flex gap-4 text-right shrink-0">
                {p.runs > 0 && (
                  <div>
                    <p className="text-sm font-bold">{p.runs}</p>
                    <p className="text-[10px] text-muted-foreground">({p.balls}b)</p>
                  </div>
                )}
                {p.wickets > 0 && (
                  <div>
                    <p className="text-sm font-bold">{p.wickets}w</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={handleSelect} disabled={!selected} className="w-full h-14 text-lg font-black rounded-xl" size="lg">
        🏆 Confirm Player of the Match
      </Button>
    </div>
  );
}
