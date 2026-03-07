import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Users, ChevronRight } from 'lucide-react';
import { MatchSetup } from '@/types/cricket';
import { createMatch } from '@/lib/matchStore';
import { getAllTeams, SavedTeam } from '@/lib/teamStore';
import CoinToss from '@/components/CoinToss';
import { Link } from 'react-router-dom';

const OVERS_OPTIONS = [6, 8, 10, 12, 20];

export default function CreateMatch() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [groundName, setGroundName] = useState('');
  const [totalOvers, setTotalOvers] = useState(10);
  const [customOvers, setCustomOvers] = useState('');
  const [useCustomOvers, setUseCustomOvers] = useState(false);
  const [selectedTeamA, setSelectedTeamA] = useState<SavedTeam | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<SavedTeam | null>(null);

  const teams = getAllTeams();
  const effectiveOvers = useCustomOvers ? (parseInt(customOvers) || 10) : totalOvers;

  const handleTossComplete = (tossWinner: 'A' | 'B', tossCall: 'heads' | 'tails', battingFirst: 'A' | 'B') => {
    if (!selectedTeamA || !selectedTeamB) return;

    const teamAName = selectedTeamA.name;
    const teamBName = selectedTeamB.name;

    const setup: MatchSetup = {
      id: crypto.randomUUID(),
      title: `${teamAName} vs ${teamBName} - Match`,
      groundName: groundName || 'Cricket Ground',
      villageName: '',
      date: new Date().toISOString().split('T')[0],
      totalOvers: effectiveOvers,
      teamA: { name: teamAName, players: selectedTeamA.players },
      teamB: { name: teamBName, players: selectedTeamB.players },
      tossWinner,
      tossCall,
      battingFirst,
    };

    const match = createMatch(setup);
    navigate(`/score/${match.id}`);
  };

  const stepLabels = ['Select Teams', 'Match Details', 'Coin Toss'];
  const canProceedStep0 = selectedTeamA && selectedTeamB && selectedTeamA.id !== selectedTeamB.id;
  const canProceedStep1 = true; // ground is optional

  return (
    <div className="min-h-screen pb-24">
      <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/')} className="mb-3 flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-black">Create Match</h1>
          {/* Stepper */}
          <div className="flex gap-1 mt-3 items-center">
            {stepLabels.map((label, s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${s < step ? 'bg-primary-foreground text-primary' : s === step ? 'bg-primary-foreground text-primary' : 'bg-primary-foreground/30 text-primary-foreground'}`}>
                  {s < step ? <Check className="h-4 w-4" /> : s + 1}
                </div>
                <span className={`ml-1 text-xs font-medium hidden sm:block ${s <= step ? 'text-primary-foreground' : 'text-primary-foreground/50'}`}>{label}</span>
                {s < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded ${s < step ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        {/* Step 0: Select Teams */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            {teams.length < 2 && (
              <Card className="border-dashed border-2">
                <CardContent className="py-6 text-center space-y-3">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">You need at least 2 teams to create a match.</p>
                  <Link to="/teams">
                    <Button className="rounded-xl font-bold gap-2">
                      <Users className="h-4 w-4" /> Create Teams
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {teams.length >= 2 && (
              <>
                {/* Team A Selection */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Team A</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {teams.map(team => (
                      <button
                        key={team.id}
                        disabled={selectedTeamB?.id === team.id}
                        onClick={() => setSelectedTeamA(team)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedTeamA?.id === team.id
                            ? 'border-primary bg-primary/5'
                            : selectedTeamB?.id === team.id
                              ? 'border-border opacity-40 cursor-not-allowed'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedTeamA?.id === team.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {selectedTeamA?.id === team.id ? <Check className="h-4 w-4" /> : '🏏'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{team.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {team.players.map(p => p.name).join(', ')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Team B Selection */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Team B</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {teams.map(team => (
                      <button
                        key={team.id}
                        disabled={selectedTeamA?.id === team.id}
                        onClick={() => setSelectedTeamB(team)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedTeamB?.id === team.id
                            ? 'border-primary bg-primary/5'
                            : selectedTeamA?.id === team.id
                              ? 'border-border opacity-40 cursor-not-allowed'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedTeamB?.id === team.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {selectedTeamB?.id === team.id ? <Check className="h-4 w-4" /> : '🏏'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{team.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {team.players.map(p => p.name).join(', ')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Button onClick={() => setStep(1)} disabled={!canProceedStep0} className="w-full h-12 font-bold rounded-xl text-base">
                  Next: Match Details
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 1: Match Details */}
        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Match Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedTeamA?.name} vs {selectedTeamB?.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ground Name (optional)</Label>
                <Input value={groundName} onChange={e => setGroundName(e.target.value)} placeholder="Cricket Ground" />
              </div>
              <div>
                <Label>Overs</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {OVERS_OPTIONS.map(o => (
                    <Button key={o} variant={!useCustomOvers && totalOvers === o ? 'default' : 'outline'} className="font-bold px-4" onClick={() => { setTotalOvers(o); setUseCustomOvers(false); }}>
                      {o}
                    </Button>
                  ))}
                  <Button variant={useCustomOvers ? 'default' : 'outline'} className="font-bold px-4" onClick={() => setUseCustomOvers(true)}>
                    Custom
                  </Button>
                </div>
                {useCustomOvers && (
                  <Input type="number" min={1} max={50} value={customOvers} onChange={e => setCustomOvers(e.target.value)} placeholder="Enter overs (1-50)" className="mt-2" />
                )}
              </div>
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full h-12 font-bold rounded-xl text-base">
                Next: Coin Toss 🪙
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Coin Toss */}
        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">🪙 Coin Toss</CardTitle>
            </CardHeader>
            <CardContent>
              <CoinToss
                teamAName={selectedTeamA?.name || 'Team A'}
                teamBName={selectedTeamB?.name || 'Team B'}
                onTossComplete={handleTossComplete}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
