import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InningsData } from '@/types/cricket';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MatchAnalyticsProps {
  innings: InningsData;
  label: string;
}

export default function MatchAnalytics({ innings, label }: MatchAnalyticsProps) {
  // Player runs bar chart
  const playerRuns = innings.battingOrder
    .filter(b => b.balls > 0 || b.isOut)
    .map(b => ({
      name: b.playerName.length > 8 ? b.playerName.substring(0, 8) + '…' : b.playerName,
      runs: b.runs,
    }));

  if (playerRuns.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground">{label} - Player Runs</h3>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Player Runs</CardTitle>
        </CardHeader>
        <CardContent className="h-52 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={playerRuns}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
