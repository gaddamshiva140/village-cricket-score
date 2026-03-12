import { supabase } from '@/integrations/supabase/client';
import { PlayerRole } from '@/types/cricket';
import { t } from '@/lib/i18n';

export interface SavedPlayer {
  id: string;
  name: string;
  role?: PlayerRole;
  photoUrl?: string;
  createdAt: number;
}

export async function getAllPlayers(): Promise<SavedPlayer[]> {
  try {
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
  } catch (e) {
    console.error('Failed to fetch players:', e);
    return [];
  }
}

export async function savePlayer(player: SavedPlayer) {
  if (!player || !player.name?.trim()) {
    throw new Error('Invalid player data: name is required');
  }

  try {
    const { error } = await supabase
      .from('players')
      .upsert({
        id: player.id,
        user_id: '00000000-0000-0000-0000-000000000000',
        name: player.name.trim(),
        role: player.role || null,
        photo_url: player.photoUrl || null,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving player:', error);
      throw error;
    }
  } catch (e) {
    console.error('Failed to save player:', e);
    throw e;
  }
}

export async function deletePlayer(id: string) {
  if (!id) throw new Error('Invalid player id');
  try {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  } catch (e) {
    console.error('Failed to delete player:', e);
    throw e;
  }
}

export async function getPlayersByIds(ids: string[]): Promise<SavedPlayer[]> {
  if (!ids || ids.length === 0) return [];
  try {
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
  } catch (e) {
    console.error('Failed to fetch players by ids:', e);
    return [];
  }
}
