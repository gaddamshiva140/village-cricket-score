import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trophy, Star } from 'lucide-react';
import { getMatch, getOversString, getRunRate } from '@/lib/matchStore';

export default function Scorecard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const match = id ? getMatch(id) : null;

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Match not found</p>
        <Link to="/"><Button>Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-black">{match.setup.title}</h1>
          <p className="text-sm opacity-80">{match.setup.groundName} • {match.setup.date}</p>
          {match.result && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary-foreground/20 p-3">
              <Trophy className="h-5 w-5 text-cricket-gold" />
              <span className="font-bold text-sm">{match.result}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        {match.innings.map((innings, inningsIdx) => {
          if (innings.ballEvents.length === 0 && inningsIdx === 1) return null;

          return (
            <div key={inningsIdx} className="space-y-3 animate-fade-in">
              {/* Innings Score */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base">{innings.teamName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {inningsIdx === 0 ? '1st' : '2nd'} Innings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{innings.totalRuns}/{innings.totalWickets}</p>
                    <p className="text-sm text-muted-foreground">
                      ({getOversString(innings.totalBalls)} ov) RR: {getRunRate(innings.totalRuns, innings.totalBalls)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Batting */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Batting</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Batter</TableHead>
                          <TableHead className="text-xs text-right">R</TableHead>
                          <TableHead className="text-xs text-right">B</TableHead>
                          <TableHead className="text-xs text-right">4s</TableHead>
                          <TableHead className="text-xs text-right">6s</TableHead>
                          <TableHead className="text-xs text-right">SR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {innings.battingOrder
                          .filter(b => b.balls > 0 || b.isOut)
                          .map(b => (
                            <TableRow key={b.playerId}>
                              <TableCell className="text-xs py-2">
                                <div>
                                  <span className="font-medium">{b.playerName}</span>
                                  {b.isOut && (
                                    <span className="block text-[10px] text-muted-foreground">{b.dismissalType}</span>
                                  )}
                                  {!b.isOut && b.balls > 0 && (
                                    <span className="block text-[10px] text-primary">not out</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold py-2">{b.runs}</TableCell>
                              <TableCell className="text-xs text-right py-2">{b.balls}</TableCell>
                              <TableCell className="text-xs text-right py-2">{b.fours}</TableCell>
                              <TableCell className="text-xs text-right py-2">{b.sixes}</TableCell>
                              <TableCell className="text-xs text-right py-2">
                                {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Extras */}
              <div className="px-1 text-xs text-muted-foreground">
                Extras: {innings.extras.total} (WD: {innings.extras.wides}, NB: {innings.extras.noBalls}, LB: {innings.extras.legByes}, B: {innings.extras.byes})
              </div>

              {/* Bowling */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bowling</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Bowler</TableHead>
                          <TableHead className="text-xs text-right">O</TableHead>
                          <TableHead className="text-xs text-right">R</TableHead>
                          <TableHead className="text-xs text-right">W</TableHead>
                          <TableHead className="text-xs text-right">Econ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {innings.bowlingFigures
                          .filter(b => b.overs > 0 || b.balls > 0)
                          .map(b => {
                            const totalBalls = b.overs * 6 + b.balls;
                            const econ = totalBalls > 0 ? ((b.runs / totalBalls) * 6).toFixed(1) : '-';
                            return (
                              <TableRow key={b.playerId}>
                                <TableCell className="text-xs font-medium py-2">{b.playerName}</TableCell>
                                <TableCell className="text-xs text-right py-2">{b.overs}.{b.balls}</TableCell>
                                <TableCell className="text-xs text-right py-2">{b.runs}</TableCell>
                                <TableCell className="text-xs text-right font-bold py-2">{b.wickets}</TableCell>
                                <TableCell className="text-xs text-right py-2">{econ}</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
