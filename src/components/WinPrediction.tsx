import { Card } from '@/components/ui/card';
import { Match } from '@/types/cricket';

interface WinPredictionProps {
  match: Match;
}

export default function WinPrediction({ match }: WinPredictionProps) {
  // Only show during 2nd innings
  if (match.currentInnings !== 1) return null;

  const inn2 = match.innings[1];
  const target = inn2.target || 0;
  if (target === 0) return null;

  const runsNeeded = target - inn2.totalRuns;
  const ballsRemaining = match.setup.totalOvers * 6 - inn2.totalBalls;
  const wicketsLeft = inn2.players.length - 1 - inn2.totalWickets;

  if (ballsRemaining <= 0 || runsNeeded <= 0) return null;

  const currentRR = inn2.totalBalls > 0 ? (inn2.totalRuns / inn2.totalBalls) * 6 : 0;
  const requiredRR = (runsNeeded / ballsRemaining) * 6;

  // Simple prediction: based on RR ratio and wickets
  const rrFactor = currentRR > 0 ? Math.min(currentRR / requiredRR, 2) : 0.3;
  const wicketFactor = wicketsLeft / (inn2.players.length - 1);
  const progressFactor = inn2.totalBalls / (match.setup.totalOvers * 6);

  let chasingProb = (rrFactor * 0.5 + wicketFactor * 0.3 + (1 - progressFactor) * 0.2) * 50;
  chasingProb = Math.max(5, Math.min(95, chasingProb));
  const defendingProb = 100 - chasingProb;

  const team1Name = match.innings[0].teamName;
  const team2Name = inn2.teamName;

  return (
    <Card className="p-3 space-y-2">
      <p className="text-xs font-bold text-muted-foreground">Win Prediction</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{team2Name}</span>
          <span className="font-bold text-primary">{Math.round(chasingProb)}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          <div className="h-full bg-primary transition-all rounded-l-full" style={{ width: `${chasingProb}%` }} />
          <div className="h-full bg-destructive transition-all rounded-r-full" style={{ width: `${defendingProb}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{team1Name}</span>
          <span className="font-bold text-destructive">{Math.round(defendingProb)}%</span>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>RRR: {requiredRR.toFixed(1)}</span>
        <span>CRR: {currentRR.toFixed(1)}</span>
        <span>{runsNeeded} off {ballsRemaining}</span>
      </div>
    </Card>
  );
}
