import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Users, Crown, Pencil, User, X } from 'lucide-react';
import { getAllTeams, saveTeam, deleteTeam, getNextTeamNumber, SavedTeam } from '@/lib/teamStore';
import { getAllPlayers, SavedPlayer } from '@/lib/playerStore';
import { Player } from '@/types/cricket';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

export default function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<SavedTeam[]>(getAllTeams());
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState<SavedTeam | null>(null);
  const [teamName, setTeamName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  const allPlayers = getAllPlayers();
  const refresh = () => setTeams(getAllTeams());

  const openCreate = () => {
    setTeamName(`Team ${getNextTeamNumber()}`);
    setSelectedPlayers([]);
    setEditTeam(null);
    setShowCreate(true);
  };

  const openEdit = (team: SavedTeam) => {
    setTeamName(team.name);
    setSelectedPlayers([...team.players]);
    setEditTeam(team);
    setShowCreate(true);
  };

  const handleSave = () => {
    if (selectedPlayers.length < 2) return;
    const team: SavedTeam = {
      id: editTeam?.id || crypto.randomUUID(),
      name: teamName.trim() || `Team ${getNextTeamNumber()}`,
      players: selectedPlayers,
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

  const toggleCaptain = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.map(p => ({
      ...p,
      isCaptain: p.id === playerId ? !p.isCaptain : false,
    })));
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const addPlayerFromPool = (player: SavedPlayer) => {
    if (selectedPlayers.find(p => p.id === player.id)) return;
    setSelectedPlayers([...selectedPlayers, {
      id: player.id,
      name: player.name,
      role: player.role,
      photoUrl: player.photoUrl,
      isCaptain: false,
    }]);
  };

  const availablePlayers = allPlayers.filter(p => !selectedPlayers.find(sp => sp.id === p.id));

  return (
    <div className="min-h-screen pb-24">
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

        {allPlayers.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="py-6 text-center space-y-3">
              <User className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Create player profiles first before building teams.</p>
              <Link to="/players">
                <Button className="rounded-xl font-bold gap-2">
                  <Plus className="h-4 w-4" /> Add Players
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {teams.length === 0 && allPlayers.length > 0 && (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">👥</span>
            <p className="text-muted-foreground">No teams yet. Create your first team!</p>
          </div>
        )}

        {teams.map(team => {
          const captain = team.players.find(p => p.isCaptain);
          return (
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
                {captain && (
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Crown className="h-3 w-3 text-secondary" /> Captain: <span className="font-bold text-foreground">{captain.name}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {team.players.map(p => (
                    <span key={p.id} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${p.isCaptain ? 'bg-secondary/20 border border-secondary/50 font-bold' : 'bg-muted'}`}>
                      {p.photoUrl && <img src={p.photoUrl} className="w-4 h-4 rounded-full object-cover" />}
                      {p.name}{p.isCaptain ? ' (C)' : ''}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Team Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Team Name"
              className="text-lg font-bold h-12"
            />

            {/* Selected Players - tap to make captain */}
            <div>
              <p className="text-sm font-medium mb-1">Team Players ({selectedPlayers.length})</p>
              <p className="text-xs text-muted-foreground mb-2">Tap a player card to make them captain</p>
              {selectedPlayers.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 text-center">No players added yet. Add from below.</p>
              )}
              <div className="space-y-1">
                {selectedPlayers.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => toggleCaptain(p.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all ${
                      p.isCaptain
                        ? 'bg-secondary/15 border-2 border-secondary shadow-sm'
                        : 'bg-muted border-2 border-transparent hover:border-secondary/30'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                      p.isCaptain ? 'ring-2 ring-secondary ring-offset-1' : 'border border-border'
                    } bg-secondary/10`}>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium truncate">
                      {p.name}
                      {p.role && <span className="text-xs text-muted-foreground ml-1">({p.role})</span>}
                    </span>
                    {p.isCaptain && (
                      <span className="flex items-center gap-1 text-xs font-bold text-secondary">
                        <Crown className="h-4 w-4" /> Captain
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removePlayer(p.id); }}
                      className="p-1 rounded text-destructive/60 hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Players */}
            <div>
              <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => setShowPlayerPicker(true)}>
                <Plus className="h-4 w-4" /> Add Players from Pool
              </Button>
            </div>

            {selectedPlayers.length < 2 && (
              <p className="text-xs text-destructive text-center">Minimum 2 players required</p>
            )}

            <Button onClick={handleSave} disabled={selectedPlayers.length < 2} className="w-full h-12 text-base font-bold rounded-xl">
              {editTeam ? 'Update Team' : 'Save Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Player Picker Dialog */}
      <Dialog open={showPlayerPicker} onOpenChange={setShowPlayerPicker}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Players</DialogTitle>
          </DialogHeader>
          {availablePlayers.length === 0 && (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                {allPlayers.length === 0 ? 'No player profiles found.' : 'All players are already in the team.'}
              </p>
              {allPlayers.length === 0 && (
                <Link to="/players">
                  <Button className="rounded-xl font-bold gap-2">
                    <Plus className="h-4 w-4" /> Create Players
                  </Button>
                </Link>
              )}
            </div>
          )}
          <div className="space-y-1">
            {availablePlayers.map(p => (
              <button
                key={p.id}
                onClick={() => addPlayerFromPool(p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-accent transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{p.name}</p>
                  {p.role && <p className="text-xs text-muted-foreground">{p.role}</p>}
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
