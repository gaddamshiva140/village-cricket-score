import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Users, Crown, Camera, Pencil, Check } from 'lucide-react';
import { getAllTeams, saveTeam, deleteTeam, getNextTeamNumber, createDefaultPlayers, SavedTeam } from '@/lib/teamStore';
import { Player } from '@/types/cricket';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<SavedTeam[]>(getAllTeams());
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState<SavedTeam | null>(null);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<Player[]>(createDefaultPlayers());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoIndex, setPendingPhotoIndex] = useState(-1);

  const refresh = () => setTeams(getAllTeams());

  const openCreate = () => {
    const num = getNextTeamNumber();
    setTeamName(`Team ${num}`);
    setPlayers(createDefaultPlayers());
    setEditTeam(null);
    setShowCreate(true);
  };

  const openEdit = (team: SavedTeam) => {
    setTeamName(team.name);
    setPlayers([...team.players]);
    setEditTeam(team);
    setShowCreate(true);
  };

  const handleSave = () => {
    const team: SavedTeam = {
      id: editTeam?.id || crypto.randomUUID(),
      name: teamName.trim() || `Team ${getNextTeamNumber()}`,
      players,
      createdAt: editTeam?.createdAt || Date.now(),
    };
    saveTeam(team);
    setShowCreate(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteTeam(id);
    refresh();
  };

  const updatePlayerName = (index: number, name: string) => {
    setPlayers(players.map((p, i) => (i === index ? { ...p, name } : p)));
  };

  const toggleCaptain = (index: number) => {
    setPlayers(players.map((p, i) => ({ ...p, isCaptain: i === index ? !p.isCaptain : false })));
  };

  const handlePhotoClick = (index: number) => {
    setPendingPhotoIndex(index);
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPlayers(players.map((p, i) => (i === pendingPhotoIndex ? { ...p, photoUrl: dataUrl } : p)));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen pb-24">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

      <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <button onClick={() => navigate('/')} className="mb-3 flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="h-6 w-6" /> My Teams
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        <Button onClick={openCreate} className="w-full h-14 text-base font-bold rounded-xl gap-2">
          <Plus className="h-5 w-5" /> Create New Team
        </Button>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">👥</span>
            <p className="text-muted-foreground">No teams yet. Create your first team!</p>
          </div>
        )}

        {teams.map(team => (
          <Card key={team.id} className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                🏏 {team.name}
                <span className="text-xs font-normal text-muted-foreground">({team.players.length} players)</span>
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(team)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(team.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {team.players.map((p, i) => (
                  <span key={p.id} className="text-xs bg-muted px-2 py-1 rounded-full">
                    {p.name}{p.isCaptain ? ' (C)' : ''}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Team Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Team Name"
                className="text-lg font-bold h-12"
              />
            </div>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <button
                    onClick={() => handlePhotoClick(i)}
                    className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden border-2 border-border hover:border-primary transition-colors"
                  >
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  {editingIdx === i ? (
                    <Input
                      value={p.name}
                      onChange={e => updatePlayerName(i, e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && setEditingIdx(null)}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium truncate">
                      {p.name}
                      {p.isCaptain && <span className="text-primary ml-1 text-xs font-bold">(C)</span>}
                    </span>
                  )}
                  <button
                    onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                  >
                    {editingIdx === i ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => toggleCaptain(i)}
                    className={`p-1 rounded transition-colors ${p.isCaptain ? 'text-primary' : 'text-muted-foreground hover:text-primary/60'}`}
                  >
                    <Crown className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">📷 Add photo • ✏️ Edit name • 👑 Set captain</p>
            <Button onClick={handleSave} className="w-full h-12 text-base font-bold rounded-xl">
              {editTeam ? 'Update Team' : 'Save Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
