import { Match, MatchSetup, InningsData, BallEvent, BatsmanScore, BowlerFigures, Player, DismissalType, BallType } from '@/types/cricket';

const MATCHES_KEY = 'village_cricket_matches';
const ACTIVE_MATCH_KEY = 'village_cricket_active_match';

export function getAllMatches(): Match[] {
  const data = localStorage.getItem(MATCHES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveMatch(match: Match) {
  const matches = getAllMatches();
  const idx = matches.findIndex(m => m.id === match.id);
  if (idx >= 0) matches[idx] = match;
  else matches.unshift(match);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function getActiveMatchId(): string | null {
  return localStorage.getItem(ACTIVE_MATCH_KEY);
}

export function setActiveMatchId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_MATCH_KEY, id);
  else localStorage.removeItem(ACTIVE_MATCH_KEY);
}

export function getMatch(id: string): Match | null {
  return getAllMatches().find(m => m.id === id) || null;
}

function createInnings(teamName: string, teamId: string, players: Player[], bowlingPlayers: Player[], target?: number): InningsData {
  const battingOrder: BatsmanScore[] = players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
  }));

  const bowlingFigures: BowlerFigures[] = bowlingPlayers.map(p => ({
    playerId: p.id,
    playerName: p.name,
    overs: 0,
    balls: 0,
    runs: 0,
    wickets: 0,
    noBalls: 0,
    wides: 0,
  }));

  const initialPartnership = {
    runs: 0,
    balls: 0,
    batsman1Id: players[0]?.id || '',
    batsman1Name: players[0]?.name || '',
    batsman2Id: players[1]?.id || '',
    batsman2Name: players[1]?.name || '',
    wicketNumber: 0,
    isActive: true,
  };

  return {
    teamName,
    teamId,
    players,
    battingOrder,
    bowlingFigures,
    totalRuns: 0,
    totalWickets: 0,
    totalOvers: 0,
    totalBalls: 0,
    extras: { wides: 0, noBalls: 0, legByes: 0, byes: 0, total: 0 },
    ballEvents: [],
    currentBatsmanIndex: 0,
    nonStrikerIndex: 1,
    currentBowlerIndex: 0,
    isCompleted: false,
    target,
    partnerships: [],
    currentPartnership: initialPartnership,
  };
}

