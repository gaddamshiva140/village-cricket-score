import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/cricket';

export interface SavedTeam {
  id: string;
  name: string;
  players: Player[];
  logoUrl?: string;
  createdAt: number;
}

export async function getAllTeams(): Promise<SavedTeam[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }

  const allPlayerIds = (data || []).flatMap(t => t.player_ids || []);
  let playerMap: Record<string, Player> = {};

  if (allPlayerIds.length > 0) {
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .in('id', allPlayerIds);

    if (players) {
      playerMap = Object.fromEntries(players.map(p => [p.id, {
        id: p.id,
        name: p.name,
        role: p.role || undefined,
        photoUrl: p.photo_url || undefined,
      } as Player]));
    }
  }

  return (data || []).map(t => ({
    id: t.id,
    name: t.name,
    players: (t.player_ids || []).map((pid: string) => playerMap[pid]).filter(Boolean),
    logoUrl: t.logo_url || undefined,
    createdAt: new Date(t.created_at).getTime(),
  }));
}

export async function saveTeam(team: SavedTeam) {
  const { error } = await supabase
    .from('teams')
    .upsert({
      id: team.id,
      user_id: '00000000-0000-0000-0000-000000000000',
      name: team.name,
      player_ids: team.players.map(p => p.id),
      logo_url: team.logoUrl || null,
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error saving team:', error);
    throw error;
  }
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}

export async function getNextTeamNumber(): Promise<number> {
  const teams = await getAllTeams();
  let max = 0;
  teams.forEach(t => {
    const match = t.name.match(/^Team (\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1]));
  });
  return max + 1;
}
