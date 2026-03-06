import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Undo2, RotateCcw, UserRound } from 'lucide-react';
import { getMatch, recordBall, undoLastBall, getCurrentInnings, getOversString, getRunRate, changeBowler, swapStrike, saveMatch, setActiveMatchId } from '@/lib/matchStore';
import { Match, BallType, DismissalType } from '@/types/cricket';
import CricketAnimation from '@/components/CricketAnimation';

const DISMISSAL_TYPES: DismissalType[] = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'];

export default function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [showWicket, setShowWicket] = useState(false);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [extraType, setExtraType] = useState<'noball' | 'wide' | 'legbye'>('noball');
  const [animation, setAnimation] = useState<'four' | 'six' | 'wicket' | 'fifty' | 'hundred' | null>(null);

  useEffect(() => {
    if (id) {
      const m = getMatch(id);
      if (m) {
        if (m.status === 'completed') {
          navigate(`/scorecard/${id}`);
          return;
        }
        setMatch(m);
      }
    }
  }, [id, navigate]);

  const handleScore = useCallback((runs: number, ballType: BallType = 'normal', isWicket = false, dismissalType?: DismissalType) => {
    if (!match) return;
    const result = recordBall(match, runs, ballType, isWicket, dismissalType);
    if (result.animationType) {
      setAnimation(result.animationType);
    }
    setMatch({ ...result.match });
    if (result.match.status === 'completed') {
      setTimeout(() => {
        setActiveMatchId(null);
        navigate(`/scorecard/${match.id}`);
      }, result.animationType ? 2500 : 500);
    }
    // Check if innings just switched
    if (result.match.currentInnings === 1 && match.currentInnings === 0) {
      setShowBowlerSelect(true);
    }
  }, [match, navigate]);

  const handleUndo = useCallback(() => {
    if (!match) return;
    const updated = undoLastBall(match);
    setMatch({ ...updated });
  }, [match]);

  const handleSwapStrike = useCallback(() => {
    if (!match) return;
    const updated = swapStrike(match);
    setMatch({ ...updated });
  }, [match]);

  const handleChangeBowler = useCallback((idx: number) => {
    if (!match) return;
    const updated = changeBowler(match, idx);
    setMatch({ ...updated });
    setShowBowlerSelect(false);
  }, [match]);

  if (!match) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;

  const innings = getCurrentInnings(match);
  const striker = innings.battingOrder[innings.currentBatsmanIndex];
  const nonStriker = innings.battingOrder[innings.nonStrikerIndex];
  const bowler = innings.bowlingFigures[innings.currentBowlerIndex];

  // Recent balls in current over
  const currentOverBalls = innings.ballEvents.filter(
    e => e.overNumber === Math.floor(innings.totalBalls / 6) ||
      (innings.totalBalls % 6 === 0 && innings.totalBalls > 0 && e.overNumber === Math.floor(innings.totalBalls / 6) - 1)
  ).slice(-8);

  const recentBalls = innings.ballEvents.slice(-6);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <CricketAnimation type={animation} onComplete={() => setAnimation(null)} />

      {/* Header */}
      <div className="cricket-gradient px-4 pb-4 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
              <ArrowLeft className="h-4 w-4" /> Home
            </button>
            <span className="text-xs font-medium opacity-70">{match.setup.totalOvers} overs</span>
          </div>

          {/* Scoreboard */}
          <div className="text-center">
            <p className="text-sm font-medium opacity-80">{innings.teamName} Batting</p>
            <div className="flex items-baseline justify-center gap-1 my-1">
              <span className="text-5xl font-black">{innings.totalRuns}</span>
              <span className="text-2xl font-bold opacity-70">/{innings.totalWickets}</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm opacity-80">
              <span>Overs: {getOversString(innings.totalBalls)}</span>
              <span>RR: {getRunRate(innings.totalRuns, innings.totalBalls)}</span>
            </div>
            {innings.target && (
              <p className="text-sm mt-1 font-semibold">
                Need {innings.target - innings.totalRuns} from {match.setup.totalOvers * 6 - innings.totalBalls} balls
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-2 space-y-3">
        {/* Batsmen & Bowler */}
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">🏏</span>
                <span className="font-bold">{striker?.playerName || '-'}</span>
                <span className="text-xs text-muted-foreground">*</span>
              </div>
              <span className="font-mono font-bold">{striker?.runs} ({striker?.balls})</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="opacity-50">🏏</span>
                <span className="text-muted-foreground">{nonStriker?.playerName || '-'}</span>
              </div>
              <span className="font-mono text-muted-foreground">{nonStriker?.runs} ({nonStriker?.balls})</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>⚾</span>
                <span className="text-muted-foreground">{bowler?.playerName || '-'}</span>
              </div>
              <span className="font-mono text-muted-foreground">
                {bowler?.overs}.{bowler?.balls}-{bowler?.runs}-{bowler?.wickets}
              </span>
            </div>
          </div>
        </Card>

        {/* Recent Balls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">This Over:</span>
          {recentBalls.map(ball => (
            <span
              key={ball.id}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                ball.isWicket
                  ? 'bg-cricket-red text-primary-foreground'
                  : ball.ballType === 'wide'
                  ? 'bg-muted text-muted-foreground border border-border'
                  : ball.ballType === 'noball'
                  ? 'bg-cricket-gold/20 text-cricket-gold border border-cricket-gold/50'
                  : ball.runs === 4
                  ? 'bg-cricket-sky/20 text-cricket-sky border border-cricket-sky/50'
                  : ball.runs === 6
                  ? 'bg-cricket-gold/20 text-cricket-gold border border-cricket-gold/50'
                  : ball.runs === 0
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-accent text-accent-foreground'
              }`}
            >
              {ball.isWicket ? 'W' : ball.ballType === 'wide' ? `${ball.runs}wd` : ball.ballType === 'noball' ? `${ball.batsmanRuns}nb` : ball.ballType === 'legbye' ? `${ball.runs}lb` : ball.runs}
            </span>
          ))}
        </div>

        {/* Score Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(r => (
            <Button
              key={r}
              variant="outline"
              className="h-14 text-xl font-black rounded-xl"
              onClick={() => handleScore(r)}
            >
              {r}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            className="h-14 text-xl font-black rounded-xl bg-cricket-sky hover:bg-cricket-sky/80 text-primary-foreground"
            onClick={() => handleScore(4)}
          >
            4
          </Button>
          <Button
            className="h-14 text-xl font-black rounded-xl bg-cricket-gold hover:bg-cricket-gold/80 text-secondary-foreground"
            onClick={() => handleScore(6)}
          >
            6
          </Button>
          <Button
            variant="destructive"
            className="h-14 text-base font-black rounded-xl"
            onClick={() => setShowWicket(true)}
          >
            WICKET
          </Button>
        </div>

        {/* Extras & Controls */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => { setExtraType('noball'); setShowExtras(true); }}>
            No Ball
          </Button>
          <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => { setExtraType('wide'); setShowExtras(true); }}>
            Wide
          </Button>
          <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => { setExtraType('legbye'); setShowExtras(true); }}>
            Leg Bye
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" className="text-xs rounded-xl h-10" onClick={handleUndo}>
            <Undo2 className="h-4 w-4 mr-1" /> Undo
          </Button>
          <Button variant="ghost" className="text-xs rounded-xl h-10" onClick={handleSwapStrike}>
            <RotateCcw className="h-4 w-4 mr-1" /> Swap
          </Button>
          <Button variant="ghost" className="text-xs rounded-xl h-10" onClick={() => setShowBowlerSelect(true)}>
            <UserRound className="h-4 w-4 mr-1" /> Bowler
          </Button>
        </div>

        {/* First innings score summary */}
        {match.currentInnings === 1 && (
          <Card className="p-3 text-center">
            <p className="text-sm text-muted-foreground">
              {match.innings[0].teamName}: {match.innings[0].totalRuns}/{match.innings[0].totalWickets} ({getOversString(match.innings[0].totalBalls)} ov)
            </p>
            <p className="text-sm font-bold text-primary">
              Target: {match.innings[1].target}
            </p>
          </Card>
        )}
      </div>

      {/* Extras Dialog */}
      <Dialog open={showExtras} onOpenChange={setShowExtras}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">{extraType === 'noball' ? 'No Ball' : extraType === 'legbye' ? 'Leg Bye' : 'Wide'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {(extraType === 'wide' ? [1, 2, 3, 4] : [0, 1, 2, 3, 4, 6]).map(r => (
              <Button
                key={r}
                variant="outline"
                className="h-14 text-lg font-bold rounded-xl"
                onClick={() => {
                  handleScore(r, extraType);
                  setShowExtras(false);
                }}
              >
                +{r}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {extraType === 'noball' && 'No Ball: 1 extra + runs scored by batsman'}
            {extraType === 'wide' && 'Wide: 1 extra + additional runs'}
            {extraType === 'legbye' && 'Leg Bye: Runs to team total, not to batsman'}
          </p>
        </DialogContent>
      </Dialog>

      {/* Wicket Dialog */}
      <Dialog open={showWicket} onOpenChange={setShowWicket}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dismissal Type</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {DISMISSAL_TYPES.map(type => (
              <Button
                key={type}
                variant="outline"
                className="h-12 text-sm font-bold rounded-xl"
                onClick={() => {
                  handleScore(0, 'normal', true, type);
                  setShowWicket(false);
                }}
              >
                {type}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bowler Select Dialog */}
      <Dialog open={showBowlerSelect} onOpenChange={setShowBowlerSelect}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Bowler</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {innings.bowlingFigures.map((b, i) => (
              <Button
                key={b.playerId}
                variant={i === innings.currentBowlerIndex ? 'default' : 'outline'}
                className="w-full justify-between font-medium rounded-xl"
                onClick={() => handleChangeBowler(i)}
              >
                <span>{b.playerName}</span>
                <span className="font-mono text-xs">{b.overs}.{b.balls}-{b.runs}-{b.wickets}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
