import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Camera, Pencil, Check, User } from 'lucide-react';
import { getAllPlayers, savePlayer, deletePlayer, SavedPlayer } from '@/lib/playerStore';
import { PlayerRole } from '@/types/cricket';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLES: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];

export default function Players() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<SavedPlayer[]>(getAllPlayers());
  const [showDialog, setShowDialog] = useState(false);
  const [editPlayer, setEditPlayer] = useState<SavedPlayer | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<PlayerRole | ''>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setPlayers(getAllPlayers());

  const openCreate = () => {
    setEditPlayer(null);
    setName('');
    setRole('');
    setPhotoUrl('');
    setShowDialog(true);
  };

  const openEdit = (p: SavedPlayer) => {
    setEditPlayer(p);
    setName(p.name);
    setRole(p.role || '');
    setPhotoUrl(p.photoUrl || '');
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const player: SavedPlayer = {
      id: editPlayer?.id || crypto.randomUUID(),
      name: name.trim(),
      role: role || undefined,
      photoUrl: photoUrl || undefined,
      createdAt: editPlayer?.createdAt || Date.now(),
    };
    savePlayer(player);
    setShowDialog(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deletePlayer(id);
    refresh();
  };

  const handlePhoto = () => fileRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen pb-24">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

      <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <button onClick={() => navigate('/')} className="mb-3 flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <User className="h-6 w-6" /> Player Profiles
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        <Button onClick={openCreate} className="w-full h-14 text-base font-bold rounded-xl gap-2">
          <Plus className="h-5 w-5" /> Add New Player
        </Button>

        {players.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">🧑</span>
            <p className="text-muted-foreground">No players yet. Add your first player!</p>
          </div>
        )}

        <div className="space-y-2">
          {players.map(p => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden border-2 border-border">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.name}</p>
                  {p.role && <p className="text-xs text-muted-foreground">{p.role}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editPlayer ? 'Edit Player' : 'Add Player'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex justify-center">
              <button onClick={handlePhoto} className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors">
                {photoUrl ? (
                  <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-center text-muted-foreground">Tap to add photo (optional)</p>

            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Player Name"
              className="h-12 text-base font-bold"
              autoFocus
            />

            <Select value={role} onValueChange={v => setRole(v as PlayerRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role (optional)" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSave} disabled={!name.trim()} className="w-full h-12 text-base font-bold rounded-xl">
              {editPlayer ? 'Update Player' : 'Save Player'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
