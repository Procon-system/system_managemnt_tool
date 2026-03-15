
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const calculateHours = (start, end) => {
  if (!start || !end) return 0;
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diff = Math.abs(endTime - startTime);
  return (diff / (1000 * 60 * 60)).toFixed(2);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const getResourceNames = (task, typeName) => {
  if (!task.resources) return 'N/A';
  return task.resources
    .filter(r => r.resource?.type?.name?.toLowerCase() === typeName.toLowerCase() || r.resource?.type === typeName) // simplified check
    .map(r => r.resource?.displayName || r.resource?.name || 'Unknown')
    .join(', ') || 'N/A';
};

export const generatePDF = async (tasks, metadata = {}) => {
  const { clientName = 'N/A', dateRange = 'N/A' } = metadata;

  // Define the table headers
  const headers = [
    { label: 'Date', width: 60 },
    { label: 'Hours', width: 50 },
    { label: 'Title', width: 100 },
    { label: 'Note', width: 100 },
    { label: 'Assigned To', width: 80 },
    { label: 'Facility', width: 80 },
    { label: 'Machine', width: 80 },
    { label: 'Status', width: 60 },
    { label: 'Task Period', width: 80 },
    { label: 'Tools', width: 80 },
    { label: 'Materials', width: 80 },
  ];

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Set up fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const startX = 40;
  const rowHeight = 25;
  const fontSize = 9;
  let page;
  let currentY;

  const addNewPage = () => {
    page = pdfDoc.addPage([1000, 800]); // A4 landscape-ish
    currentY = 750;

    // Add Header Info (only on the first page or every page?)
    // Usually, "Client Name" is on the first page, but table headers are on every page.
    // Let's put Client Name and Period on every page for clarity, or just first page.
    // The user image shows them at the top. Let's put them on every page for a report feel.
    page.drawText(`Client Name: ${clientName}`, { x: startX, y: currentY, size: 10, font: boldFont });
    currentY -= 15;
    page.drawText(`Total Time Period: ${dateRange}`, { x: startX, y: currentY, size: 10, font: boldFont });
    currentY -= 15;
    page.drawText('Timesheet', { x: startX, y: currentY, size: 10, font: boldFont });
    currentY -= 20;

    // Draw table headers
    let currentX = startX;
    headers.forEach((header) => {
      page.drawText(header.label, {
        x: currentX,
        y: currentY,
        size: fontSize,
        font: boldFont,
      });
      currentX += header.width;
    });

    currentY -= 5;
    page.drawLine({
      start: { x: startX, y: currentY },
      end: { x: currentX, y: currentY },
      thickness: 1,
    });
    currentY -= rowHeight - 10;
  };

  addNewPage();

  let totalHours = 0;

  // Draw table rows
  tasks.forEach((task) => {
    // Check if we need a new page (e.g., if currentY is too low for a row + footer space)
    if (currentY < 120) { // Keep some buffer for footer if it's the last page
      addNewPage();
    }

    const hours = calculateHours(task.schedule?.start, task.schedule?.end);
    totalHours += parseFloat(hours);

    let currentX = startX;
    headers.forEach((header) => {
      let text = 'N/A';
      switch (header.label) {
        case 'Date': text = formatDate(task.schedule?.start); break;
        case 'Hours': text = hours; break;
        case 'Title': text = task.title || 'N/A'; break;
        case 'Note': text = task.notes ? task.notes.replace(/<[^>]*>/g, '') : 'N/A'; break;
        case 'Assigned To':
          text = Array.isArray(task.assignments)
            ? task.assignments.map(a => `${a.user?.first_name} ${a.user?.last_name}`).join(', ')
            : 'N/A';
          break;
        case 'Facility': text = task.facility?.facility_name || 'N/A'; break;
        case 'Machine': text = task.machine?.machine_name || 'N/A'; break;
        case 'Status': text = task.status || 'N/A'; break;
        case 'Task Period': text = task.task_period || 'N/A'; break;
        case 'Tools': text = getResourceNames(task, 'Tool'); break;
        case 'Materials': text = getResourceNames(task, 'Material'); break;
        default: text = 'N/A';
      }

      // Draw text with basic clipping/wrapping logic
      const maxWidth = header.width - 5;
      const truncatedText = font.widthOfTextAtSize(text, fontSize) > maxWidth
        ? text.substring(0, Math.floor(maxWidth / 5)) + '...'
        : text;

      page.drawText(truncatedText, {
        x: currentX,
        y: currentY,
        size: fontSize,
        font,
      });
      currentX += header.width;
    });

    currentY -= rowHeight;
  });

  // Footer (drawn on the last page)
  currentY -= 10;
  page.drawText(`Sum of the Hours: ${totalHours.toFixed(2)}`, { x: startX, y: currentY, size: 10, font: boldFont });
  currentY -= 30;
  page.drawText('Client Signature: _______________________', { x: startX, y: currentY, size: 10, font: boldFont });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url);
};