export function createMatch(setup: MatchSetup): Match {
  const battingTeam = setup.battingFirst === 'A' ? setup.teamA : setup.teamB;
  const bowlingTeam = setup.battingFirst === 'A' ? setup.teamB : setup.teamA;
  const battingTeamId = setup.battingFirst === 'A' ? 'A' : 'B';
  const bowlingTeamId = setup.battingFirst === 'A' ? 'B' : 'A';

  const innings1 = createInnings(battingTeam.name, battingTeamId, battingTeam.players, bowlingTeam.players);
  const innings2 = createInnings(bowlingTeam.name, bowlingTeamId, bowlingTeam.players, battingTeam.players);

  const match: Match = {
    id: setup.id,
    setup,
    innings: [innings1, innings2],
    currentInnings: 0,
    status: 'live',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  saveMatch(match);
  setActiveMatchId(match.id);
  return match;
}

export function getCurrentInnings(match: Match): InningsData {
  return match.innings[match.currentInnings];
}

export function getOversString(totalBalls: number): string {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

export function getRunRate(runs: number, totalBalls: number): string {
  if (totalBalls === 0) return '0.00';
  return ((runs / totalBalls) * 6).toFixed(2);
}

export function recordBall(
  match: Match,
  runs: number,
  ballType: BallType,
  isWicket: boolean,
  dismissalType?: DismissalType,
): { match: Match; event: BallEvent; animationType?: 'four' | 'six' | 'wicket' | 'fifty' | 'hundred' } {
  const innings = getCurrentInnings(match);
  const striker = innings.battingOrder[innings.currentBatsmanIndex];
  const bowler = innings.bowlingFigures[innings.currentBowlerIndex];

  const isLegal = ballType !== 'wide' && ballType !== 'noball';
  let batsmanRuns = 0;
  let extras = 0;
  let totalRunsForBall = runs;

  if (ballType === 'normal') {
    batsmanRuns = runs;
  } else if (ballType === 'noball') {
    extras = 1; // 1 run penalty
    batsmanRuns = runs; // batsman gets credited for runs hit
    totalRunsForBall = runs + 1;
  } else if (ballType === 'wide') {
    extras = 1 + runs; // 1 wide + any additional runs
    batsmanRuns = 0;
    totalRunsForBall = 1 + runs;
  } else if (ballType === 'legbye') {
    extras = runs;
    batsmanRuns = 0;
  } else if (ballType === 'bye') {
    extras = runs;
    batsmanRuns = 0;
  }

  const event: BallEvent = {
    id: crypto.randomUUID(),
    overNumber: Math.floor(innings.totalBalls / 6),
    ballNumber: innings.totalBalls % 6,
    runs: totalRunsForBall,
    batsmanRuns,
    extras,
    ballType,
    isWicket,
    dismissalType,
    batsmanId: striker.playerId,
    bowlerId: bowler.playerId,
    isLegal,
    timestamp: Date.now(),
  };

  // Update batsman
  striker.runs += batsmanRuns;
  if (isLegal || ballType === 'noball') striker.balls += (isLegal ? 1 : 0);
  // Count balls faced on no-balls too
  if (ballType === 'noball') striker.balls += 1;
  if (batsmanRuns === 4 || (ballType === 'normal' && runs === 4)) striker.fours += 1;
  if (batsmanRuns === 6 || (ballType === 'normal' && runs === 6)) striker.sixes += 1;

  // Update bowler
  bowler.runs += totalRunsForBall;
  if (isLegal) {
    bowler.balls += 1;
    if (bowler.balls === 6) {
      bowler.overs += 1;
      bowler.balls = 0;
    }
  }
  if (ballType === 'noball') bowler.noBalls += 1;
  if (ballType === 'wide') bowler.wides += 1;

  // Update innings totals
  innings.totalRuns += totalRunsForBall;
  if (isLegal) innings.totalBalls += 1;

  // Update extras
  if (ballType === 'wide') innings.extras.wides += 1 + runs;
  if (ballType === 'noball') innings.extras.noBalls += 1;
  if (ballType === 'legbye') innings.extras.legByes += runs;
  if (ballType === 'bye') innings.extras.byes += runs;
  innings.extras.total += extras;

  // Determine animation
  let animationType: 'four' | 'six' | 'wicket' | 'fifty' | 'hundred' | undefined;
  if (isWicket) animationType = 'wicket';
  else if (runs === 6 && (ballType === 'normal' || ballType === 'noball')) animationType = 'six';
  else if (runs === 4 && (ballType === 'normal' || ballType === 'noball')) animationType = 'four';

  // Check milestones
  if (!animationType && striker.runs >= 100 && striker.runs - batsmanRuns < 100) animationType = 'hundred';
  else if (!animationType && striker.runs >= 50 && striker.runs - batsmanRuns < 50) animationType = 'fifty';

  // Handle wicket
  if (isWicket) {
    striker.isOut = true;
    striker.dismissalType = dismissalType;
    innings.totalWickets += 1;
    bowler.wickets += 1;

    // Next batsman
    const nextBatIdx = innings.battingOrder.findIndex((b, i) =>
      i !== innings.currentBatsmanIndex && i !== innings.nonStrikerIndex && !b.isOut
    );
    if (nextBatIdx >= 0) {
      innings.currentBatsmanIndex = nextBatIdx;
    }
  }

  // Rotate strike on odd runs (for legal deliveries and no-balls)
  if (!isWicket && totalRunsForBall % 2 === 1) {
    const temp = innings.currentBatsmanIndex;
    innings.currentBatsmanIndex = innings.nonStrikerIndex;
    innings.nonStrikerIndex = temp;
  }

  // Auto end over
  if (isLegal && innings.totalBalls % 6 === 0 && innings.totalBalls > 0) {
    // Rotate strike at end of over
    const temp = innings.currentBatsmanIndex;
    innings.currentBatsmanIndex = innings.nonStrikerIndex;
    innings.nonStrikerIndex = temp;
  }

  innings.ballEvents.push(event);

  // Check innings completion
  const allOut = innings.totalWickets >= innings.players.length - 1;
  const oversComplete = innings.totalBalls >= match.setup.totalOvers * 6;
  const targetChased = match.currentInnings === 1 && innings.target && innings.totalRuns >= innings.target;

  if (allOut || oversComplete || targetChased) {
    innings.isCompleted = true;
    if (match.currentInnings === 0) {
      match.currentInnings = 1;
      match.innings[1].target = innings.totalRuns + 1;
    } else {
      match.status = 'completed';
      match.result = calculateResult(match);
    }
  }

  match.updatedAt = Date.now();
  saveMatch(match);
  return { match, event, animationType };
}

export function undoLastBall(match: Match): Match {
  const innings = getCurrentInnings(match);
  if (innings.ballEvents.length === 0) return match;

  const lastEvent = innings.ballEvents.pop()!;
  const striker = innings.battingOrder.find(b => b.playerId === lastEvent.batsmanId)!;
  const bowler = innings.bowlingFigures.find(b => b.playerId === lastEvent.bowlerId)!;

  // Reverse batsman stats
  striker.runs -= lastEvent.batsmanRuns;
  if (lastEvent.isLegal || lastEvent.ballType === 'noball') striker.balls -= 1;
  if (lastEvent.batsmanRuns === 4) striker.fours -= 1;
  if (lastEvent.batsmanRuns === 6) striker.sixes -= 1;

  // Reverse bowler stats
  bowler.runs -= lastEvent.runs;
  if (lastEvent.isLegal) {
    if (bowler.balls === 0) {
      bowler.overs -= 1;
      bowler.balls = 5;
    } else {
      bowler.balls -= 1;
    }
  }
  if (lastEvent.ballType === 'noball') bowler.noBalls -= 1;
  if (lastEvent.ballType === 'wide') bowler.wides -= 1;

  // Reverse innings totals
  innings.totalRuns -= lastEvent.runs;
  if (lastEvent.isLegal) innings.totalBalls -= 1;

  // Reverse extras
  if (lastEvent.ballType === 'wide') innings.extras.wides -= (1 + lastEvent.runs - 1);
  if (lastEvent.ballType === 'noball') innings.extras.noBalls -= 1;
  if (lastEvent.ballType === 'legbye') innings.extras.legByes -= lastEvent.runs;
  if (lastEvent.ballType === 'bye') innings.extras.byes -= lastEvent.runs;
  innings.extras.total -= lastEvent.extras;

  // Reverse wicket
  if (lastEvent.isWicket) {
    striker.isOut = false;
    striker.dismissalType = undefined;
    innings.totalWickets -= 1;
    bowler.wickets -= 1;
    innings.currentBatsmanIndex = innings.battingOrder.findIndex(b => b.playerId === lastEvent.batsmanId);
  }

  // Reverse strike rotation (simplified - not perfect for all edge cases)
  if (!lastEvent.isWicket && lastEvent.runs % 2 === 1) {
    const temp = innings.currentBatsmanIndex;
    innings.currentBatsmanIndex = innings.nonStrikerIndex;
    innings.nonStrikerIndex = temp;
  }

  innings.isCompleted = false;
  match.updatedAt = Date.now();
  saveMatch(match);
  return match;
}

function calculateResult(match: Match): string {
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  if (inn2.totalRuns >= (inn2.target || 0)) {
    const wicketsLeft = inn2.players.length - 1 - inn2.totalWickets;
    return `${inn2.teamName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
  }

  const runDiff = inn1.totalRuns - inn2.totalRuns;
  return `${inn1.teamName} won by ${runDiff} run${runDiff !== 1 ? 's' : ''}`;
}

export function changeBowler(match: Match, bowlerIndex: number): Match {
  const innings = getCurrentInnings(match);
  innings.currentBowlerIndex = bowlerIndex;
  match.updatedAt = Date.now();
  saveMatch(match);
  return match;
}

export function swapStrike(match: Match): Match {
  const innings = getCurrentInnings(match);
  const temp = innings.currentBatsmanIndex;
  innings.currentBatsmanIndex = innings.nonStrikerIndex;
  innings.nonStrikerIndex = temp;
  match.updatedAt = Date.now();
  saveMatch(match);
  return match;
}

export function deleteMatch(id: string) {
  const matches = getAllMatches().filter(m => m.id !== id);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  if (getActiveMatchId() === id) setActiveMatchId(null);
}
