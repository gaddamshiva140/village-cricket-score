import { supabase } from '@/integrations/supabase/client';
import { PlayerRole } from '@/types/cricket';

export interface SavedPlayer {
  id: string;
  name: string;
  role?: PlayerRole;
  photoUrl?: string;
  createdAt: number;
}

export async function getAllPlayers(): Promise<SavedPlayer[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    role: p.role as PlayerRole | undefined,
    photoUrl: p.photo_url || undefined,
    createdAt: new Date(p.created_at).getTime(),
  }));
}

export async function savePlayer(player: SavedPlayer) {
  const { error } = await supabase
    .from('players')
    .upsert({
      id: player.id,
      user_id: 'anonymous',
      name: player.name,
      role: player.role || null,
      photo_url: player.photoUrl || null,
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error saving player:', error);
    throw error;
  }
}

export async function deletePlayer(id: string) {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}

export async function getPlayersByIds(ids: string[]): Promise<SavedPlayer[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching players by ids:', error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    role: p.role as PlayerRole | undefined,
    photoUrl: p.photo_url || undefined,
    createdAt: new Date(p.created_at).getTime(),
  }));
}
