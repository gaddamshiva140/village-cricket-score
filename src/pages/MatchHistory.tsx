import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Trash2, Star } from 'lucide-react';
import { getAllMatches, getOversString, deleteMatch } from '@/lib/matchStore';
import { useState } from 'react';
import { Match } from '@/types/cricket';

export default function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>(getAllMatches());

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMatch(id);
    setMatches(getAllMatches());
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <Link to="/" className="mb-3 flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="text-2xl font-black">Match History</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📋</span>
            <p className="text-muted-foreground mb-4">No matches recorded yet</p>
            <Link to="/create">
              <Button>Create a Match</Button>
            </Link>
          </div>
        ) : (
          matches.map(match => (
            <Link key={match.id} to={match.status === 'live' ? `/score/${match.id}` : `/scorecard/${match.id}`}>
              <Card className="p-4 hover:bg-accent transition-colors animate-fade-in mb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {match.status === 'live' && (
                        <span className="flex h-2 w-2">
                          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-destructive opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                        </span>
                      )}
                      <h3 className="font-bold text-sm">{match.setup.teamA.name} vs {match.setup.teamB.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {match.setup.groundName} • {match.setup.date} • {match.setup.totalOvers} overs
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-sm font-mono">
                        {match.innings[0].teamName}: {match.innings[0].totalRuns}/{match.innings[0].totalWickets} ({getOversString(match.innings[0].totalBalls)})
                      </p>
                      {match.innings[1].ballEvents.length > 0 && (
                        <p className="text-sm font-mono">
                          {match.innings[1].teamName}: {match.innings[1].totalRuns}/{match.innings[1].totalWickets} ({getOversString(match.innings[1].totalBalls)})
                        </p>
                      )}
                    </div>
                    {match.result && (
                      <div className="flex items-center gap-1 mt-2">
                        <Trophy className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold text-primary">{match.result}</span>
                      </div>
                    )}
                    {match.playerOfTheMatchName && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-primary" />
                        <span className="text-xs text-muted-foreground">POTM: {match.playerOfTheMatchName}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(match.id, e)}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
