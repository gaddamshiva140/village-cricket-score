import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Match } from '@/types/cricket';
import { getOversString, getRunRate } from './matchStore';

export function generateMatchPDF(match: Match) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(match.setup.title, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${match.setup.groundName} • ${match.setup.date}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`${match.setup.totalOvers} overs match`, pageWidth / 2, 34, { align: 'center' });

  // Toss info
  const tossWinnerName = match.setup.tossWinner === 'A' ? match.setup.teamA.name : match.setup.teamB.name;
  const battingFirstName = match.setup.battingFirst === 'A' ? match.setup.teamA.name : match.setup.teamB.name;
  doc.text(`Toss: ${tossWinnerName} won and elected to ${battingFirstName === tossWinnerName ? 'bat' : 'bowl'} first`, pageWidth / 2, 40, { align: 'center' });

  // Result
  if (match.result) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0);
    doc.text(match.result, pageWidth / 2, 48, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  let yPos = 56;

  // Helper to add player photo
  const addPlayerPhoto = (photoUrl: string | undefined, x: number, y: number, size: number) => {
    if (!photoUrl) return;
    try {
      doc.addImage(photoUrl, 'JPEG', x, y, size, size);
    } catch {
      // Skip if image can't be added
    }
  };

  // Each innings
  match.innings.forEach((innings, idx) => {
    if (innings.ballEvents.length === 0 && idx === 1) return;

    // Innings header with team logo
    const teamData = innings.teamName === match.setup.teamA.name ? match.setup.teamA : match.setup.teamB;
    
    let headerX = 14;
    if (teamData.logoUrl) {
      try {
        doc.addImage(teamData.logoUrl, 'JPEG', 14, yPos - 5, 8, 8);
        headerX = 24;
      } catch {
        // skip
      }
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${innings.teamName} - ${innings.totalRuns}/${innings.totalWickets} (${getOversString(innings.totalBalls)} ov)`, headerX, yPos);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`RR: ${getRunRate(innings.totalRuns, innings.totalBalls)}`, pageWidth - 14, yPos, { align: 'right' });
    yPos += 4;

    const allPlayers = [...match.setup.teamA.players, ...match.setup.teamB.players];

    // Batting table
    const battingData = innings.battingOrder
      .filter(b => b.balls > 0 || b.isOut)
      .map(b => {
        const player = allPlayers.find(p => p.id === b.playerId);
        const captainMark = player?.isCaptain ? ' (C)' : '';
        const status = b.isOut ? b.dismissalType || 'out' : 'not out';
        const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '-';
        return [b.playerName + captainMark, status, String(b.runs), String(b.balls), String(b.fours), String(b.sixes), sr];
      });

    autoTable(doc, {
      startY: yPos,
      head: [['Batter', '', 'R', 'B', '4s', '6s', 'SR']],
      body: battingData,
      theme: 'grid',
      headStyles: { fillColor: [34, 87, 50], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30, fontStyle: 'italic', textColor: [120, 120, 120] },
        2: { cellWidth: 15, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 15, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 2;

    // Did Not Bat
    const dnb = innings.battingOrder.filter(b => b.balls === 0 && !b.isOut);
    if (dnb.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Did not bat: ${dnb.map(b => b.playerName).join(', ')}`, 14, yPos + 4);
      doc.setFont('helvetica', 'normal');
      yPos += 6;
    }

    // Extras
    doc.setFontSize(8);
    doc.text(`Extras: ${innings.extras.total} (WD: ${innings.extras.wides}, NB: ${innings.extras.noBalls}, LB: ${innings.extras.legByes}, B: ${innings.extras.byes})`, 14, yPos + 4);
    yPos += 8;

    // Bowling table
    const bowlingTeamPlayers = idx === 0
      ? (match.setup.battingFirst === 'A' ? match.setup.teamB.players : match.setup.teamA.players)
      : (match.setup.battingFirst === 'A' ? match.setup.teamA.players : match.setup.teamB.players);

    const bowlingData = innings.bowlingFigures
      .filter(b => b.overs > 0 || b.balls > 0)
      .map(b => {
        const bowlerPlayer = bowlingTeamPlayers.find(p => p.id === b.playerId);
        const captainMark = bowlerPlayer?.isCaptain ? ' (C)' : '';
        const totalBalls = b.overs * 6 + b.balls;
        const econ = totalBalls > 0 ? ((b.runs / totalBalls) * 6).toFixed(1) : '-';
        return [b.playerName + captainMark, `${b.overs}.${b.balls}`, String(b.runs), String(b.wickets), econ];
      });

    autoTable(doc, {
      startY: yPos,
      head: [['Bowler', 'O', 'R', 'W', 'Econ']],
      body: bowlingData,
      theme: 'grid',
      headStyles: { fillColor: [34, 87, 50], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  });

  // Player of the Match with photo
  if (match.playerOfTheMatchName) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Player of the Match', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Try to add player photo
    if (match.playerOfTheMatch) {
      const allPlayers = [...match.setup.teamA.players, ...match.setup.teamB.players];
      const potmPlayer = allPlayers.find(p => p.id === match.playerOfTheMatch);
      if (potmPlayer?.photoUrl) {
        try {
          doc.addImage(potmPlayer.photoUrl, 'JPEG', pageWidth / 2 - 10, yPos, 20, 20);
          yPos += 24;
        } catch {
          // skip
        }
      }
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Player of the Match: ${match.playerOfTheMatchName}`, pageWidth / 2, yPos, { align: 'center' });
  }

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by Village Cricket Pro', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  doc.save(`${match.setup.title.replace(/\s+/g, '_')}_scorecard.pdf`);
}