export const generateExcel = (tasks, metadata = {}) => {
  const { clientName = 'N/A', dateRange = 'N/A' } = metadata;

  let totalHours = 0;
  const rows = tasks.map(task => {
    const hours = parseFloat(calculateHours(task.schedule?.start, task.schedule?.end));
    totalHours += hours;
    return {
      Date: formatDate(task.schedule?.start),
      Hours: hours,
      Title: task.title || 'N/A',
      Note: task.notes ? task.notes.replace(/<[^>]*>/g, '') : 'N/A',
      AssignedTo: Array.isArray(task.assignments) ? task.assignments.map(a => `${a.user?.first_name} ${a.user?.last_name}`).join(', ') : 'N/A',
      Facility: task.facility?.facility_name || 'N/A',
      Machine: task.machine?.machine_name || 'N/A',
      Status: task.status || 'N/A',
      TaskPeriod: task.task_period || 'N/A',
      Tools: getResourceNames(task, 'Tool'),
      Materials: getResourceNames(task, 'Material')
    };
  });

  const worksheetData = [
    ['Client Name', clientName],
    ['Total Time Period', dateRange],
    ['Timesheet'],
    [],
    Object.keys(rows[0] || {}),
    ...rows.map(row => Object.values(row)),
    [],
    ['Sum of the Hours', totalHours.toFixed(2)],
    [],
    ['Client Signature']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, 'Task_Report.xlsx');
};

