import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  photoUrl?: string;
}

function getImpactScore(p: PlayerStat) {
  return p.runs + p.wickets * 25;
}

export default function PlayerOfTheMatch({ match, onComplete }: PlayerOfTheMatchProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [bestPlayer, setBestPlayer] = useState<PlayerStat | null>(null);

  useEffect(() => {
    const players: PlayerStat[] = [];
    const allMatchPlayers = [...match.setup.teamA.players, ...match.setup.teamB.players];

    match.innings.forEach((innings) => {
      innings.battingOrder
        .filter(b => b.balls > 0 || b.isOut)
        .forEach(b => {
          const existing = players.find(p => p.playerId === b.playerId);
          const playerInfo = allMatchPlayers.find(p => p.id === b.playerId);
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
              photoUrl: playerInfo?.photoUrl,
            });
          }
        });

      innings.bowlingFigures
        .filter(b => b.overs > 0 || b.balls > 0)
        .forEach(b => {
          const existing = players.find(p => p.playerId === b.playerId);
          const playerInfo = allMatchPlayers.find(p => p.id === b.playerId);
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
              photoUrl: playerInfo?.photoUrl,
            });
          }
        });
    });

    players.sort((a, b) => getImpactScore(b) - getImpactScore(a));
    const best = players[0];
    if (best) {
      setBestPlayer(best);
      match.playerOfTheMatch = best.playerId;
      match.playerOfTheMatchName = best.name;
      saveMatch(match);
      setShowCelebration(true);

      setTimeout(() => {
        onComplete(match);
      }, 3500);
    } else {
      onComplete(match);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showCelebration || !bestPlayer) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
    >
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
        className="text-center space-y-4 z-10 px-6"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-7xl"
        >
          🏆
        </motion.div>
        <h2 className="text-2xl font-black">Player of the Match</h2>
        <div className="bg-card rounded-2xl p-6 shadow-lg border-2 border-secondary/50">
          <div className="w-20 h-20 rounded-full bg-secondary/20 mx-auto flex items-center justify-center mb-3 overflow-hidden border-3 border-secondary">
            {bestPlayer.photoUrl ? (
              <img src={bestPlayer.photoUrl} alt={bestPlayer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-secondary">{bestPlayer.name.charAt(0)}</span>
            )}
          </div>
          <h3 className="text-xl font-black">{bestPlayer.name}</h3>
          <p className="text-sm text-muted-foreground">{bestPlayer.team}</p>
          <div className="flex justify-center gap-6 mt-3">
            {bestPlayer.runs > 0 && (
              <div className="text-center">
                <p className="text-lg font-black">{bestPlayer.runs}</p>
                <p className="text-xs text-muted-foreground">Runs ({bestPlayer.balls}b)</p>
              </div>
            )}
            {bestPlayer.wickets > 0 && (
              <div className="text-center">
                <p className="text-lg font-black">{bestPlayer.wickets}</p>
                <p className="text-xs text-muted-foreground">Wickets</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
