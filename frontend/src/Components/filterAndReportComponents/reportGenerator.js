
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generatePDF = async (tasks) => {
  // Define the table headers
  const headers = [
    { label: 'Title', width: 100 },
    { label: 'Assigned To', width: 100 },
    { label: 'Facility', width: 150 },
    { label: 'Machine', width: 130 },
    { label: 'Status', width: 100 },
    { label: 'Task Period', width: 150 },
    { label: 'Tools', width: 130 },
    { label: 'Materials', width: 150 },
  ];
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1000, 800]); // Wider page

  // Set up fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Define starting positions for the table
  const startX = 50; // Left margin
  const startY = 750; // Top margin
  const rowHeight = 20; // Height of each row
  const lineHeight = 15; // Height of text within a row

  // Add a title to the PDF
  const title = 'Task Report';
  const titleWidth = boldFont.widthOfTextAtSize(title, 18);
  page.drawText(title, {
    x: startX + (page.getWidth() - startX * 2 - titleWidth) / 2, // Center the title
    y: startY + 30, // Position above the table
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Add the date of PDF generation
  const dateText = `Generated on: ${new Date().toLocaleDateString()}`;
  const dateWidth = font.widthOfTextAtSize(dateText, 12);
  page.drawText(dateText, {
    x: startX + (page.getWidth() - startX * 2 - dateWidth) / 2, // Center the date
    y: startY + 10, // Position below the title
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  // // Draw a line row below the title and date
  // page.drawLine({
  //   start: { x: startX, y: startY - 5 },
  //   end: { x: page.getWidth() - startX, y: startY - 5 },
  //   thickness: 1,
  //   color: rgb(0, 0, 0),
  // });

  // Draw table headers
  headers.forEach((header, colIndex) => {
    const x = startX + headers.slice(0, colIndex).reduce((acc, h) => acc + h.width, 0);
    page.drawText(header.label, {
      x,
      y: startY - 30, // Position below the line row
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  });

  // Draw horizontal line below headers
  page.drawLine({
    start: { x: startX, y: startY - 35 },
    end: { x: startX + headers.reduce((acc, h) => acc + h.width, 0), y: startY - 35 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Draw table rows
  tasks.forEach((task, rowIndex) => {
    const rowY = startY - 50 - (rowIndex + 1) * rowHeight; // Adjusted Y position for rows

    // Draw row data
    headers.forEach((header, colIndex) => {
      const x = startX + headers.slice(0, colIndex).reduce((acc, h) => acc + h.width, 0);
      let text = 'N/A';

      switch (header.label) {
        case 'Title':
          text = task.title || 'N/A';
          break;
        case 'Assigned To':
          text = Array.isArray(task.assigned_to)
            ? task.assigned_to.map((user) => `${user.first_name} ${user.last_name}`).join(', ') || 'N/A'
            : 'N/A';
          break;
        case 'Facility':
          text = task.facility?.facility_name || 'N/A';
          break;
        case 'Machine':
          text = task.machine?.machine_name || 'N/A';
          break;
        case 'Status':
          text = task.status || 'N/A';
          break;
        case 'Task Period':
          text = task.task_period || 'N/A';
          break;
        case 'Tools':
          text = Array.isArray(task.tools)
            ? task.tools.map((tool) => tool.tool_name || 'Unknown').join(', ')
            : 'N/A';
          break;
        case 'Materials':
          text = Array.isArray(task.materials)
            ? task.materials.map((material) => material.material_name || 'Unknown').join(', ')
            : 'N/A';
          break;
        default:
          text='N/A';
      }

      // Split text into lines that fit within the column width
      const lines = [];
      let currentLine = '';
      text.split(' ').forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);
        if (testWidth <= header.width - 10) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });
      lines.push(currentLine);

      // Draw each line
      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x,
          y: rowY - lineIndex * lineHeight, // Move down for each line
          size: 10,
          font,
          color: rgb(0, 0, 0),
          maxWidth: header.width - 10,
        });
      });
    });

    // Draw horizontal line below each row
    page.drawLine({
      start: { x: startX, y: rowY - 5 },
      end: { x: startX + headers.reduce((acc, h) => acc + h.width, 0), y: rowY - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  });

  // Draw vertical lines for the table
  let currentX = startX;
  headers.forEach((header) => {
    page.drawLine({
      start: { x: currentX, y: startY - 30 },
      end: { x: currentX, y: startY - 50 - (tasks.length + 1) * rowHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    currentX += header.width;
  });

  // Draw the final vertical line
  page.drawLine({
    start: { x: currentX, y: startY - 30 },
    end: { x: currentX, y: startY - 50 - (tasks.length + 1) * rowHeight },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url);
};

// export const generatePDF = (tasks) => {
//   // Define the table headers
//   const headers = [
//     { label: 'Title', width: 10 },
//     { label: 'Assigned To', width: 25 },
//     { label: 'Facility', width: 25 },
//     { label: 'Machine', width: 25 },
//     { label: 'Status', width: 25 },
//     { label: 'Task Period', width: 25 },
//     { label: 'Tools', width: 25 },
//     { label: 'Materials', width: 25 },
//   ];

//   // Define the template schema for the table
//   const template = {
//     basePdf: BLANK_PDF, // Start with a blank PDF
//     schemas: [
//       [
//         // Add headers to the schema
//         ...headers.map((header, colIndex) => ({
//           name: `header_${colIndex}`,
//           type: 'text',
//           position: { x: 10 + colIndex * header.width, y: 20 }, // Position headers in a row
//           width: header.width,
//           height: 10,
//         })),
//         // Add rows for each task
//         ...tasks.flatMap((task, rowIndex) =>
//           headers.map((header, colIndex) => ({
//             name: `task_${rowIndex}_${colIndex}`,
//             type: 'text',
//             position: { x: 10 + colIndex * header.width, y: 40 + rowIndex * 20 }, // Position rows below headers
//             width: header.width,
//             height: 10,
//           }))
//         ),
//       ],
//     ],
//   };

//   // Map tasks data to inputs
//   const inputs = tasks.map((task, rowIndex) => {
//     const rowData = headers.reduce((acc, header, colIndex) => {
//       switch (header.label) {
//         case 'Title':
//           acc[`task_${rowIndex}_${colIndex}`] = task.title || 'N/A';
//           break;
//         case 'Assigned To':
//           acc[`task_${rowIndex}_${colIndex}`] = Array.isArray(task.assigned_to)
//             ? task.assigned_to.map((user) => `${user.first_name} ${user.last_name}`).join(', ') || 'N/A'
//             : 'N/A';
//           break;
//         case 'Facility':
//           acc[`task_${rowIndex}_${colIndex}`] = task.facility?.facility_name || 'N/A';
//           break;
//         case 'Machine':
//           acc[`task_${rowIndex}_${colIndex}`] = task.machine?.machine_name || 'N/A';
//           break;
//         case 'Status':
//           acc[`task_${rowIndex}_${colIndex}`] = task.status || 'N/A';
//           break;
//         case 'Task Period':
//           acc[`task_${rowIndex}_${colIndex}`] = task.task_period || 'N/A';
//           break;
//         case 'Tools':
//           acc[`task_${rowIndex}_${colIndex}`] = Array.isArray(task.tools)
//             ? task.tools.map((tool) => tool.tool_name || 'Unknown').join(', ')
//             : 'N/A';
//           break;
//         case 'Materials':
//           acc[`task_${rowIndex}_${colIndex}`] = Array.isArray(task.materials)
//             ? task.materials.map((material) => material.material_name || 'Unknown').join(', ')
//             : 'N/A';
//           break;
//         default:
//           acc[`task_${rowIndex}_${colIndex}`] = 'N/A';
//       }
//       return acc;
//     }, {});
//     return rowData;
//   });

//   // Add headers to the first input object
//   const headerData = headers.reduce((acc, header, colIndex) => {
//     acc[`header_${colIndex}`] = header.label;
//     return acc;
//   }, {});

//   // Combine headers and all task data into a single inputs array
//   const combinedInputs = [{ ...headerData, ...inputs.reduce((acc, row) => ({ ...acc, ...row }), {}) }];

//   // Ensure `inputs` is an array
//   if (!Array.isArray(combinedInputs)) {
//     console.error('Inputs should be an array.');
//     return;
//   }

//   console.log(JSON.stringify(template, null, 2));
//   console.log('inputs', JSON.stringify(combinedInputs, null, 2));

//   // Generate the PDF
//   generate({ template, inputs: combinedInputs })
//     .then((pdf) => {
//       // Handle the generated PDF (display or save it)
//       const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
//       const url = URL.createObjectURL(blob);
//       window.open(url);
//     })
//     .catch((error) => {
//       console.error('Error generating PDF:', error);
//     });
// };
  export const generateExcel = (tasks) => {
  const worksheet = XLSX.utils.json_to_sheet(tasks.map(task => ({
    Title: task.title || 'N/A',
    AssignedTo: Array.isArray(task.assigned_to) ? task.assigned_to.map(user => `${user.first_name} ${user.last_name}`).join(', ') : 'N/A',
    Facility: task.facility?.facility_name || 'N/A',
    Machine: task.machine?.machine_name || 'N/A',
    Status: task.status || 'N/A',
    TaskPeriod: task.task_period || 'N/A',
    Tools: Array.isArray(task.tools) ? task.tools.map(tool => tool.tool_name || 'Unknown').join(', ') : 'N/A',
    Materials: Array.isArray(task.materials) ? task.materials.map(material => material.material_name || 'Unknown').join(', ') : 'N/A'
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, 'Task_Report.xlsx');
};
