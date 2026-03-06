import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, X, Shuffle } from 'lucide-react';
import { MatchSetup, Player } from '@/types/cricket';
import { createMatch } from '@/lib/matchStore';

const OVERS_OPTIONS = [6, 10, 15, 20];

export default function CreateMatch() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [groundName, setGroundName] = useState('');
  const [villageName, setVillageName] = useState('');
  const [totalOvers, setTotalOvers] = useState(10);
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(['', '']);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(['', '']);
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [battingFirst, setBattingFirst] = useState<'A' | 'B'>('A');
  const [newPlayerA, setNewPlayerA] = useState('');
  const [newPlayerB, setNewPlayerB] = useState('');

  const addPlayer = (team: 'A' | 'B') => {
    const name = team === 'A' ? newPlayerA : newPlayerB;
    if (!name.trim()) return;
    if (team === 'A') {
      setTeamAPlayers([...teamAPlayers.filter(p => p), name.trim()]);
      setNewPlayerA('');
    } else {
      setTeamBPlayers([...teamBPlayers.filter(p => p), name.trim()]);
      setNewPlayerB('');
    }
  };

  const removePlayer = (team: 'A' | 'B', index: number) => {
    if (team === 'A') setTeamAPlayers(teamAPlayers.filter((_, i) => i !== index));
    else setTeamBPlayers(teamBPlayers.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    const makePlayer = (name: string): Player => ({
      id: crypto.randomUUID(),
      name,
    });

    const filteredA = teamAPlayers.filter(p => p.trim());
    const filteredB = teamBPlayers.filter(p => p.trim());

    if (filteredA.length < 2 || filteredB.length < 2) return;

    const setup: MatchSetup = {
      id: crypto.randomUUID(),
      title: title || `${teamAName} vs ${teamBName}`,
      groundName: groundName || 'Village Ground',
      villageName,
      date: new Date().toISOString().split('T')[0],
      totalOvers,
      teamA: { name: teamAName || 'Team A', players: filteredA.map(makePlayer) },
      teamB: { name: teamBName || 'Team B', players: filteredB.map(makePlayer) },
      tossWinner,
      battingFirst,
    };

    const match = createMatch(setup);
    navigate(`/score/${match.id}`);
  };

  const canProceedStep0 = teamAName.trim() && teamBName.trim();
  const canProceedStep1 = teamAPlayers.filter(p => p.trim()).length >= 2 && teamBPlayers.filter(p => p.trim()).length >= 2;

  return (
    <div className="min-h-screen pb-24">
      <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/')} className="mb-3 flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-black">Create Match</h1>
          <div className="flex gap-2 mt-3">
            {[0, 1, 2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        {step === 0 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Match Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Match Title (optional)</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sunday Friendly" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ground Name</Label>
                  <Input value={groundName} onChange={e => setGroundName(e.target.value)} placeholder="Village Ground" />
                </div>
                <div>
                  <Label>Village</Label>
                  <Input value={villageName} onChange={e => setVillageName(e.target.value)} placeholder="Village Name" />
                </div>
              </div>
              <div>
                <Label>Overs</Label>
                <div className="flex gap-2 mt-1">
                  {OVERS_OPTIONS.map(o => (
                    <Button
                      key={o}
                      variant={totalOvers === o ? 'default' : 'outline'}
                      className="flex-1 font-bold"
                      onClick={() => setTotalOvers(o)}
                    >
                      {o}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Team A *</Label>
                  <Input value={teamAName} onChange={e => setTeamAName(e.target.value)} placeholder="Warriors" />
                </div>
                <div>
                  <Label>Team B *</Label>
                  <Input value={teamBName} onChange={e => setTeamBName(e.target.value)} placeholder="Strikers" />
                </div>
              </div>
              <Button onClick={() => setStep(1)} disabled={!canProceedStep0} className="w-full font-bold">
                Next: Add Players
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            {['A', 'B'].map(team => {
              const players = team === 'A' ? teamAPlayers : teamBPlayers;
              const name = team === 'A' ? teamAName : teamBName;
              const newP = team === 'A' ? newPlayerA : newPlayerB;
              const setNewP = team === 'A' ? setNewPlayerA : setNewPlayerB;

              return (
                <Card key={team}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{name || `Team ${team}`} Players</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {players.filter(p => p.trim()).map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        <span className="flex-1 text-sm font-medium">{p}</span>
                        <button onClick={() => removePlayer(team as 'A' | 'B', i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newP}
                        onChange={e => setNewP(e.target.value)}
                        placeholder="Player name"
                        onKeyDown={e => e.key === 'Enter' && addPlayer(team as 'A' | 'B')}
                        className="text-sm"
                      />
                      <Button size="icon" variant="outline" onClick={() => addPlayer(team as 'A' | 'B')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Min 2 players required</p>
                  </CardContent>
                </Card>
              );
            })}
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full font-bold">
              Next: Toss
            </Button>
          </div>
        )}

        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shuffle className="h-5 w-5" /> Toss & Innings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Toss Winner</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['A', 'B'] as const).map(t => (
                    <Button
                      key={t}
                      variant={tossWinner === t ? 'default' : 'outline'}
                      onClick={() => setTossWinner(t)}
                      className="font-bold"
                    >
                      {t === 'A' ? teamAName : teamBName}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Batting First</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['A', 'B'] as const).map(t => (
                    <Button
                      key={t}
                      variant={battingFirst === t ? 'default' : 'outline'}
                      onClick={() => setBattingFirst(t)}
                      className="font-bold"
                    >
                      {t === 'A' ? teamAName : teamBName}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleStart} className="w-full h-14 text-lg font-black" size="lg">
                🏏 Start Match
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
