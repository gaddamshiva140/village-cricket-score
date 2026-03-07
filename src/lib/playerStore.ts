import { Player, PlayerRole } from '@/types/cricket';

const PLAYERS_KEY = 'village_cricket_players';

export interface SavedPlayer extends Player {
  createdAt: number;
}

export function getAllPlayers(): SavedPlayer[] {
  const data = localStorage.getItem(PLAYERS_KEY);
  return data ? JSON.parse(data) : [];
}

function savePlayers(players: SavedPlayer[]) {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function savePlayer(player: SavedPlayer) {
  const players = getAllPlayers();
  const idx = players.findIndex(p => p.id === player.id);
  if (idx >= 0) players[idx] = player;
  else players.unshift(player);
  savePlayers(players);
}

export function deletePlayer(id: string) {
  savePlayers(getAllPlayers().filter(p => p.id !== id));
}

export function getPlayersByIds(ids: string[]): SavedPlayer[] {
  const all = getAllPlayers();
  return ids.map(id => all.find(p => p.id === id)).filter(Boolean) as SavedPlayer[];
}
