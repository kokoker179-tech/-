
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

export const SYSTEM_START_DATE = '2026-02-27';

export const getActiveFriday = () => {
  const d = new Date();
  const day = d.getDay();
  
  // Shift to the NEXT Friday if today is Saturday (6) through Thursday (4)
  // If today is Friday (5), diff is 0
  const diffToNextFriday = (5 - day + 7) % 7;
  d.setDate(d.getDate() + diffToNextFriday);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const result = `${year}-${month}-${date}`;
  
  // Enforce system start date
  if (result < SYSTEM_START_DATE) return SYSTEM_START_DATE;
  return result;
};

export const getRecentFridays = (count = 10) => {
  const fridays = [];
  let current = new Date(getActiveFriday());
  
  for (let i = 0; i < count; i++) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const date = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;
    
    if (dateStr >= SYSTEM_START_DATE) {
      fridays.push(dateStr);
    }
    
    current.setDate(current.getDate() - 7);
  }
  return fridays;
};

export const getAllFridaysSinceStart = () => {
  const fridays = [];
  let current = new Date(getActiveFriday());
  
  while (true) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const date = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;
    
    if (dateStr < SYSTEM_START_DATE) {
      break;
    }
    
    fridays.push(dateStr);
    current.setDate(current.getDate() - 7);
  }
  
  if (fridays.length === 0) {
    fridays.push(SYSTEM_START_DATE);
  }
  
  return fridays;
};

