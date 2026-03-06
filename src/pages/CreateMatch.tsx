import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Crown, Camera, Pencil, Check } from 'lucide-react';
import { MatchSetup, Player } from '@/types/cricket';
import { createMatch } from '@/lib/matchStore';
import CoinToss from '@/components/CoinToss';

const OVERS_OPTIONS = [6, 8, 10, 12, 20];

interface PlayerEntry {
  name: string;
  isCaptain: boolean;
  photoUrl?: string;
  isEditing: boolean;
}

const createDefaultPlayers = (): PlayerEntry[] =>
  Array.from({ length: 11 }, (_, i) => ({
    name: `Player ${i + 1}`,
    isCaptain: false,
    isEditing: false,
  }));

export default function CreateMatch() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [groundName, setGroundName] = useState('');
  const [villageName, setVillageName] = useState('');
  const [totalOvers, setTotalOvers] = useState(10);
  const [customOvers, setCustomOvers] = useState('');
  const [useCustomOvers, setUseCustomOvers] = useState(false);
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState<PlayerEntry[]>(createDefaultPlayers());
  const [teamBPlayers, setTeamBPlayers] = useState<PlayerEntry[]>(createDefaultPlayers());
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const [pendingPhotoTeam, setPendingPhotoTeam] = useState<'A' | 'B'>('A');
  const [pendingPhotoIndex, setPendingPhotoIndex] = useState<number>(-1);

  const toggleEdit = (team: 'A' | 'B', index: number) => {
    const update = (players: PlayerEntry[]) =>
      players.map((p, i) => (i === index ? { ...p, isEditing: !p.isEditing } : p));
    if (team === 'A') setTeamAPlayers(update(teamAPlayers));
    else setTeamBPlayers(update(teamBPlayers));
  };

  const updatePlayerName = (team: 'A' | 'B', index: number, name: string) => {
    const update = (players: PlayerEntry[]) =>
      players.map((p, i) => (i === index ? { ...p, name } : p));
    if (team === 'A') setTeamAPlayers(update(teamAPlayers));
    else setTeamBPlayers(update(teamBPlayers));
  };

  const toggleCaptain = (team: 'A' | 'B', index: number) => {
    const update = (players: PlayerEntry[]) =>
      players.map((p, i) => ({ ...p, isCaptain: i === index ? !p.isCaptain : false }));
    if (team === 'A') setTeamAPlayers(update(teamAPlayers));
    else setTeamBPlayers(update(teamBPlayers));
  };

  const handlePhotoClick = (team: 'A' | 'B', index: number) => {
    setPendingPhotoTeam(team);
    setPendingPhotoIndex(index);
    const ref = team === 'A' ? fileInputRefA : fileInputRefB;
    ref.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const update = (players: PlayerEntry[]) =>
        players.map((p, i) => (i === pendingPhotoIndex ? { ...p, photoUrl: dataUrl } : p));
      if (pendingPhotoTeam === 'A') setTeamAPlayers(update(teamAPlayers));
      else setTeamBPlayers(update(teamBPlayers));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const effectiveOvers = useCustomOvers ? (parseInt(customOvers) || 10) : totalOvers;

  const handleTossComplete = (tossWinner: 'A' | 'B', tossCall: 'heads' | 'tails', battingFirst: 'A' | 'B') => {
    const makePlayer = (entry: PlayerEntry): Player => ({
      id: crypto.randomUUID(),
      name: entry.name,
      isCaptain: entry.isCaptain,
      photoUrl: entry.photoUrl,
    });

    const setup: MatchSetup = {
      id: crypto.randomUUID(),
      title: title || `${teamAName} vs ${teamBName}`,
      groundName: groundName || 'Village Ground',
      villageName,
      date: new Date().toISOString().split('T')[0],
      totalOvers: effectiveOvers,
      teamA: { name: teamAName || 'Team A', players: teamAPlayers.map(makePlayer) },
      teamB: { name: teamBName || 'Team B', players: teamBPlayers.map(makePlayer) },
      tossWinner,
      tossCall,
      battingFirst,
    };

    const match = createMatch(setup);
    navigate(`/score/${match.id}`);
  };

  const canProceedStep0 = teamAName.trim() && teamBName.trim();

  return (
    <div className="min-h-screen pb-24">
      {/* Hidden file inputs with camera capture */}
      <input ref={fileInputRefA} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
      <input ref={fileInputRefB} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

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
                Next: Edit Players
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            {(['A', 'B'] as const).map(team => {
              const players = team === 'A' ? teamAPlayers : teamBPlayers;
              const name = team === 'A' ? teamAName : teamBName;

              return (
                <Card key={team}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{name || `Team ${team}`} Players</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {players.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                        {/* Photo with camera */}
                        <button
                          onClick={() => handlePhotoClick(team, i)}
                          className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden border-2 border-border hover:border-primary transition-colors"
                        >
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        {/* Editable name */}
                        {p.isEditing ? (
                          <Input
                            value={p.name}
                            onChange={e => updatePlayerName(team, i, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && toggleEdit(team, i)}
                            className="flex-1 h-8 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="flex-1 text-sm font-medium truncate">
                            {p.name}
                            {p.isCaptain && <span className="text-primary ml-1 text-xs font-bold">(C)</span>}
                          </span>
                        )}
                        {/* Edit / Confirm toggle */}
                        <button
                          onClick={() => toggleEdit(team, i)}
                          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                          title={p.isEditing ? 'Confirm' : 'Edit name'}
                        >
                          {p.isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        </button>
                        {/* Captain toggle */}
                        <button
                          onClick={() => toggleCaptain(team, i)}
                          className={`p-1 rounded transition-colors ${p.isCaptain ? 'text-primary' : 'text-muted-foreground hover:text-primary/60'}`}
                          title="Set as Captain"
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">Tap 📷 to add photo • ✏️ to edit name • 👑 to set captain</p>
                  </CardContent>
                </Card>
              );
            })}
            <Button onClick={() => setStep(2)} className="w-full font-bold">
              Next: Coin Toss 🪙
            </Button>
          </div>
        )}

        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">🪙 Coin Toss</CardTitle>
            </CardHeader>
            <CardContent>
              <CoinToss
                teamAName={teamAName || 'Team A'}
                teamBName={teamBName || 'Team B'}
                onTossComplete={handleTossComplete}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
