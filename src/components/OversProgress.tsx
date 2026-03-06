import { Progress } from '@/components/ui/progress';
import { getOversString } from '@/lib/matchStore';

interface OversProgressProps {
  totalBalls: number;
  totalOvers: number;
}

export default function OversProgress({ totalBalls, totalOvers }: OversProgressProps) {
  const maxBalls = totalOvers * 6;
  const progress = (totalBalls / maxBalls) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Match Progress</span>
        <span className="font-mono font-bold">{getOversString(totalBalls)} / {totalOvers} Overs</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