export const formatDateArabic = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export const isPastDeadline = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const deadline = new Date(year, month - 1, day, 23, 59, 59);
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

    const activities = yPoints.map(p => {
      let activityName = "";
      switch(p.activity) {
        case 'liturgy': activityName = "قداس"; break;
        case 'meeting': activityName = "اجتماع"; break;
        case 'confession': activityName = "اعتراف"; break;
        case 'tasbeha': activityName = "تسبحة"; break;
        case 'weeklyCompetition': activityName = "مسابقة"; break;
        case 'communion': activityName = "تناول"; break;
        case 'exodusCompetition': activityName = "سفر الخروج"; break;
        case 'memorizationPart': activityName = "حفظ"; break;
        case 'fasting': activityName = "صوم"; break;
      }
      return `<div style="margin-bottom: 4px;"><span style="color: #10b981; font-weight: bold;">✅ ${activityName}:</span> <span style="color: #64748b;">${p.points}ن (${p.reason || 'بدون سبب'})</span></div>`;
    }).join('');

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 15px; font-weight: bold; vertical-align: top; width: 30%;">${y.name}</td>
        <td style="padding: 15px; font-size: 11px; vertical-align: top;">${activities || '<span style="color: #94a3b8;">لم يتم تسجيل نقاط هذا الأسبوع</span>'}</td>
        <td style="padding: 15px; font-weight: 900; color: #2563eb; text-align: center; vertical-align: top; font-size: 18px;">${total}</td>
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
        Developer by: kerolos sfwat | Angel Raphael Digital Systems
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
        <p style="font-weight: bold; color: #64748b;">Developer by: kerolos sfwat</p>
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
  const pdf = new jsPDF('l', 'mm', 'a4');
  const CHUNK_SIZE = 22; // Increased to fill the page better in landscape
  
  for (let i = 0; i < youthList.length; i += CHUNK_SIZE) {
    const chunk = youthList.slice(i, i + CHUNK_SIZE);
    const reportContainer = document.createElement('div');
    reportContainer.style.width = '1120px'; // Better fit for A4 Landscape
    reportContainer.style.padding = '30px';
    reportContainer.dir = 'rtl';
    reportContainer.style.fontFamily = "'Cairo', sans-serif";
    reportContainer.style.backgroundColor = '#ffffff';

    const rows = chunk.map((y, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; text-align: center; font-size: 14px;">${i + idx + 1}</td>
        <td style="padding: 10px; font-weight: bold; font-size: 14px;">${y.name}</td>
        <td style="padding: 10px; text-align: center; font-size: 14px;">${y.code}</td>
        <td style="padding: 10px; text-align: center; font-size: 14px;">${y.phone || '—'}</td>
        <td style="padding: 10px; font-size: 13px;">${y.address || '—'}</td>
        <td style="padding: 10px; text-align: center; font-size: 14px;">${y.grade}</td>
        <td style="padding: 10px; text-align: center; font-size: 14px; font-weight: 900; color: ${y.stats.percentage > 70 ? '#166534' : y.stats.percentage > 40 ? '#92400e' : '#991b1b'}">${y.stats.percentage}%</td>
      </tr>
    `).join('');

    reportContainer.innerHTML = `
      <div style="border: 4px solid #2563eb; padding: 20px; border-radius: 20px; min-height: 750px; display: flex; flex-direction: column;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 32px;">دليل بيانات الشباب الكامل</h1>
          <p style="font-weight: bold; color: #64748b; font-size: 18px;">كنيسة الملاك روفائيل - اجتماع ثانوي بنين</p>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; color: #94a3b8; font-size: 14px; font-weight: bold;">
            <span>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</span>
            <span>إجمالي الشباب: ${youthList.length}</span>
            <span>صفحة ${Math.floor(i/CHUNK_SIZE) + 1} من ${Math.ceil(youthList.length/CHUNK_SIZE)}</span>
          </div>
        </div>
        <div style="flex-grow: 1;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 3px solid #2563eb;">
                <th style="padding: 12px; text-align: center; font-size: 15px;">م</th>
                <th style="padding: 12px; text-align: right; font-size: 15px;">الاسم</th>
                <th style="padding: 12px; text-align: center; font-size: 15px;">الكود</th>
                <th style="padding: 12px; text-align: center; font-size: 15px;">رقم الهاتف</th>
                <th style="padding: 12px; text-align: right; font-size: 15px;">العنوان</th>
                <th style="padding: 12px; text-align: center; font-size: 15px;">المرحلة</th>
                <th style="padding: 12px; text-align: center; font-size: 15px;">الالتزام</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; font-weight: bold;">
          Angel Raphael Digital Systems | Created by: Kerolos Sfwat
        </div>
      </div>
    `;

    document.body.appendChild(reportContainer);
    const canvas = await html2canvas(reportContainer, { 
      scale: 2,
      useCORS: true,
      logging: false
    });
    const imgData = canvas.toDataURL('image/png');
    
    if (i > 0) pdf.addPage();
    
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    
    document.body.removeChild(reportContainer);
  }
  
  pdf.save(`دليل_بيانات_الشباب_${new Date().toLocaleDateString('ar-EG')}.pdf`);
};

export const generateDetailedYouthReportPDF = async (youth: any, history: any[], points: any[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const HISTORY_CHUNK = 12;
  
  // Page 1: Profile & Recent History
  const firstHistoryChunk = history.slice(0, HISTORY_CHUNK);
  const reportContainer = document.createElement('div');
  reportContainer.style.width = '800px';
  reportContainer.style.padding = '40px';
  reportContainer.dir = 'rtl';
  reportContainer.style.fontFamily = "'Cairo', sans-serif";
  reportContainer.style.backgroundColor = '#ffffff';

  const attendanceRows = firstHistoryChunk.map(h => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px;">${h.formatted}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: bold; ${h.status === 'present' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">
          ${h.status === 'present' ? 'حضور' : 'غياب'}
        </span>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${h.record.liturgy ? '✅' : '❌'}
        ${h.record.liturgyTime ? `<br/><span style="font-size: 9px; color: #64748b;">${h.record.liturgyTime}</span>` : ''}
      </td>
      <td style="padding: 12px; text-align: center;">${h.record.communion ? '✅' : '❌'}</td>
      <td style="padding: 12px; text-align: center;">${h.record.tonia ? '✅' : '❌'}</td>
      <td style="padding: 12px; text-align: center;">
        ${h.record.meeting ? '✅' : '❌'}
        ${h.record.meetingTime ? `<br/><span style="font-size: 9px; color: #64748b;">${h.record.meetingTime}</span>` : ''}
      </td>
      <td style="padding: 12px; text-align: center;">${h.record.bibleReading ? '✅' : '❌'}</td>
      <td style="padding: 12px; text-align: center;">${h.record.confession ? '✅' : '❌'}</td>
    </tr>
  `).join('');

  reportContainer.innerHTML = `
    <div style="border: 4px solid #2563eb; padding: 30px; border-radius: 25px; min-height: 1050px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px;">
        <div style="flex: 1;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">تقرير متابعة شخصي</h1>
          <h2 style="margin: 5px 0; font-size: 24px;">${youth.name}</h2>
          <p style="color: #64748b; font-weight: bold;">كود الشاب: ${youth.code}</p>
        </div>
        <div style="text-align: left; color: #64748b; font-size: 12px;">
          <p>المرحلة: ${youth.grade}</p>
          <p>المنطقة: ${youth.region || '—'}</p>
          <p>العنوان: ${youth.address || '—'}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 15px;">
        <div>
          <p style="margin: 0; font-size: 12px; color: #64748b;">رقم الهاتف</p>
          <p style="margin: 2px 0; font-weight: bold;">${youth.phone || '—'}</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">رقم الأب</p>
          <p style="margin: 2px 0; font-weight: bold;">${youth.fatherPhone || '—'}</p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #64748b;">رقم الأم</p>
          <p style="margin: 2px 0; font-weight: bold;">${youth.motherPhone || '—'}</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">أب الاعتراف</p>
          <p style="margin: 2px 0; font-weight: bold;">${youth.confessionFather || '—'}</p>
        </div>
      </div>

      <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">سجل الحضور والغياب (أحدث ${firstHistoryChunk.length} أسابيع)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #2563eb;">
            <th style="padding: 10px; text-align: right;">التاريخ</th>
            <th style="padding: 10px; text-align: center;">الحالة</th>
            <th style="padding: 10px; text-align: center;">قداس</th>
            <th style="padding: 10px; text-align: center;">تناول</th>
            <th style="padding: 10px; text-align: center;">تونية</th>
            <th style="padding: 10px; text-align: center;">اجتماع</th>
            <th style="padding: 10px; text-align: center;">إنجيل</th>
            <th style="padding: 10px; text-align: center;">اعتراف</th>
          </tr>
        </thead>
        <tbody>${attendanceRows}</tbody>
      </table>
      
      <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
        تم استخراج التقرير بتاريخ: ${new Date().toLocaleString('ar-EG')}
      </div>
    </div>
  `;

  document.body.appendChild(reportContainer);
  const canvas = await html2canvas(reportContainer, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  document.body.removeChild(reportContainer);

  // Additional Pages for remaining history
  for (let i = HISTORY_CHUNK; i < history.length; i += 25) {
    const chunk = history.slice(i, i + 25);
    const chunkContainer = document.createElement('div');
    chunkContainer.style.width = '800px';
    chunkContainer.style.padding = '40px';
    chunkContainer.dir = 'rtl';
    chunkContainer.style.fontFamily = "'Cairo', sans-serif";
    chunkContainer.style.backgroundColor = '#ffffff';
    
    const rows = chunk.map(h => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px;">${h.formatted}</td>
        <td style="padding: 10px; text-align: center;">${h.status === 'present' ? 'حضور' : 'غياب'}</td>
        <td style="padding: 10px; text-align: center;">${h.record.liturgy ? '✅' : '❌'}</td>
        <td style="padding: 10px; text-align: center;">${h.record.communion ? '✅' : '❌'}</td>
        <td style="padding: 10px; text-align: center;">${h.record.meeting ? '✅' : '❌'}</td>
        <td style="padding: 10px; text-align: center;">${h.record.bibleReading ? '✅' : '❌'}</td>
        <td style="padding: 10px; text-align: center;">${h.record.confession ? '✅' : '❌'}</td>
      </tr>
    `).join('');

    chunkContainer.innerHTML = `
      <div style="border: 2px solid #e2e8f0; padding: 20px; border-radius: 15px;">
        <h3 style="color: #2563eb; margin-bottom: 15px;">تكملة سجل الحضور - ${youth.name}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #2563eb;">
              <th style="padding: 8px; text-align: right;">التاريخ</th>
              <th style="padding: 8px; text-align: center;">الحالة</th>
              <th style="padding: 8px; text-align: center;">قداس</th>
              <th style="padding: 8px; text-align: center;">تناول</th>
              <th style="padding: 8px; text-align: center;">اجتماع</th>
              <th style="padding: 8px; text-align: center;">إنجيل</th>
              <th style="padding: 8px; text-align: center;">اعتراف</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    
    document.body.appendChild(chunkContainer);
    const canvas = await html2canvas(chunkContainer, { scale: 2 });
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, (canvas.height * width) / canvas.width);
    document.body.removeChild(chunkContainer);
  }

  // Points Page
  if (points.length > 0) {
    const pointsContainer = document.createElement('div');
    pointsContainer.style.width = '800px';
    pointsContainer.style.padding = '40px';
    pointsContainer.dir = 'rtl';
    pointsContainer.style.fontFamily = "'Cairo', sans-serif";
    pointsContainer.style.backgroundColor = '#ffffff';
    
    pointsContainer.innerHTML = `
      <div style="border: 4px solid #2563eb; padding: 30px; border-radius: 25px; min-height: 1050px;">
        <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 24px;">سجل نقاط الماراثون - ${youth.name}</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #2563eb;">
              <th style="padding: 12px; text-align: right;">التاريخ</th>
              <th style="padding: 12px; text-align: right;">النشاط</th>
              <th style="padding: 12px; text-align: center;">النقاط</th>
              <th style="padding: 12px; text-align: right;">السبب</th>
            </tr>
          </thead>
          <tbody>
            ${points.map(p => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px;">${formatDateArabic(p.weekDate)}</td>
                <td style="padding: 12px;">${p.activity}</td>
                <td style="padding: 12px; text-align: center; color: #166534; font-weight: bold;">+${p.points}</td>
                <td style="padding: 12px; color: #64748b; font-size: 11px;">${p.reason}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    document.body.appendChild(pointsContainer);
    const canvas = await html2canvas(pointsContainer, { scale: 2 });
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, (canvas.height * width) / canvas.width);
    document.body.removeChild(pointsContainer);
  }

  pdf.save(`تقرير_${youth.name}_${new Date().toLocaleDateString('ar-EG')}.pdf`);
};
