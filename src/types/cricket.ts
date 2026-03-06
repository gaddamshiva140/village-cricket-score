export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';
export type BattingStyle = 'Right Hand' | 'Left Hand';
export type DismissalType = 'Bowled' | 'Caught' | 'LBW' | 'Run Out' | 'Stumped' | 'Hit Wicket' | 'Retired';

export interface Player {
  id: string;
  name: string;
  role?: PlayerRole;
  battingStyle?: BattingStyle;
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
  balls: number; // balls in current over
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
  batsmanRuns: number; // runs credited to batsman
  extras: number;
  ballType: BallType;
  isWicket: boolean;
  dismissalType?: DismissalType;
  batsmanId: string;
  bowlerId: string;
  isLegal: boolean; // wides and no-balls are not legal
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
  totalBalls: number; // legal balls bowled
  extras: {
    wides: number;
    noBalls: number;
    legByes: number;
    byes: number;
    total: number;
  };
  ballEvents: BallEvent[];
  currentBatsmanIndex: number; // index in battingOrder for striker
  nonStrikerIndex: number;
  currentBowlerIndex: number; // index in bowlingFigures
  isCompleted: boolean;
  target?: number; // only for 2nd innings
}

export interface MatchSetup {
  id: string;
  title: string;
  groundName: string;
  villageName: string;
  date: string;
  totalOvers: number;
  teamA: { name: string; players: Player[] };
  teamB: { name: string; players: Player[] };
  tossWinner: 'A' | 'B';
  battingFirst: 'A' | 'B';
}

export interface Match {
  id: string;
  setup: MatchSetup;
  innings: [InningsData, InningsData];
  currentInnings: 0 | 1;
  status: 'live' | 'completed' | 'abandoned';
  result?: string;
  playerOfTheMatch?: string;
  createdAt: number;
  updatedAt: number;
}
