import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trophy, Star, FileDown } from 'lucide-react';
import { getMatch, getOversString, getRunRate, saveMatch } from '@/lib/matchStore';
import { Match } from '@/types/cricket';
import PlayerOfTheMatch from '@/components/PlayerOfTheMatch';
import { generateMatchPDF } from '@/lib/pdfGenerator';
import MatchAnalytics from '@/components/MatchAnalytics';

export default function Scorecard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [showPOTM, setShowPOTM] = useState(false);

  useEffect(() => {
    if (id) {
      const m = getMatch(id);
      setMatch(m);
      if (m && searchParams.get('potm') === 'true' && !m.playerOfTheMatch) {
        setShowPOTM(true);
      }
    }
  }, [id, searchParams]);

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Match not found</p>
        <Link to="/"><Button>Go Home</Button></Link>
      </div>
    );
  }

  if (showPOTM) {
    return (
      <div className="min-h-screen pb-24">
        <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
          <div className="mx-auto max-w-lg">
            <h1 className="text-xl font-black">{match.setup.title}</h1>
            <p className="text-sm opacity-80 mt-1">{match.result}</p>
          </div>
        </div>
        <div className="mx-auto max-w-lg px-4 -mt-3">
          <Card className="p-4">
            <PlayerOfTheMatch
              match={match}
              onComplete={(updatedMatch) => {
                setMatch({ ...updatedMatch });
                setShowPOTM(false);
              }}
            />
          </Card>
        </div>
      </div>
    );
  }

  const getPlayerPhoto = (playerId: string): string | undefined => {
    const allPlayers = [...match.setup.teamA.players, ...match.setup.teamB.players];
    return allPlayers.find(p => p.id === playerId)?.photoUrl;
  };

  const getPlayerCaptain = (playerId: string): boolean => {
    const allPlayers = [...match.setup.teamA.players, ...match.setup.teamB.players];
    return allPlayers.find(p => p.id === playerId)?.isCaptain || false;
  };

  const PlayerAvatar = ({ playerId, name }: { playerId: string; name: string }) => {
    const photo = getPlayerPhoto(playerId);
    return (
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0)
        )}
      </div>
    );
  };

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
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">{match.result}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        {/* Player of the Match */}
        {match.playerOfTheMatchName && (
          <Card className="p-4 border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {match.playerOfTheMatch && getPlayerPhoto(match.playerOfTheMatch) ? (
                  <img src={getPlayerPhoto(match.playerOfTheMatch)!} alt={match.playerOfTheMatchName} className="w-full h-full object-cover" />
                ) : (
                  <Star className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">🏆 Player of the Match</p>
                <p className="font-black text-lg">Player of the Match: {match.playerOfTheMatchName}</p>
              </div>
            </div>
          </Card>
        )}

        {match.innings.map((innings, inningsIdx) => {
          if (innings.ballEvents.length === 0 && inningsIdx === 1) return null;

          return (
            <div key={inningsIdx} className="space-y-3 animate-fade-in">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const teamData = innings.teamName === match.setup.teamA.name ? match.setup.teamA : match.setup.teamB;
                      return teamData?.logoUrl ? (
                        <img src={teamData.logoUrl} alt={innings.teamName} className="w-10 h-10 rounded-full object-cover border-2 border-border" />
                      ) : null;
                    })()}
                    <div>
                      <h2 className="font-bold text-base">{innings.teamName}</h2>
                      <p className="text-xs text-muted-foreground">{inningsIdx === 0 ? '1st' : '2nd'} Innings</p>
                    </div>
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
                                <div className="flex items-center gap-2">
                                  <PlayerAvatar playerId={b.playerId} name={b.playerName} />
                                  <div>
                                    <span className="font-medium">
                                      {b.playerName}
                                      {getPlayerCaptain(b.playerId) && <span className="text-primary ml-1">(C)</span>}
                                    </span>
                                    {b.isOut && b.dismissalType === 'Retired Out' && <span className="block text-[10px] text-secondary">Retired Out</span>}
                                    {b.isOut && b.dismissalType !== 'Retired Out' && <span className="block text-[10px] text-muted-foreground">{b.dismissalType}</span>}
                                    {!b.isOut && b.balls > 0 && <span className="block text-[10px] text-primary">not out</span>}
                                  </div>
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
                        {/* Did Not Bat */}
                        {(() => {
                          const dnb = innings.battingOrder.filter(b => b.balls === 0 && !b.isOut);
                          if (dnb.length === 0) return null;
                          return (
                            <TableRow>
                              <TableCell colSpan={6} className="text-xs py-2 text-muted-foreground">
                                <span className="font-medium">Did not bat: </span>
                                {dnb.map((b, i) => (
                                  <span key={b.playerId}>
                                    {b.playerName}{getPlayerCaptain(b.playerId) ? ' (C)' : ''}{i < dnb.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="px-1 text-xs text-muted-foreground">
                Extras: {innings.extras.total} (WD: {innings.extras.wides}, NB: {innings.extras.noBalls}, LB: {innings.extras.legByes}, B: {innings.extras.byes})
              </div>

              {/* Partnerships */}
              {innings.partnerships && innings.partnerships.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Partnerships</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {innings.partnerships.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Wicket
                        </span>
                        <span className="font-mono font-bold">{p.runs} runs ({p.balls} balls)</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

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
                                <TableCell className="text-xs font-medium py-2">
                                  <div className="flex items-center gap-2">
                                    <PlayerAvatar playerId={b.playerId} name={b.playerName} />
                                    <span>
                                      {b.playerName}
                                      {getPlayerCaptain(b.playerId) && <span className="text-primary ml-1">(C)</span>}
                                    </span>
                                  </div>
                                </TableCell>
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

              {/* Analytics */}
              <MatchAnalytics innings={innings} label={`${innings.teamName} ${inningsIdx === 0 ? '1st' : '2nd'} Innings`} />
            </div>
          );
        })}

        {/* Actions */}
        <div className="space-y-2">
          {match.status === 'completed' && !match.playerOfTheMatch && (
            <Button onClick={() => setShowPOTM(true)} className="w-full h-14 text-lg font-black rounded-xl" size="lg">
              🏆 Select Player of the Match
            </Button>
          )}

          {match.status === 'completed' && (
            <Button
              onClick={() => generateMatchPDF(match)}
              variant="outline"
              className="w-full h-12 font-bold rounded-xl"
              size="lg"
            >
              <FileDown className="h-5 w-5 mr-2" /> Download PDF Scorecard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
