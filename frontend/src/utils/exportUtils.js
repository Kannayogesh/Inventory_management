import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// CSV Export
export const exportToCSV = (data, filename = "export.csv") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Handle values with commas or quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
};

// Excel Export using XLSX
export const exportToExcel = (data, filename = "export.xlsx") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  try {
    // Create a new workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    
    // Set column widths
    const max = data.reduce((acc, curr) => {
      const keys = Object.keys(curr);
      return Math.max(acc, keys.length);
    }, 0);
    
    ws['!cols'] = Array(max).fill({ wch: 18 });
    
    // Save the file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error("Excel export error:", error);
    alert("Failed to export to Excel. Exporting as CSV instead.");
    exportToCSV(data, filename.replace(".xlsx", ".csv"));
  }
};

// PDF Export using jsPDF with autoTable
export const exportToPDF = (data, filename = "export.pdf") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  try {
    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    
    // Add title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Asset Library Report", 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Add table using autoTable
    autoTable(doc, {
      head: [headers],
      body: data.map(row => headers.map(header => (row[header] || "—").toString())),
      startY: 30,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: { 
        fillColor: [66, 133, 244], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { 
        fillColor: [242, 242, 242] 
      },
      margin: { top: 30 }
    });
    
    // Save the file
    doc.save(filename);
  } catch (error) {
    console.error("PDF export error:", error);
    alert("Failed to export to PDF. Error: " + error.message);
  }
};

// Helper function to download files
const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