export const generateAnalyticsPDF = async (tasks, metadata = {}, kpis = []) => {
  const { clientName = 'N/A', dateRange = 'N/A' } = metadata;

  const headers = [
    { label: 'Date', width: 60 },
    { label: 'Hours', width: 50 },
    { label: 'Title', width: 100 },
    { label: 'Note', width: 100 },
    { label: 'Assigned To', width: 80 },
    { label: 'Facility', width: 80 },
    { label: 'Machine', width: 80 },
    { label: 'Status', width: 60 },
    { label: 'Task Period', width: 80 },
    { label: 'Tools', width: 80 },
    { label: 'Materials', width: 80 },
  ];

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const startX = 40;
  const rowHeight = 25;
  const fontSize = 9;
  let page;
  let currentY;

  const addNewPage = () => {
    page = pdfDoc.addPage([1000, 800]);
    currentY = 750;
    page.drawText(`Analytics Report - Client: ${clientName}`, { x: startX, y: currentY, size: 10, font: boldFont });
    currentY -= 15;
    page.drawText(`Period: ${dateRange}`, { x: startX, y: currentY, size: 10, font: boldFont });
    currentY -= 20;

    let currentX = startX;
    headers.forEach((header) => {
      page.drawText(header.label, { x: currentX, y: currentY, size: fontSize, font: boldFont });
      currentX += header.width;
    });

    currentY -= 5;
    page.drawLine({ start: { x: startX, y: currentY }, end: { x: currentX, y: currentY }, thickness: 1 });
    currentY -= rowHeight - 10;
  };

  addNewPage();

  tasks.forEach((task) => {
    if (currentY < 150) addNewPage(); // More buffer for KPI section

    let currentX = startX;
    const hours = calculateHours(task.schedule?.start, task.schedule?.end);

    headers.forEach((header) => {
      let text = 'N/A';
      switch (header.label) {
        case 'Date': text = formatDate(task.schedule?.start); break;
        case 'Hours': text = hours; break;
        case 'Title': text = task.title || 'N/A'; break;
        case 'Note': text = task.notes ? task.notes.replace(/<[^>]*>/g, '') : 'N/A'; break;
        case 'Assigned To':
          text = Array.isArray(task.assignments) ? task.assignments.map(a => `${a.user?.first_name} ${a.user?.last_name}`).join(', ') : 'N/A';
          break;
        case 'Facility': text = task.facility?.facility_name || 'N/A'; break;
        case 'Machine': text = task.machine?.machine_name || 'N/A'; break;
        case 'Status': text = task.status || 'N/A'; break;
        case 'Task Period': text = task.task_period || 'N/A'; break;
        case 'Tools': text = getResourceNames(task, 'Tool'); break;
        case 'Materials': text = getResourceNames(task, 'Material'); break;
      }

      const maxWidth = header.width - 5;
      const truncatedText = font.widthOfTextAtSize(text, fontSize) > maxWidth
        ? text.substring(0, Math.floor(maxWidth / 5)) + '...'
        : text;

      page.drawText(truncatedText, { x: currentX, y: currentY, size: fontSize, font });
      currentX += header.width;
    });
    currentY -= rowHeight;
  });

  // KPI Summary Section
  if (currentY < 100) addNewPage();
  currentY -= 20;
  page.drawLine({ start: { x: startX, y: currentY }, end: { x: 960, y: currentY }, thickness: 1 });
  currentY -= 20;
  page.drawText('Analytics Summary (KPIs)', { x: startX, y: currentY, size: 12, font: boldFont });
  currentY -= 20;

  kpis.forEach((kpi) => {
    if (currentY < 50) addNewPage();
    let displayValue = kpi.value;
    if (kpi.format === 'currency') displayValue = `$${Number(kpi.value).toFixed(2)}`;
    else if (kpi.format === 'decimal') displayValue = Number(kpi.value).toFixed(2);

    page.drawText(`${kpi.title}: ${displayValue}`, { x: startX, y: currentY, size: 10, font });
    page.drawText(`(${kpi.subtitle})`, { x: startX + 250, y: currentY, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    currentY -= 15;
  });

  currentY -= 20;
  page.drawText('Client Signature: _______________________', { x: startX, y: currentY, size: 10, font: boldFont });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url);
};

export const generateAnalyticsExcel = (tasks, metadata = {}, kpis = []) => {
  const { clientName = 'N/A', dateRange = 'N/A' } = metadata;

  const rows = tasks.map(task => ({
    Date: formatDate(task.schedule?.start),
    Hours: calculateHours(task.schedule?.start, task.schedule?.end),
    Title: task.title || 'N/A',
    Note: task.notes ? task.notes.replace(/<[^>]*>/g, '') : 'N/A',
    AssignedTo: Array.isArray(task.assignments) ? task.assignments.map(a => `${a.user?.first_name} ${a.user?.last_name}`).join(', ') : 'N/A',
    Facility: task.facility?.facility_name || 'N/A',
    Machine: task.machine?.machine_name || 'N/A',
    Status: task.status || 'N/A',
    TaskPeriod: task.task_period || 'N/A',
    Tools: getResourceNames(task, 'Tool'),
    Materials: getResourceNames(task, 'Material')
  }));

  const worksheetData = [
    ['Analytics Report'],
    ['Client Name', clientName],
    ['Total Time Period', dateRange],
    [],
    Object.keys(rows[0] || {}),
    ...rows.map(row => Object.values(row)),
    [],
    ['Key Performance Indicators (KPIs)'],
  ];

  kpis.forEach(kpi => {
    let displayValue = kpi.value;
    if (kpi.format === 'currency') displayValue = `$${Number(kpi.value).toFixed(2)}`;
    else if (kpi.format === 'decimal') displayValue = Number(kpi.value).toFixed(2);
    worksheetData.push([kpi.title, displayValue, kpi.subtitle]);
  });

  worksheetData.push([], ['Client Signature']);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics_Tasks');
  XLSX.writeFile(workbook, 'Analytics_Report.xlsx');
};
