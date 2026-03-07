import { Player } from '@/types/cricket';

const TEAMS_KEY = 'village_cricket_teams';

export interface SavedTeam {
  id: string;
  name: string;
  players: Player[];
  createdAt: number;
}

export function getAllTeams(): SavedTeam[] {
  const data = localStorage.getItem(TEAMS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveTeams(teams: SavedTeam[]) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

export function saveTeam(team: SavedTeam) {
  const teams = getAllTeams();
  const idx = teams.findIndex(t => t.id === team.id);
  if (idx >= 0) teams[idx] = team;
  else teams.unshift(team);
  saveTeams(teams);
}

export function deleteTeam(id: string) {
  saveTeams(getAllTeams().filter(t => t.id !== id));
}

export function getNextTeamNumber(): number {
  const teams = getAllTeams();
  let max = 0;
  teams.forEach(t => {
    const match = t.name.match(/^Team (\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1]));
  });
  return max + 1;
}
