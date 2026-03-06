import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InningsData } from '@/types/cricket';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MatchAnalyticsProps {
  innings: InningsData;
  label: string;
}

export default function MatchAnalytics({ innings, label }: MatchAnalyticsProps) {
  // Run progress per over (line chart)
  const runProgressData: { over: number; runs: number }[] = [];
  let cumRuns = 0;
  const ballsByOver = new Map<number, number[]>();
  
  innings.ballEvents.forEach(event => {
    const overNum = event.overNumber;
    if (!ballsByOver.has(overNum)) ballsByOver.set(overNum, []);
    ballsByOver.get(overNum)!.push(event.runs);
  });

  const sortedOvers = Array.from(ballsByOver.keys()).sort((a, b) => a - b);
  sortedOvers.forEach(over => {
    const overRuns = ballsByOver.get(over)!.reduce((a, b) => a + b, 0);
    cumRuns += overRuns;
    runProgressData.push({ over: over + 1, runs: cumRuns });
  });

  // Runs per over (bar chart)
  const runsPerOver = sortedOvers.map(over => ({
    over: `Ov ${over + 1}`,
    runs: ballsByOver.get(over)!.reduce((a, b) => a + b, 0),
  }));

  // Run distribution (pie chart)
  let singles = 0, twos = 0, threes = 0, fours = 0, sixes = 0, extras = 0;
  innings.ballEvents.forEach(e => {
    extras += e.extras;
    if (e.ballType === 'normal' || e.ballType === 'noball') {
      if (e.batsmanRuns === 1) singles++;
      else if (e.batsmanRuns === 2) twos++;
      else if (e.batsmanRuns === 3) threes++;
      else if (e.batsmanRuns === 4) fours++;
      else if (e.batsmanRuns === 6) sixes++;
    }
  });

  const pieData = [
    { name: 'Singles', value: singles, color: 'hsl(var(--primary))' },
    { name: 'Twos', value: twos, color: 'hsl(var(--secondary))' },
    { name: 'Threes', value: threes, color: 'hsl(var(--accent-foreground))' },
    { name: 'Fours', value: fours * 4, color: 'hsl(var(--cricket-sky))' },
    { name: 'Sixes', value: sixes * 6, color: 'hsl(var(--cricket-gold))' },
    { name: 'Extras', value: extras, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  if (innings.ballEvents.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground">{label} - Analytics</h3>

      {/* Run Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Run Progress</CardTitle>
        </CardHeader>
        <CardContent className="h-48 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={runProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="over" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="runs" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Runs per Over */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Runs per Over</CardTitle>
        </CardHeader>
        <CardContent className="h-48 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={runsPerOver}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="over" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Run Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Run Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-52 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
