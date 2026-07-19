import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Horse, TrainingSession } from '../types';

export async function exportToPDF(
  sessions: TrainingSession[],
  horses: Horse[],
  chartContainerId: string
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- Header ---
  pdf.setFillColor(99, 102, 241);
  pdf.rect(0, 0, pageWidth, 28, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PicPocket - Training Log', margin, 18);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Exported on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    pageWidth - margin,
    18,
    { align: 'right' }
  );
  y = 38;

  // --- Summary stats ---
  const totalMinutes = sessions.reduce((s, r) => s + r.durationMinutes, 0);
  const avgScore =
    sessions.length > 0
      ? (sessions.reduce((s, r) => s + r.performanceScore, 0) / sessions.length).toFixed(1)
      : 'N/A';

  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary', margin, y);
  y += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total Sessions: ${sessions.length}`, margin, y);
  pdf.text(
    `Total Riding Time: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
    margin + contentWidth / 3,
    y
  );
  pdf.text(`Avg. Performance: ${avgScore}/10`, margin + (contentWidth * 2) / 3, y);
  y += 10;

  // --- Chart screenshot ---
  const chartEl = document.getElementById(chartContainerId);
  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const aspectRatio = canvas.width / canvas.height;
      const imgWidth = contentWidth;
      const imgHeight = imgWidth / aspectRatio;
      if (y + imgHeight > 275) {
        pdf.addPage();
        y = margin;
      }
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
      y += imgHeight + 8;
    } catch {
      // skip chart on error
    }
  }

  // --- Session table ---
  if (y + 10 > 275) {
    pdf.addPage();
    y = margin;
  }
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);
  pdf.text('Session History', margin, y);
  y += 6;

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const colWidths = [30, 30, 30, 18, 12, 60];
  const headers = ['Date', 'Horse', 'Discipline', 'Duration', 'Score', 'Notes'];

  pdf.setFillColor(224, 231, 255);
  pdf.rect(margin, y, contentWidth, 7, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  let colX = margin + 2;
  headers.forEach((h, i) => {
    pdf.text(h, colX, y + 5);
    colX += colWidths[i];
  });
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  sorted.forEach((session, rowIdx) => {
    if (y + 8 > 278) {
      pdf.addPage();
      y = margin;
    }
    const horse = horses.find((h) => h.id === session.horseId);
    const dateStr = new Date(session.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (rowIdx % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, 7, 'F');
    }

    pdf.setTextColor(55, 65, 81);
    colX = margin + 2;
    const cells = [
      dateStr,
      horse?.name ?? 'Unknown',
      session.discipline,
      `${session.durationMinutes} min`,
      `${session.performanceScore}/10`,
      session.notes.substring(0, 60) + (session.notes.length > 60 ? '...' : ''),
    ];
    cells.forEach((cell, i) => {
      pdf.text(cell, colX, y + 5, { maxWidth: colWidths[i] - 3 });
      colX += colWidths[i];
    });

    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y + 7, margin + contentWidth, y + 7);
    y += 7;
  });

  // --- Session photos ---
  const sessionsWithPhotos = sorted.filter((s) => s.photoDataUrl);
  if (sessionsWithPhotos.length > 0) {
    pdf.addPage();
    y = margin;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Session Photos', margin, y);
    y += 8;

    const photosPerRow = 3;
    const photoSize = contentWidth / photosPerRow - 4;

    sessionsWithPhotos.forEach((session, idx) => {
      if (!session.photoDataUrl) return;
      const col = idx % photosPerRow;
      const x = margin + col * (photoSize + 4);
      if (col === 0 && idx !== 0) y += photoSize + 12;
      if (y + photoSize > 270) {
        pdf.addPage();
        y = margin;
      }
      try {
        pdf.addImage(session.photoDataUrl, 'JPEG', x, y, photoSize, photoSize);
      } catch {
        // skip invalid image
      }
      const horse = horses.find((h) => h.id === session.horseId);
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      const caption = `${horse?.name ?? ''} - ${new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      pdf.text(caption, x + photoSize / 2, y + photoSize + 4, { align: 'center' });
    });
  }

  pdf.save('training-log.pdf');
}
