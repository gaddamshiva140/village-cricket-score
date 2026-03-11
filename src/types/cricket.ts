export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';
export type BattingStyle = 'Right Hand' | 'Left Hand';
export type DismissalType = 'Bowled' | 'Caught' | 'LBW' | 'Run Out' | 'Stumped' | 'Hit Wicket' | 'Retired Out';

export interface Player {
  id: string;
  name: string;
  role?: PlayerRole;
  battingStyle?: BattingStyle;
  isCaptain?: boolean;
  photoUrl?: string;
}

export interface BatsmanScore {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  dismissalText?: string;
}

export interface BowlerFigures {
  playerId: string;
  playerName: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  noBalls: number;
  wides: number;
}

export type BallType = 'normal' | 'wide' | 'noball' | 'legbye' | 'bye';

export interface BallEvent {
  id: string;
  overNumber: number;
  ballNumber: number;
  runs: number;
  batsmanRuns: number;
  extras: number;
  ballType: BallType;
  isWicket: boolean;
  dismissalType?: DismissalType;
  batsmanId: string;
  bowlerId: string;
  isLegal: boolean;
  timestamp: number;
}

export interface InningsData {
  teamName: string;
  teamId: string;
  players: Player[];
  battingOrder: BatsmanScore[];
  bowlingFigures: BowlerFigures[];
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  extras: {
    wides: number;
    noBalls: number;
    legByes: number;
    byes: number;
    total: number;
  };
  ballEvents: BallEvent[];
  currentBatsmanIndex: number;
  nonStrikerIndex: number;
  currentBowlerIndex: number;
  isCompleted: boolean;
  target?: number;
  lastOverBowlerIndex?: number;
  partnerships: Partnership[];
  currentPartnership: Partnership;
}

export interface Partnership {
  runs: number;
  balls: number;
  batsman1Id: string;
  batsman1Name: string;
  batsman2Id: string;
  batsman2Name: string;
  wicketNumber: number;
  isActive: boolean;
}

export interface MatchSetup {
  id: string;
  title: string;
  groundName: string;
  villageName: string;
  date: string;
  totalOvers: number;
  teamA: { name: string; players: Player[]; logoUrl?: string };
  teamB: { name: string; players: Player[]; logoUrl?: string };
  tossWinner: 'A' | 'B';
  tossCall?: 'heads' | 'tails';
  battingFirst: 'A' | 'B';
}

export interface SuperOverInnings {
  teamName: string;
  teamId: string;
  batsmen: BatsmanScore[];
  bowler: BowlerFigures;
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  ballEvents: BallEvent[];
  currentBatsmanIndex: number;
  nonStrikerIndex: number;
  isCompleted: boolean;
  target?: number;
}

export interface SuperOverData {
  tossWinner: 'A' | 'B';
  battingFirst: 'A' | 'B';
  innings: [SuperOverInnings, SuperOverInnings];
  currentInnings: 0 | 1;
  result?: string;
}

export interface Match {
  id: string;
  setup: MatchSetup;
  innings: [InningsData, InningsData];
  currentInnings: 0 | 1;
  status: 'live' | 'completed' | 'abandoned' | 'tied';
  result?: string;
  playerOfTheMatch?: string;
  playerOfTheMatchName?: string;
  superOver?: SuperOverData;
  createdAt: number;
  updatedAt: number;
}
