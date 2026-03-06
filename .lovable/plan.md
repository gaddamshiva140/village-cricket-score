

# Village Cricket Pro — Implementation Plan

## Phase 1: Core MVP (This Implementation)

### 1. App Layout & Navigation
- Mobile-first responsive layout with bottom navigation bar
- Pages: Home, Create Match, Live Scoring, Match History, Players
- Dark mode / light mode toggle
- Cricket-themed color scheme (green/gold accents)

### 2. Match Creation
- Form to set up a match: title, ground name, date, overs (6/10/20)
- Enter Team A and Team B names
- Select toss winner and batting first team
- Add player names for each team (quick entry, no accounts needed yet)

### 3. Ball-by-Ball Scoring System (Core Feature)
- Large, touch-friendly scoring buttons: 0, 1, 2, 3, 4, 6
- Wicket button with dismissal type selection
- **Extras panel**: No Ball (+0 to +6), Wide (+1 to +4), Leg Bye (+1 to +6)
- Leg byes add to team total but NOT to batsman's score
- Undo last ball, End Over, Change Batsman, Change Bowler controls
- Auto-track overs, balls, and innings transitions

### 4. Live Scoreboard
- Real-time score display: Runs/Wickets, Overs, Run Rate
- Current batsmen with runs (balls faced)
- Current bowler with figures
- Recent balls indicator (last 6 balls visual)
- This Over summary

### 5. Cricket Animations
- **FOUR!** — boundary animation with bold text
- **SIX!** — dramatic flying ball animation
- **WICKET!** — stumps breaking animation with "OUT!" text
- Milestone celebrations (50 runs, 100 runs, hat-trick)

### 6. Match Result & Scorecard
- Auto-detect match completion (all overs bowled or all out or target chased)
- Display winning team and victory margin
- Full batting scorecard (runs, balls, 4s, 6s, strike rate, dismissal)
- Full bowling scorecard (overs, runs, wickets, economy)
- Extras summary
- Player of the Match selection

### 7. Match History
- List of all completed matches
- View full scorecards for past matches
- Match result summaries

### 8. Data Storage
- All match data stored locally in browser (localStorage) for now
- No login required — anyone can start scoring immediately

## Design Style
- Mobile-first, inspired by CREX cricket app
- Large touch buttons for scoring (easy to use on field)
- Clean dark/light theme with cricket green accents
- Smooth animations and transitions

## What's Included Later (Future Phases)
- User accounts & authentication (Lovable Cloud)
- Player profiles with photo upload and career statistics
- Team management with logos and rosters
- Village leaderboards
- PDF match report generation & sharing
- Photo gallery
- Admin panel
- Auto-commentary
- Run rate graphs and analytics

