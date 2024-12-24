import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import amiriFont from "./assets/constants"; // Ensure this contains the correct font data or path
import logo from "./assets/Logo.jpeg";
const App = () => {
  const [data, setData] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(jsonData); // Check parsed data
      generatePDF(jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

  const generatePDF = (data) => {
    const doc = new jsPDF();
  
    // Add the Amiri font for Arabic support
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFont); // Base64 font data required here
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");
  
    // Decrease logo size to fit two entries per page
    const logoWidth = 40;
    const logoHeight = 24;
    const margin = 10; // Reduced margins for more space
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - 2 * margin;
    const lineHeight = 8; // Reduced line height
    const maxLineWidth = contentWidth - 40; // Maximum width for splitting text
    let yOffset = margin; // Start at the top margin
  
    // Function to format date
    const formatDate = (excelDate) => {
      const jsDate = new Date((excelDate - 25569) * 86400000);
      return jsDate.toISOString().split("T")[0];
    };
  
    // Iterate over data entries
    data.forEach((row, index) => {
      // Define the data fields
      const name = `الاسم : ${row["الاسم"] || "N/A"}`;
      const date = `التاريخ: ${
        row["التاريخ"] && !isNaN(row["التاريخ"])
          ? formatDate(row["التاريخ"])
          : row["التاريخ"] || "N/A"
      }`;
      const phone = `رقم التليفون: 0${String(row["رقم التليفون"] || "N/A")}`;
      const address = `العنوان: ${row["العنوان"] || "N/A"}`;
      const requiredText = `المطلوب: ${row["المطلوب"] || "N/A"}`;
      const amount = `${row["المبلغ"] || "N/A"}`;
      const contact = `التواصل: ${row["التواصل"] || "N/A"}`;
      const notes = `ملاحظات: ${row["ملاحظات"] || "N/A"}`;
  
      // Split long text fields to fit within the content width
      const addressLines = doc.splitTextToSize(address, maxLineWidth);
      const requiredLines = doc.splitTextToSize(requiredText, maxLineWidth);
      const notesLines = doc.splitTextToSize(notes, maxLineWidth);
  
      // Calculate the dynamic height of the box based on content
      const boxHeight =
        lineHeight * 8 +
        lineHeight * addressLines.length +
        lineHeight * notesLines.length +
        lineHeight * requiredLines.length +
        6;
  
      // Add a page break if the box doesn't fit on the current page
      if (yOffset + boxHeight > pageHeight - margin) {
        doc.addPage();
        yOffset = margin;
      }
  
      // Draw a bordered box for the entry
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yOffset, contentWidth, boxHeight, 5, 5);
  
      // Add the logo inside the box
      doc.addImage(logo, "jpeg", margin + 5, yOffset + 5, logoWidth, logoHeight);
  
      // Align the content to start at the same height as the logo
      let textOffset = yOffset + 5; // Adjusted to match the logo height
      const padding = 5;
  
      // Add name and date
      doc.setFontSize(10); // Reduced font size for more content per page
      doc.text(date, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
      doc.text(name, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
  
      // Add phone
      doc.text(phone, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
  
      // Add address
      addressLines.forEach((line) => {
        doc.text(line, pageWidth - margin - padding, textOffset, {
          align: "right",
        });
        textOffset += lineHeight;
      });
  
      textOffset += lineHeight; // Adjust vertical spacing
  
      // Add required lines
      requiredLines.forEach((line) => {
        doc.text(line, pageWidth - margin - padding, textOffset, {
          align: "right",
        });
        textOffset += lineHeight;
      });
  
      // Highlight "المبلغ" in a reduced container aligned to middle-left
      const amountX = margin + 20; // X position of the container
      const amountY = yOffset + boxHeight / 2 - lineHeight; // Y position to vertically center in the box
      const amountWidth = 40; // Adjusted width for more space
      const amountHeight = lineHeight * 2;
      // Draw the container
      doc.setFillColor(245, 245, 245); // Light gray background
      doc.setDrawColor(0);
      doc.roundedRect(amountX, amountY, amountWidth, amountHeight, 5, 5, "FD");
  
      // Center the "المبلغ" label and value inside the container
      doc.setFontSize(12);
  
      // Center "المبلغ" text horizontally
      const labelTextX = amountX + amountWidth / 2; // Center of the container
      const labelTextY = amountY + lineHeight * 0.8; // Slightly below the top
      doc.text("المبلغ", labelTextX, labelTextY, { align: "center" });
      // Center the amount value horizontally
      const valueTextX = amountX + amountWidth / 2; // Center of the container
      const valueTextY = amountY + lineHeight * 1.6; // Slightly below "المبلغ"
      doc.text(amount, valueTextX, valueTextY, { align: "center" });
  
      textOffset += lineHeight * 2;
  
      // Add contact
      doc.text(contact, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
  
      // Add notes
      notesLines.forEach((line) => {
        doc.text(line, pageWidth - margin - padding, textOffset, {
          align: "right",
        });
        textOffset += lineHeight;
      });
  
      // Move to the next entry
      yOffset += boxHeight + 5; // Reduced spacing between entries
  
      // Add a page break after every two entries
      if (index % 2 === 1) {
        doc.addPage();
        yOffset = margin; // Reset yOffset for the new page
      }
    });
  
    // Save the PDF
    doc.save("Bill_of_Lading.pdf");
  };
  
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Excel to PDF Converter</h1>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="bg-gray-800 text-white border border-gray-700 rounded-lg p-3 w-64 cursor-pointer hover:bg-gray-700 transition"
      />
    </div>
  );
};

export default App;
