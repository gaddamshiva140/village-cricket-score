import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Match, BallType, DismissalType, BatsmanScore, BowlerFigures, BallEvent, SuperOverInnings, SuperOverData } from '@/types/cricket';
import { getOversString } from '@/lib/matchStore';
import CoinToss from '@/components/CoinToss';
import { audioManager } from '@/lib/audioManager';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISSAL_TYPES: DismissalType[] = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'];
const MAX_BALLS = 6;
const MAX_WICKETS = 2;

interface SuperOverScoringProps {
  match: Match;
  onComplete: (result: string, superOverData: SuperOverData) => void;
}

type Phase = 'toss' | 'setup1' | 'scoring1' | 'innings_break' | 'setup2' | 'scoring2' | 'result';

export default function SuperOverScoring({ match, onComplete }: SuperOverScoringProps) {
  const [phase, setPhase] = useState<Phase>('toss');
  const [superOver, setSuperOver] = useState<SuperOverData | null>(null);

  // Setup state
  const [striker1Id, setStriker1Id] = useState('');
  const [nonStriker1Id, setNonStriker1Id] = useState('');
  const [bowler1Id, setBowler1Id] = useState('');

  const teamA = match.setup.teamA;
  const teamB = match.setup.teamB;

  const handleTossComplete = useCallback((tossWinner: 'A' | 'B', _tossCall: 'heads' | 'tails', battingFirst: 'A' | 'B') => {
    audioManager.playSuperOverIntro();

    const battingTeam = battingFirst === 'A' ? teamA : teamB;
    const bowlingTeam = battingFirst === 'A' ? teamB : teamA;
    const battingTeam2 = battingFirst === 'A' ? teamB : teamA;
    const bowlingTeam2 = battingFirst === 'A' ? teamA : teamB;

    const createSOInnings = (batTeam: typeof teamA, bowlTeam: typeof teamA, teamId: string, target?: number): SuperOverInnings => ({
      teamName: batTeam.name,
      teamId,
      batsmen: batTeam.players.slice(0, 3).map(p => ({
        playerId: p.id, playerName: p.name,
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false,
      })),
      bowler: {
        playerId: bowlTeam.players[0].id, playerName: bowlTeam.players[0].name,
        overs: 0, balls: 0, runs: 0, wickets: 0, noBalls: 0, wides: 0,
      },
      totalRuns: 0, totalWickets: 0, totalBalls: 0,
      ballEvents: [],
      currentBatsmanIndex: 0, nonStrikerIndex: 1,
      isCompleted: false, target,
    });

    const soData: SuperOverData = {
      tossWinner,
      battingFirst,
      innings: [
        createSOInnings(battingTeam, bowlingTeam, battingFirst),
        createSOInnings(battingTeam2, bowlingTeam2, battingFirst === 'A' ? 'B' : 'A'),
      ],
      currentInnings: 0,
    };

    setSuperOver(soData);
    setPhase('setup1');
  }, [teamA, teamB]);

  const getCurrentSOInnings = (): SuperOverInnings | null => {
    if (!superOver) return null;
    return superOver.innings[superOver.currentInnings];
  };

  const handleSetupComplete = useCallback((inningsNum: 0 | 1) => {
    if (!superOver) return;
    const inn = superOver.innings[inningsNum];
    const battingTeam = inn.teamName === teamA.name ? teamA : teamB;
    const bowlingTeam = inn.teamName === teamA.name ? teamB : teamA;

    // Find selected batsmen
    const s1 = battingTeam.players.find(p => p.id === striker1Id);
    const s2 = battingTeam.players.find(p => p.id === nonStriker1Id);
    const b = bowlingTeam.players.find(p => p.id === bowler1Id);

    if (!s1 || !s2 || !b) return;

    inn.batsmen = [
      { playerId: s1.id, playerName: s1.name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
      { playerId: s2.id, playerName: s2.name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
    ];
    inn.bowler = {
      playerId: b.id, playerName: b.name,
      overs: 0, balls: 0, runs: 0, wickets: 0, noBalls: 0, wides: 0,
    };
    inn.currentBatsmanIndex = 0;
    inn.nonStrikerIndex = 1;

    setSuperOver({ ...superOver });
    setStriker1Id('');
    setNonStriker1Id('');
    setBowler1Id('');
    setPhase(inningsNum === 0 ? 'scoring1' : 'scoring2');
  }, [superOver, striker1Id, nonStriker1Id, bowler1Id, teamA, teamB]);

  const handleSOScore = useCallback((runs: number, ballType: BallType = 'normal', isWicket = false, dismissalType?: DismissalType) => {
    if (!superOver) return;
    const inn = superOver.innings[superOver.currentInnings];
    if (inn.isCompleted) return;

    const striker = inn.batsmen[inn.currentBatsmanIndex];
    const bowler = inn.bowler;
    const isLegal = ballType !== 'wide' && ballType !== 'noball';

    let batsmanRuns = 0;
    let extras = 0;
    let totalRunsForBall = runs;

    if (ballType === 'normal') { batsmanRuns = runs; }
    else if (ballType === 'noball') { extras = 1; batsmanRuns = runs; totalRunsForBall = runs + 1; }
    else if (ballType === 'wide') { extras = 1 + runs; batsmanRuns = 0; totalRunsForBall = 1 + runs; }
    else if (ballType === 'legbye' || ballType === 'bye') { extras = runs; batsmanRuns = 0; }

    const event: BallEvent = {
      id: crypto.randomUUID(),
      overNumber: 0, ballNumber: inn.totalBalls,
      runs: totalRunsForBall, batsmanRuns, extras, ballType,
      isWicket, dismissalType,
      batsmanId: striker.playerId, bowlerId: bowler.playerId,
      isLegal, timestamp: Date.now(),
    };

    striker.runs += batsmanRuns;
    if (isLegal) striker.balls += 1;
    if (batsmanRuns === 4) striker.fours += 1;
    if (batsmanRuns === 6) striker.sixes += 1;

    bowler.runs += totalRunsForBall;
    if (isLegal) bowler.balls += 1;

    inn.totalRuns += totalRunsForBall;
    if (isLegal) inn.totalBalls += 1;

    // Audio
    if (isWicket) audioManager.playWicket();
    else if (runs === 4 && (ballType === 'normal' || ballType === 'noball')) audioManager.playFour();
    else if (runs === 6 && (ballType === 'normal' || ballType === 'noball')) audioManager.playSix();

    if (isWicket) {
      striker.isOut = true;
      striker.dismissalType = dismissalType;
      inn.totalWickets += 1;
      bowler.wickets += 1;
    }

    // Swap strike on odd runs
    if (!isWicket && totalRunsForBall % 2 === 1) {
      const temp = inn.currentBatsmanIndex;
      inn.currentBatsmanIndex = inn.nonStrikerIndex;
      inn.nonStrikerIndex = temp;
    }

    inn.ballEvents.push(event);

    // Check if innings should end: 6 legal balls or 2 wickets
    const targetChased = superOver.currentInnings === 1 && inn.target && inn.totalRuns >= inn.target;
    if (inn.totalBalls >= MAX_BALLS || inn.totalWickets >= MAX_WICKETS || targetChased) {
      inn.isCompleted = true;

      if (superOver.currentInnings === 0) {
        // Set target for 2nd innings
        superOver.innings[1].target = inn.totalRuns + 1;
        superOver.currentInnings = 1;
        setSuperOver({ ...superOver });
        setPhase('innings_break');
        return;
      } else {
        // Determine result
        const inn1 = superOver.innings[0];
        const inn2 = superOver.innings[1];
        let result: string;
        if (inn2.totalRuns >= (inn2.target || 0)) {
          result = `${inn2.teamName} won the Super Over!`;
        } else if (inn1.totalRuns > inn2.totalRuns) {
          result = `${inn1.teamName} won the Super Over!`;
        } else {
          result = `${inn2.teamName} won the Super Over!`;
        }
        superOver.result = result;
        setSuperOver({ ...superOver });
        setPhase('result');
        return;
      }
    }

    setSuperOver({ ...superOver });
  }, [superOver]);

  const currentInnings = getCurrentSOInnings();
  const currentInningsIdx = superOver?.currentInnings ?? 0;
  const battingTeamPlayers = currentInnings
    ? (currentInnings.teamName === teamA.name ? teamA.players : teamB.players)
    : [];
  const bowlingTeamPlayers = currentInnings
    ? (currentInnings.teamName === teamA.name ? teamB.players : teamA.players)
    : [];

  // For setup phases, determine which team
  const setupInningsIdx = phase === 'setup1' ? 0 : 1;
  const setupInnings = superOver?.innings[setupInningsIdx];
  const setupBattingPlayers = setupInnings
    ? (setupInnings.teamName === teamA.name ? teamA.players : teamB.players)
    : [];
  const setupBowlingPlayers = setupInnings
    ? (setupInnings.teamName === teamA.name ? teamB.players : teamA.players)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="cricket-gradient px-4 pb-4 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-bold opacity-80">⚡ SUPER OVER</p>
          <h1 className="text-2xl font-black">{teamA.name} vs {teamB.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-2 space-y-4 pb-8">
        <AnimatePresence mode="wait">
          {phase === 'toss' && (
            <motion.div key="toss" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-4">
                <h2 className="text-lg font-bold text-center mb-4">Super Over Toss</h2>
                <CoinToss
                  teamAName={teamA.name}
                  teamBName={teamB.name}
                  onTossComplete={handleTossComplete}
                />
              </Card>
            </motion.div>
          )}

          {(phase === 'setup1' || phase === 'setup2') && (
            <motion.div key={phase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="p-4 space-y-4">
                <h2 className="text-lg font-bold text-center">
                  {phase === 'setup1' ? '1st' : '2nd'} Super Over Setup
                </h2>
                <p className="text-sm text-center text-muted-foreground">
                  🏏 {setupInnings?.teamName} Batting
                  {phase === 'setup2' && setupInnings?.target && (
                    <span className="block text-primary font-bold">Target: {setupInnings.target} runs</span>
                  )}
                </p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-bold">Striker</Label>
                    <Select value={striker1Id} onValueChange={setStriker1Id}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select striker..." /></SelectTrigger>
                      <SelectContent>
                        {setupBattingPlayers.filter(p => p.id !== nonStriker1Id).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-bold">Non-Striker</Label>
                    <Select value={nonStriker1Id} onValueChange={setNonStriker1Id}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select non-striker..." /></SelectTrigger>
                      <SelectContent>
                        {setupBattingPlayers.filter(p => p.id !== striker1Id).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-bold">Bowler ({setupInnings?.teamName === teamA.name ? teamB.name : teamA.name})</Label>
                    <Select value={bowler1Id} onValueChange={setBowler1Id}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select bowler..." /></SelectTrigger>
                      <SelectContent>
                        {setupBowlingPlayers.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => handleSetupComplete(setupInningsIdx as 0 | 1)}
                  disabled={!striker1Id || !nonStriker1Id || !bowler1Id}
                  className="w-full h-12 font-bold rounded-xl"
                >
                  Start Super Over 🏏
                </Button>
              </Card>
            </motion.div>
          )}

          {phase === 'innings_break' && (
            <motion.div key="break" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-6 text-center space-y-4">
                <h2 className="text-xl font-black">1st Super Over Complete!</h2>
                <p className="text-3xl font-black text-primary">
                  {superOver?.innings[0].teamName}: {superOver?.innings[0].totalRuns}/{superOver?.innings[0].totalWickets}
                </p>
                <p className="text-muted-foreground">
                  Target: {(superOver?.innings[0].totalRuns || 0) + 1} runs
                </p>
                <Button onClick={() => setPhase('setup2')} className="h-12 px-8 font-bold rounded-xl">
                  Start 2nd Super Over
                </Button>
              </Card>
            </motion.div>
          )}

          {(phase === 'scoring1' || phase === 'scoring2') && currentInnings && (
            <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Score Display */}
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{currentInnings.teamName} Batting</p>
                <div className="flex items-baseline justify-center gap-1 my-1">
                  <span className="text-5xl font-black">{currentInnings.totalRuns}</span>
                  <span className="text-2xl font-bold opacity-70">/{currentInnings.totalWickets}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Balls: {currentInnings.totalBalls}/{MAX_BALLS} • Max Wickets: {MAX_WICKETS}
                </p>
                {currentInnings.target && (
                  <p className="text-sm font-bold text-primary mt-1">
                    Need {currentInnings.target - currentInnings.totalRuns} from {MAX_BALLS - currentInnings.totalBalls} balls
                  </p>
                )}
              </Card>

              {/* Batsmen */}
              <Card className="p-3">
                {currentInnings.batsmen.map((b, i) => (
                  <div key={b.playerId} className="flex items-center justify-between text-sm py-1">
                    <span className={i === currentInnings.currentBatsmanIndex ? 'font-bold' : 'text-muted-foreground'}>
                      {b.playerName} {i === currentInnings.currentBatsmanIndex ? '🏏' : ''}
                    </span>
                    <span className="font-mono font-bold">{b.runs} ({b.balls})</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>⚾ {currentInnings.bowler.playerName}</span>
                  <span className="font-mono">{currentInnings.bowler.balls}-{currentInnings.bowler.runs}-{currentInnings.bowler.wickets}</span>
                </div>
              </Card>

              {/* Ball History */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Balls:</span>
                {currentInnings.ballEvents.map(ball => (
                  <span
                    key={ball.id}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      ball.isWicket ? 'bg-destructive text-destructive-foreground'
                      : ball.runs === 4 ? 'bg-primary/20 text-primary border border-primary/50'
                      : ball.runs === 6 ? 'bg-accent text-accent-foreground border border-accent'
                      : ball.runs === 0 ? 'bg-muted text-muted-foreground'
                      : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {ball.isWicket ? 'W' : ball.ballType === 'wide' ? `${ball.runs}wd` : ball.runs}
                  </span>
                ))}
              </div>

              {/* Score Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map(r => (
                  <Button key={r} variant="outline" className="h-14 text-xl font-black rounded-xl" onClick={() => handleSOScore(r)}>
                    {r}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button className="h-14 text-xl font-black rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground" onClick={() => handleSOScore(4)}>4</Button>
                <Button className="h-14 text-xl font-black rounded-xl bg-accent hover:bg-accent/80 text-accent-foreground" onClick={() => handleSOScore(6)}>6</Button>
                <SOWicketButton onWicket={(d) => handleSOScore(0, 'normal', true, d)} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => handleSOScore(1, 'wide')}>Wide</Button>
                <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => handleSOScore(0, 'noball')}>No Ball</Button>
                <Button variant="outline" className="text-xs font-bold rounded-xl h-11" onClick={() => handleSOScore(1, 'legbye')}>Leg Bye</Button>
              </div>

              {/* Previous innings info */}
              {currentInningsIdx === 1 && superOver && (
                <Card className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    {superOver.innings[0].teamName}: {superOver.innings[0].totalRuns}/{superOver.innings[0].totalWickets}
                  </p>
                </Card>
              )}
            </motion.div>
          )}

          {phase === 'result' && superOver && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-6 text-center space-y-4">
                <div className="text-6xl">🏆</div>
                <h2 className="text-2xl font-black text-primary">{superOver.result}</h2>
                <div className="space-y-2 text-sm">
                  <p className="font-mono font-bold">
                    {superOver.innings[0].teamName}: {superOver.innings[0].totalRuns}/{superOver.innings[0].totalWickets}
                  </p>
                  <p className="font-mono font-bold">
                    {superOver.innings[1].teamName}: {superOver.innings[1].totalRuns}/{superOver.innings[1].totalWickets}
                  </p>
                </div>
                <Button
                  onClick={() => onComplete(superOver.result || '', superOver)}
                  className="h-12 px-8 font-bold rounded-xl"
                >
                  View Scorecard
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SOWicketButton({ onWicket }: { onWicket: (d: DismissalType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" className="h-14 text-base font-black rounded-xl" onClick={() => setOpen(true)}>
        WICKET
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Dismissal Type</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {DISMISSAL_TYPES.map(type => (
              <Button key={type} variant="outline" className="h-12 text-sm font-bold rounded-xl" onClick={() => { onWicket(type); setOpen(false); }}>
                {type}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
