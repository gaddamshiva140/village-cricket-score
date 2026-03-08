import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Undo2, RotateCcw, UserRound, LogOut } from 'lucide-react';
import { getMatch, recordBall, undoLastBall, getCurrentInnings, getOversString, getRunRate, changeBowler, swapStrike, saveMatch, setActiveMatchId, retireOut } from '@/lib/matchStore';
import { Match, BallType, DismissalType } from '@/types/cricket';
import CricketAnimation from '@/components/CricketAnimation';
import OversProgress from '@/components/OversProgress';
import WinPrediction from '@/components/WinPrediction';

const DISMISSAL_TYPES: DismissalType[] = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'];

export default function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [showWicket, setShowWicket] = useState(false);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [bowlerSelectRequired, setBowlerSelectRequired] = useState(false);
  const [showNextBatsman, setShowNextBatsman] = useState(false);
  const [extraType, setExtraType] = useState<'noball' | 'wide' | 'legbye'>('noball');
  const [animation, setAnimation] = useState<'four' | 'six' | 'wicket' | 'fifty' | 'hundred' | null>(null);
  const [overCompleteMessage, setOverCompleteMessage] = useState<string | null>(null);
  const [pendingWicketDone, setPendingWicketDone] = useState(false);
  const [showInningsSetup, setShowInningsSetup] = useState(false);
  const [setupStrikerId, setSetupStrikerId] = useState<string>('');
  const [setupNonStrikerId, setSetupNonStrikerId] = useState<string>('');
  const [setupBowlerId, setSetupBowlerId] = useState<string>('');

  useEffect(() => {
    if (id) {
      const m = getMatch(id);
      if (m) {
        if (m.status === 'completed') {
          navigate(`/scorecard/${id}`);
          return;
        }
        setMatch(m);
        // Show initial setup if no balls bowled yet in current innings
        const currentInnings = m.innings[m.currentInnings];
        if (currentInnings.totalBalls === 0) {
          setShowInningsSetup(true);
        }
      }
    }
  }, [id, navigate]);

  const handleScore = useCallback((runs: number, ballType: BallType = 'normal', isWicket = false, dismissalType?: DismissalType) => {
    if (!match) return;
    
    const inningsBefore = match.currentInnings;
    
    const result = recordBall(match, runs, ballType, isWicket, dismissalType);
    if (result.animationType) {
      setAnimation(result.animationType);
    }
    setMatch({ ...result.match });

    if (result.match.status === 'completed') {
      setTimeout(() => {
        setActiveMatchId(null);
        navigate(`/scorecard/${match.id}?potm=true`);
      }, result.animationType ? 2500 : 500);
      return;
    }

    if (isWicket) {
      const currentInnings = getCurrentInnings(result.match);
      const availableBatsmen = currentInnings.battingOrder.filter((b, i) =>
        i !== currentInnings.currentBatsmanIndex && i !== currentInnings.nonStrikerIndex && !b.isOut
      );
      if (availableBatsmen.length > 0 && !currentInnings.isCompleted) {
        setPendingWicketDone(true);
        setTimeout(() => {
          setShowNextBatsman(true);
          setPendingWicketDone(false);
        }, result.animationType ? 2500 : 500);
      }
    }

    if (result.match.currentInnings === 1 && inningsBefore === 0) {
      setBowlerSelectRequired(true);
      setShowBowlerSelect(true);
      return;
    }

    const currentInnings = getCurrentInnings(result.match);
    const isLegal = ballType !== 'wide' && ballType !== 'noball';
    if (isLegal && currentInnings.totalBalls > 0 && currentInnings.totalBalls % 6 === 0 && !currentInnings.isCompleted) {
      const completedOver = Math.floor(currentInnings.totalBalls / 6);
      setOverCompleteMessage(`Over ${completedOver} Completed!`);
      setBowlerSelectRequired(true);
      setShowBowlerSelect(true);
    }
  }, [match, navigate]);

  const handleRetireOut = useCallback(() => {
    if (!match) return;
    const result = retireOut(match);
    setMatch({ ...result.match });

    if (result.match.status === 'completed') {
      setTimeout(() => {
        setActiveMatchId(null);
        navigate(`/scorecard/${match.id}?potm=true`);
      }, 500);
      return;
    }

    if (result.needsNextBatsman) {
      setShowNextBatsman(true);
    }
  }, [match, navigate]);

  const handleSelectNextBatsman = useCallback((batsmanIndex: number) => {
    if (!match) return;
    const innings = getCurrentInnings(match);
    innings.currentBatsmanIndex = batsmanIndex;
    // Update current partnership with correct batsman
    const newBatsman = innings.battingOrder[batsmanIndex];
    const nonStriker = innings.battingOrder[innings.nonStrikerIndex];
    innings.currentPartnership.batsman1Id = newBatsman.playerId;
    innings.currentPartnership.batsman1Name = newBatsman.playerName;
    innings.currentPartnership.batsman2Id = nonStriker.playerId;
    innings.currentPartnership.batsman2Name = nonStriker.playerName;
    match.updatedAt = Date.now();
    saveMatch(match);
    setMatch({ ...match });
    setShowNextBatsman(false);
  }, [match]);

  const handleInningsSetup = useCallback(() => {
    if (!match || !setupStrikerId || !setupNonStrikerId || !setupBowlerId) return;
    const currentInn = getCurrentInnings(match);
    
    const strikerIdx = currentInn.battingOrder.findIndex(b => b.playerId === setupStrikerId);
    const nonStrikerIdx = currentInn.battingOrder.findIndex(b => b.playerId === setupNonStrikerId);
    const bowlerIdx = currentInn.bowlingFigures.findIndex(b => b.playerId === setupBowlerId);
    
    if (strikerIdx >= 0) currentInn.currentBatsmanIndex = strikerIdx;
    if (nonStrikerIdx >= 0) currentInn.nonStrikerIndex = nonStrikerIdx;
    if (bowlerIdx >= 0) currentInn.currentBowlerIndex = bowlerIdx;
    
    const str = currentInn.battingOrder[currentInn.currentBatsmanIndex];
    const ns = currentInn.battingOrder[currentInn.nonStrikerIndex];
    currentInn.currentPartnership.batsman1Id = str.playerId;
    currentInn.currentPartnership.batsman1Name = str.playerName;
    currentInn.currentPartnership.batsman2Id = ns.playerId;
    currentInn.currentPartnership.batsman2Name = ns.playerName;
    
    match.updatedAt = Date.now();
    saveMatch(match);
    setMatch({ ...match });
    setShowInningsSetup(false);
    setSetupStrikerId('');
    setSetupNonStrikerId('');
    setSetupBowlerId('');
  }, [match, setupStrikerId, setupNonStrikerId, setupBowlerId]);

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
    const innings = getCurrentInnings(match);
    
    if (bowlerSelectRequired && innings.lastOverBowlerIndex !== undefined && idx === innings.lastOverBowlerIndex) {
      return;
    }
    
    innings.lastOverBowlerIndex = innings.currentBowlerIndex;
    
    const updated = changeBowler(match, idx);
    setMatch({ ...updated });
    setShowBowlerSelect(false);
    setBowlerSelectRequired(false);
    setOverCompleteMessage(null);
  }, [match, bowlerSelectRequired]);

  if (!match) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;

  const innings = getCurrentInnings(match);
  const striker = innings.battingOrder[innings.currentBatsmanIndex];
  const nonStriker = innings.battingOrder[innings.nonStrikerIndex];
  const bowler = innings.bowlingFigures[innings.currentBowlerIndex];
  const strikerPlayer = innings.players.find(p => p.id === striker?.playerId);
  const nonStrikerPlayer = innings.players.find(p => p.id === nonStriker?.playerId);
  const bowlingTeamPlayers = match.currentInnings === 0
    ? (match.setup.battingFirst === 'A' ? match.setup.teamB.players : match.setup.teamA.players)
    : (match.setup.battingFirst === 'A' ? match.setup.teamA.players : match.setup.teamB.players);
  const bowlerPlayer = bowlingTeamPlayers.find(p => p.id === bowler?.playerId);

  const currentOverBalls = innings.ballEvents.filter(e => {
    const currentOver = Math.floor(innings.totalBalls / 6);
    const ballOver = innings.totalBalls % 6 === 0 && innings.totalBalls > 0 ? currentOver - 1 : currentOver;
    return e.overNumber === (innings.totalBalls % 6 === 0 && innings.totalBalls > 0 ? currentOver : ballOver);
  });
  const recentBalls = innings.ballEvents.slice(-6);

  const PlayerAvatar = ({ player, size = 'w-7 h-7', textSize = 'text-xs' }: { player?: { name: string; photoUrl?: string }; size?: string; textSize?: string }) => (
    <div className={`${size} rounded-full bg-muted flex items-center justify-center ${textSize} font-bold shrink-0 overflow-hidden`}>
      {player?.photoUrl ? (
        <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-muted-foreground">{player?.name?.charAt(0) || '?'}</span>
      )}
    </div>
  );

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

          <div className="text-center">
            <p className="text-sm font-medium opacity-80">{innings.teamName} Batting</p>
            <div className="flex items-baseline justify-center gap-1 my-1">
              <span className="text-5xl font-black">{innings.totalRuns}</span>
              <span className="text-2xl font-bold opacity-70">/{innings.totalWickets}</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm opacity-80">
              <span>Overs: {getOversString(innings.totalBalls)} / {match.setup.totalOvers}</span>
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
        <Card className="p-3">
          <OversProgress totalBalls={innings.totalBalls} totalOvers={match.setup.totalOvers} />
        </Card>

        {/* Win Prediction */}
        <WinPrediction match={match} />

        {/* Batsmen & Bowler */}
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <PlayerAvatar player={strikerPlayer} />
                <span className="font-bold">{striker?.playerName || '-'}</span>
                {strikerPlayer?.isCaptain && <span className="text-[10px] text-primary font-bold">(C)</span>}
                <span className="text-xs text-primary font-bold">*</span>
              </div>
              <span className="font-mono font-bold">{striker?.runs} ({striker?.balls})</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <PlayerAvatar player={nonStrikerPlayer} />
                <span className="text-muted-foreground">{nonStriker?.playerName || '-'}</span>
                {nonStrikerPlayer?.isCaptain && <span className="text-[10px] text-primary font-bold">(C)</span>}
              </div>
              <span className="font-mono text-muted-foreground">{nonStriker?.runs} ({nonStriker?.balls})</span>
            </div>

            {/* Partnership */}
            <div className="border-t pt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Partnership</span>
              <span className="font-mono font-bold text-foreground">
                {innings.currentPartnership.runs} runs ({innings.currentPartnership.balls} balls)
              </span>
            </div>

            <div className="border-t pt-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {bowlerPlayer?.photoUrl ? (
                    <img src={bowlerPlayer.photoUrl} alt={bowler?.playerName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-destructive">{bowler?.playerName?.charAt(0) || '?'}</span>
                  )}
                </div>
                <span className="text-muted-foreground">{bowler?.playerName || '-'}</span>
                {bowlerPlayer?.isCaptain && <span className="text-[10px] text-primary font-bold">(C)</span>}
              </div>
              <span className="font-mono text-muted-foreground">
                {bowler?.overs}.{bowler?.balls}-{bowler?.runs}-{bowler?.wickets}
              </span>
            </div>
          </div>
        </Card>

        {/* Extras Display */}
        <Card className="p-2 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Extras: {innings.extras.total}</span>
          <div className="flex gap-2 text-muted-foreground">
            <span>NB:{innings.extras.noBalls}</span>
            <span>WD:{innings.extras.wides}</span>
            <span>LB:{innings.extras.legByes}</span>
            <span>B:{innings.extras.byes}</span>
          </div>
        </Card>

        {/* Recent Balls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">This Over:</span>
          {recentBalls.map(ball => (
            <span
              key={ball.id}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                ball.isWicket ? 'bg-destructive text-destructive-foreground'
                : ball.ballType === 'wide' ? 'bg-muted text-muted-foreground border border-border'
                : ball.ballType === 'noball' ? 'bg-accent text-accent-foreground border border-border'
                : ball.runs === 4 ? 'bg-primary/20 text-primary border border-primary/50'
                : ball.runs === 6 ? 'bg-accent text-accent-foreground border border-accent'
                : ball.runs === 0 ? 'bg-muted text-muted-foreground'
                : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {ball.isWicket ? 'W' : ball.ballType === 'wide' ? `${ball.runs}wd` : ball.ballType === 'noball' ? `${ball.batsmanRuns}nb` : ball.ballType === 'legbye' ? `${ball.runs}lb` : ball.runs}
            </span>
          ))}
        </div>

        {/* Score Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(r => (
            <Button key={r} variant="outline" className="h-14 text-xl font-black rounded-xl" onClick={() => handleScore(r)}>
              {r}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button className="h-14 text-xl font-black rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground" onClick={() => handleScore(4)}>4</Button>
          <Button className="h-14 text-xl font-black rounded-xl bg-accent hover:bg-accent/80 text-accent-foreground" onClick={() => handleScore(6)}>6</Button>
          <Button variant="destructive" className="h-14 text-base font-black rounded-xl" onClick={() => setShowWicket(true)}>WICKET</Button>
        </div>

        {/* Extras & Controls */}
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => { setExtraType('noball'); setShowExtras(true); }}>No Ball</Button>
          <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => { setExtraType('wide'); setShowExtras(true); }}>Wide</Button>
          <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => { setExtraType('legbye'); setShowExtras(true); }}>Leg Bye</Button>
          <Button variant="outline" className="text-xs font-bold rounded-xl h-11 text-destructive border-destructive/30" onClick={handleRetireOut}>
            <LogOut className="h-3 w-3 mr-1" /> Retire
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" className="text-xs rounded-xl h-10" onClick={handleUndo}>
            <Undo2 className="h-4 w-4 mr-1" /> Undo
          </Button>
          <Button variant="ghost" className="text-xs rounded-xl h-10" onClick={handleSwapStrike}>
            <RotateCcw className="h-4 w-4 mr-1" /> Swap
          </Button>
          <Button variant="ghost" className="text-xs rounded-xl h-10" onClick={() => { setBowlerSelectRequired(false); setShowBowlerSelect(true); }}>
            <UserRound className="h-4 w-4 mr-1" /> Bowler
          </Button>
        </div>

        {match.currentInnings === 1 && (
          <Card className="p-3 text-center">
            <p className="text-sm text-muted-foreground">
              {match.innings[0].teamName}: {match.innings[0].totalRuns}/{match.innings[0].totalWickets} ({getOversString(match.innings[0].totalBalls)} ov)
            </p>
            <p className="text-sm font-bold text-primary">Target: {match.innings[1].target}</p>
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
              <Button key={r} variant="outline" className="h-14 text-lg font-bold rounded-xl" onClick={() => { handleScore(r, extraType); setShowExtras(false); }}>
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
              <Button key={type} variant="outline" className="h-12 text-sm font-bold rounded-xl" onClick={() => { handleScore(0, 'normal', true, type); setShowWicket(false); }}>
                {type}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Next Batsman Dialog */}
      <Dialog open={showNextBatsman} onOpenChange={(open) => {
        if (!open) return;
        setShowNextBatsman(open);
      }}>
        <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              <div className="space-y-1">
                <span className="block text-destructive">Wicket! 🏏</span>
                <span className="block text-sm font-normal text-muted-foreground">Select next batsman</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {innings.battingOrder.map((b, i) => {
              if (b.isOut || i === innings.nonStrikerIndex || i === innings.currentBatsmanIndex) return null;
              const player = innings.players.find(p => p.id === b.playerId);
              return (
                <Button
                  key={b.playerId}
                  variant="outline"
                  className="w-full justify-start font-medium rounded-xl"
                  onClick={() => handleSelectNextBatsman(i)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {player?.photoUrl ? (
                        <img src={player.photoUrl} alt={b.playerName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{b.playerName.charAt(0)}</span>
                      )}
                    </div>
                    <span>{b.playerName}</span>
                    {player?.isCaptain && <span className="text-[10px] text-primary font-bold">(C)</span>}
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bowler Select Dialog */}
      <Dialog open={showBowlerSelect} onOpenChange={(open) => {
        if (!open && bowlerSelectRequired) return;
        setShowBowlerSelect(open);
      }}>
        <DialogContent className="max-w-sm" onPointerDownOutside={bowlerSelectRequired ? (e) => e.preventDefault() : undefined}>
          <DialogHeader>
            <DialogTitle>
              {overCompleteMessage ? (
                <div className="space-y-1">
                  <span className="block text-primary">{overCompleteMessage}</span>
                  <span className="block text-sm font-normal text-muted-foreground">Select Next Bowler</span>
                </div>
              ) : 'Select Bowler'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {innings.bowlingFigures.map((b, i) => {
              const isLastOverBowler = bowlerSelectRequired && innings.lastOverBowlerIndex !== undefined && i === innings.lastOverBowlerIndex;
              const bPlayer = bowlingTeamPlayers.find(p => p.id === b.playerId);
              return (
                <Button
                  key={b.playerId}
                  variant={i === innings.currentBowlerIndex ? 'default' : 'outline'}
                  className={`w-full justify-between font-medium rounded-xl ${isLastOverBowler ? 'opacity-40' : ''}`}
                  onClick={() => handleChangeBowler(i)}
                  disabled={isLastOverBowler}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                      {bPlayer?.photoUrl ? (
                        <img src={bPlayer.photoUrl} alt={b.playerName} className="w-full h-full object-cover" />
                      ) : (
                        b.playerName.charAt(0)
                      )}
                    </div>
                    <span>{b.playerName}</span>
                    {bPlayer?.isCaptain && <span className="text-[10px] text-primary font-bold">(C)</span>}
                    {isLastOverBowler && <span className="text-[10px] text-muted-foreground">(bowled last over)</span>}
                  </div>
                  <span className="font-mono text-xs">{b.overs}.{b.balls}-{b.runs}-{b.wickets}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
