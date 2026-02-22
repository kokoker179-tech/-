
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const APP_TITLE = "نظام الملاك روفائيل";
export const GRADES = ['أولى ثانوي', 'تانية ثانوي', 'تالتة ثانوي'];

export const DEFAULT_POINT_SYSTEM = {
  confession: 20,
  tasbeha: 20,
  meeting: 20,
  weeklyCompetition: 25,
  liturgy: 50,
  communion: 50,
  exodusCompetition: 100,
  memorizationPart: 25,
  fasting: 50
};

export const getActiveFriday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 5 ? 0 : (day < 5 ? -2 : 5));
  const friday = new Date(d.setDate(diff));
  return friday.toISOString().split('T')[0];
};

export const getRecentFridays = (count = 4) => {
  const fridays = [];
  let current = new Date(getActiveFriday());
  for (let i = 0; i < count; i++) {
    fridays.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() - 7);
  }
  return fridays;
};

export const formatDateArabic = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export const isPastDeadline = (dateStr: string) => {
  const deadline = new Date(dateStr);
  deadline.setHours(23, 59, 59);
  return new Date() > deadline;
};

// PDF Generation Functions
export const generateMarathonWeeklyReport = async (group: any, marathon: any, weekDate: string, allYouth: any[], allPoints: any[], allAttendance: any[]) => {
  const reportContainer = document.createElement('div');
  reportContainer.style.width = '800px';
  reportContainer.style.padding = '40px';
  reportContainer.dir = 'rtl';
  reportContainer.style.fontFamily = "'Cairo', sans-serif";
  reportContainer.style.backgroundColor = '#ffffff';

  const groupYouth = allYouth.filter(y => group.youthIds.includes(y.id));
  const weekPoints = allPoints.filter(p => p.marathonId === marathon.id && p.weekDate === weekDate);
  const weekAttendance = allAttendance.filter(r => r.date === weekDate);

  const rows = groupYouth.map(y => {
    const yPoints = weekPoints.filter(p => p.youthId === y.id);
    const total = yPoints.reduce((sum, p) => sum + p.points, 0);
    const att = weekAttendance.find(r => r.youthId === y.id);

    const activities = Object.keys(marathon.pointSystem).map(act => {
      const p = yPoints.find(point => point.activity === act);
      if (p) return `<span style="color: #10b981;">✅ ${p.points} (${p.reason})</span>`;
      
      let reason = "لم يشارك";
      if (act === 'liturgy' && !att?.liturgy) reason = "غائب عن القداس";
      if (act === 'meeting' && !att?.meeting) reason = "غائب عن الاجتماع";
      if (act === 'confession' && !att?.confession) reason = "لم يعترف هذا الأسبوع";
      
      return `<span style="color: #ef4444;">❌ 0 (${reason})</span>`;
    }).join('<br/>');

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: bold;">${y.name}</td>
        <td style="padding: 12px; font-size: 10px;">${activities}</td>
        <td style="padding: 12px; font-weight: 900; color: #2563eb; text-align: center;">${total}</td>
      </tr>
    `;
  }).join('');

  reportContainer.innerHTML = `
    <div style="border: 4px solid #2563eb; padding: 20px; border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">تقرير الأسبوع - ${group.name}</h1>
        <p style="font-weight: bold; color: #64748b;">${marathon.name} | الأسبوع: ${formatDateArabic(weekDate)}</p>
        <p style="color: #64748b;">الخادم: ${group.servantName}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #2563eb;">
            <th style="padding: 12px; text-align: right;">اسم الشاب</th>
            <th style="padding: 12px; text-align: right;">الأنشطة والنقاط</th>
            <th style="padding: 12px; text-align: center;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
        مطور بواسطة: كيرلس صفوت | Angel Raphael Digital Systems
      </div>
    </div>
  `;

  document.body.appendChild(reportContainer);
  const canvas = await html2canvas(reportContainer, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(`تقرير_أسبوع_${group.name}_${weekDate}.pdf`);
  document.body.removeChild(reportContainer);
};

export const generateMarathonFinalReport = async (marathon: any, group: any, allYouth: any[], allPoints: any[]) => {
  const reportContainer = document.createElement('div');
  reportContainer.style.width = '800px';
  reportContainer.style.padding = '40px';
  reportContainer.dir = 'rtl';
  reportContainer.style.fontFamily = "'Cairo', sans-serif";
  reportContainer.style.backgroundColor = '#ffffff';

  const groupYouth = allYouth.filter(y => group.youthIds.includes(y.id));
  const marathonPoints = allPoints.filter(p => p.marathonId === marathon.id && group.youthIds.includes(p.youthId));
  const totalPoints = marathonPoints.reduce((sum, p) => sum + p.points, 0);
  const isWinner = marathon.winnerGroupId === group.id;

  const weeklyBreakdown = marathonPoints.reduce((acc: any, p) => {
    if (!acc[p.weekDate]) acc[p.weekDate] = 0;
    acc[p.weekDate] += p.points;
    return acc;
  }, {});

  const weeklyRows = Object.entries(weeklyBreakdown).map(([date, pts]) => `
    <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px dashed #e2e8f0;">
      <span style="font-weight: bold;">${formatDateArabic(date)}</span>
      <span style="color: #2563eb; font-weight: 900;">${pts} نقطة</span>
    </div>
  `).join('');

  reportContainer.innerHTML = `
    <div style="border: 8px solid ${isWinner ? '#fbbf24' : '#2563eb'}; padding: 40px; border-radius: 30px; position: relative;">
      ${isWinner ? '<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: #fbbf24; color: #92400e; padding: 10px 40px; border-radius: 20px; font-weight: 900; font-size: 24px; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">بطل الماراثون 🏆</div>' : ''}
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="font-size: 40px; color: ${isWinner ? '#92400e' : '#2563eb'}; margin: 0;">التقرير الختامي للمجموعة</h1>
        <h2 style="font-size: 32px; margin: 10px 0;">${group.name}</h2>
        <p style="font-size: 18px; color: #64748b;">${marathon.name}</p>
      </div>

      <div style="background: ${isWinner ? '#fef3c7' : '#f1f5f9'}; padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 40px;">
        <p style="margin: 0; color: #64748b; font-weight: bold;">إجمالي النقاط المحصلة</p>
        <p style="font-size: 60px; font-weight: 900; color: ${isWinner ? '#92400e' : '#2563eb'}; margin: 0;">${totalPoints}</p>
      </div>

      <div style="margin-bottom: 40px;">
        <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">التحليل الأسبوعي للنقاط</h3>
        ${weeklyRows}
      </div>

      <div style="text-align: center; margin-top: 60px; border-top: 1px solid #e2e8f0; pt: 20px;">
        <p style="font-weight: bold; color: #64748b;">مطور بواسطة: كيرلس صفوت</p>
        <p style="font-size: 10px; color: #94a3b8;">Angel Raphael Digital Systems | 2026</p>
      </div>
    </div>
  `;

  document.body.appendChild(reportContainer);
  const canvas = await html2canvas(reportContainer, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(`التقرير_الختامي_${group.name}.pdf`);
  document.body.removeChild(reportContainer);
};

export const generateFullReportPDF = async (youthList: any[], records: any[]) => {
  const doc = new jsPDF();
  doc.text("تقرير شامل لجميع الشباب", 10, 10);
  // Simplified for now
  youthList.forEach((y, i) => {
    doc.text(`${i+1}. ${y.name} - ${y.stats.percentage}%`, 10, 20 + (i * 10));
  });
  doc.save("التقرير_الشامل.pdf");
};
