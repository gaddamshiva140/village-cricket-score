import { Link } from 'react-router-dom';
import { PlusCircle, Clock, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllMatches, getActiveMatchId } from '@/lib/matchStore';
import { getOversString } from '@/lib/matchStore';

export default function Home() {
  const matches = getAllMatches();
  const activeMatchId = getActiveMatchId();
  const liveMatch = activeMatchId ? matches.find(m => m.id === activeMatchId && m.status === 'live') : null;
  const recentMatches = matches.filter(m => m.status === 'completed').slice(0, 3);

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="cricket-gradient px-4 pb-8 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏏</span>
            <h1 className="text-3xl font-black tracking-tight">Village Cricket Pro</h1>
          </div>
          <p className="text-primary-foreground/80 font-medium">Score your village matches like a pro</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-4 space-y-6">
        {/* Live Match Card */}
        {liveMatch && (
          <Link to={`/score/${liveMatch.id}`}>
            <div className="rounded-xl border-2 border-cricket-red/50 bg-card p-4 shadow-lg animate-pulse-glow">
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cricket-red opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-cricket-red" />
                </span>
                <span className="text-sm font-bold text-cricket-red uppercase tracking-wider">Live Match</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-card-foreground">{liveMatch.setup.teamA.name} vs {liveMatch.setup.teamB.name}</p>
                  <p className="text-sm text-muted-foreground">{liveMatch.setup.groundName}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-card-foreground">
                    {liveMatch.innings[liveMatch.currentInnings].totalRuns}/{liveMatch.innings[liveMatch.currentInnings].totalWickets}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({getOversString(liveMatch.innings[liveMatch.currentInnings].totalBalls)} ov)
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/create">
            <Button className="w-full h-20 flex-col gap-2 rounded-xl text-base font-bold" size="lg">
              <PlusCircle className="h-6 w-6" />
              New Match
            </Button>
          </Link>
          <Link to="/history">
            <Button variant="outline" className="w-full h-20 flex-col gap-2 rounded-xl text-base font-bold" size="lg">
              <Clock className="h-6 w-6" />
              Match History
            </Button>
          </Link>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-cricket-gold" />
              Recent Results
            </h2>
            <div className="space-y-2">
              {recentMatches.map(match => (
                <Link key={match.id} to={`/scorecard/${match.id}`}>
                  <div className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-card-foreground text-sm">
                          {match.setup.teamA.name} vs {match.setup.teamB.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{match.result}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-card-foreground">
                          {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
                        </p>
                        <p className="text-sm font-mono font-bold text-card-foreground">
                          {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {matches.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🏟️</span>
            <h3 className="text-xl font-bold mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-6">Start your first village cricket match!</p>
            <Link to="/create">
              <Button size="lg" className="rounded-xl font-bold">
                <PlusCircle className="h-5 w-5 mr-2" />
                Create First Match
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
