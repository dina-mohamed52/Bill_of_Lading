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
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFont); // Base64 font data needed here
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");
    doc.setFontSize(12);

    // Add the logo
    const logoWidth = 40;
    const logoHeight = 20;
    doc.addImage(logo, "jpeg", 10, 10, logoWidth, logoHeight);

    // Page layout constants
    const margin = 16; // Margin around the page
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - 2 * margin;
    const lineHeight = 10;
    let yOffset = margin;

    // Add a title
    doc.setFontSize(18);
    doc.setFont("Amiri", "bold");

    yOffset += 15;

    // Function to convert Excel's date serial number to readable format
    const formatDate = (excelDate) => {
      const jsDate = new Date((excelDate - 25569) * 86400000); // Convert Excel serial date to JS date
      return jsDate.toISOString().split("T")[0]; // Return date in YYYY-MM-DD format
    };

    // Draw data entries
    data.forEach((row, index) => {
      // Define the data fields
      const name = `TO : ${row["الاسم"] || "N/A"}`;
      const date = `التاريخ: ${
        row["التاريخ"] && !isNaN(row["التاريخ"])
          ? formatDate(row["التاريخ"])
          : row["التاريخ"] || "N/A"
      }`; // Convert serial number to readable date
      const phone = ` 0${String(row["رقم التليفون"] || "N/A")}`;
      const address = `العنوان: ${row["العنوان"] || "N/A"}`;
      const required = `المطلوب: ${row["المطلوب"] || "N/A"}`;
      const amount = `${row["المبلغ"] || "N/A"}`; // Amount to be styled
      const contact = `التواصل: ${row["التواصل"] || "N/A"}`;
      const notes = `ملاحظات: ${row["ملاحظات"] || "N/A"}`;

      // Split long text fields to fit within the content width
      const addressLines = doc.splitTextToSize(address, contentWidth - 10);
      const notesLines = doc.splitTextToSize(notes, contentWidth - 10);

      // Calculate the dynamic height of the box based on content
      const boxHeight =
        lineHeight * 8 + // Base height for static fields
        lineHeight * addressLines.length +
        lineHeight * notesLines.length +
        10; // Padding

      // Add a page break if the box doesn't fit on the current page
      if (yOffset + boxHeight > pageHeight - margin) {
        doc.addPage();
        yOffset = margin; // Reset yOffset for the new page
      }

      // Draw a bordered box for the entry
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(margin, yOffset, contentWidth, boxHeight);

      // Add the data inside the box
      const padding = 5;
      let textOffset = yOffset + padding + 2;

      // Add the fields (aligned to the right for Arabic)
      doc.setFontSize(12);

      doc.setFont("Amiri", "normal");
      doc.addImage(logo, "jpeg", 10, 10, logoWidth, logoHeight, {
        align: "left",
      }); // Add logo at the top left corner
      doc.text(name, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
      doc.text(date, pageWidth - margin - padding, textOffset, {
        align: "right",
      }); // Date in English
      textOffset += lineHeight;
      doc.text(phone, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;

      doc.text(addressLines, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight * addressLines.length;

      doc.text(required, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;

      // Style "المبلغ" in an attractive container
      const amountX = margin + 10; // Align to the left
      const amountY = textOffset - lineHeight + 5; // Align it vertically
      const amountWidth = contentWidth / 4;
      const amountHeight = lineHeight * 3;

      // Draw the container
      doc.setDrawColor(0);
      doc.setFillColor(245, 245, 245); // Light gray background
      doc.setLineWidth(0.5);
      doc.roundedRect(amountX, amountY, amountWidth, amountHeight, 5, 5, "FD"); // Rounded rectangle with a border

      // Add "المبلغ" (word) and the value, center-aligned inside the container
      const containerCenterX = amountX + amountWidth / 2; // X-coordinate for center alignment
      const containerCenterY = amountY + lineHeight; // Y-coordinate for "المبلغ"
      const valueY = containerCenterY + lineHeight; // Y-coordinate for the value
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("المبلغ", containerCenterX, containerCenterY, {
        align: "center",
      }); // Center "المبلغ"
      doc.text(amount, containerCenterX, valueY, { align: "center" }); // Center the amount value

      textOffset += lineHeight + 5; // Add spacing to avoid overlap
      doc.text(contact, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;

      doc.text(notesLines, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight * notesLines.length;

      // Move to the next box
      yOffset += boxHeight + 10;
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
