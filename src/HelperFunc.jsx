import logo from "./assets/Logo.jpeg";
import amiriFont from "./assets/constants";
import jsPDF from "jspdf";

export const generatePDF = (data) => {
  const doc = new jsPDF();

  // Add Amiri font
  doc.addFileToVFS("Amiri-Regular.ttf", amiriFont);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");

  const logoWidth = 40;
  const logoHeight = 24;
  const margin = 10;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 8;
  const maxLineWidth = contentWidth - 50;
  const fixedBoxHeight = (pageHeight - margin * 3) / 2; // fixed height for each bill

  let yOffset = margin;

  const formatDate = (excelDate) => {
    const jsDate = new Date((excelDate - 25569) * 86400000);
    return jsDate.toISOString().split("T")[0];
  };

  data.forEach((row, index) => {
    if (index % 2 === 0 && index !== 0) {
      doc.addPage();
      yOffset = margin;
    }

    const name = `الاسم : ${row["الاسم"] || "N/A"}`;
    const date = `التاريخ: ${
      row["التاريخ"] && !isNaN(row["التاريخ"])
        ? formatDate(row["التاريخ"])
        : row["التاريخ"] || "N/A"
    }`;
    const phone1 = `رقم التليفون : 0${String(row["رقم التليفون"] || "N/A")}`;
    const phone2 = row["رقم التليفون 2"]
      ? `رقم التليفون : 0${String(row["رقم التليفون 2"])}`
      : null;
    const address = `العنوان: ${row["العنوان"] || "N/A"}`;
    const requiredText = `المطلوب: ${row["المطلوب"] || "N/A"}`;
    const amount = `${row["المبلغ"] || "0"}`;
    // const contact = `التواصل: ${row["التواصل"] || "N/A"}`;
    const notes = `ملاحظات: ${row["ملاحظات"] || "N/A"}`;
    const orderStatus = `${row["حالة الاوردر"] || "N/A"}`;

    if (requiredText.length > 150) {
      doc.setFontSize(8);
    } else {
      doc.setFontSize(10);
    }

    const addressLines = doc.splitTextToSize(address, maxLineWidth);
    const requiredMaxWidth = contentWidth - 100; // narrower width for required text (you can adjust 100)
    const requiredLines = doc.splitTextToSize(requiredText, requiredMaxWidth);
    const notesLines = doc.splitTextToSize(notes, maxLineWidth);

    // Draw outer box
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yOffset, contentWidth, fixedBoxHeight, 5, 5);

    // Add logo
    doc.addImage(logo, "jpeg", margin + 5, yOffset + 5, logoWidth, logoHeight);

    let textOffset = yOffset + 5;
    const padding = 5;

    doc.setFontSize(14);
    doc.text(date, pageWidth - margin - padding, textOffset, {
      align: "right",
    });
    textOffset += lineHeight;

    doc.text(name, pageWidth - margin - padding, textOffset, {
      align: "right",
    });
    textOffset += lineHeight;

    doc.setFontSize(14); // Bigger font for phone numbers
    doc.text(phone1, pageWidth - margin - padding, textOffset, {
      align: "right",
    });
    textOffset += lineHeight;

    if (phone2) {
      doc.text(phone2, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
    }

    doc.setFontSize(10); // Reset font size

    doc.setFontSize(14); // Bigger font for address
    addressLines.forEach((line) => {
      doc.text(line, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
    });

    // After address, reset font size back to 10
    doc.setFontSize(10);

    textOffset += lineHeight; // small gap

    requiredLines.forEach((line) => {
      doc.text(line, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
    });

    textOffset += lineHeight; // small gap

    // doc.text(contact, pageWidth - margin - padding, textOffset, { align: "right" });
    // textOffset += lineHeight;

    notesLines.forEach((line) => {
      doc.text(line, pageWidth - margin - padding, textOffset, {
        align: "right",
      });
      textOffset += lineHeight;
    });

    // Draw Order Status container
    const statusX = margin + 5;
    const statusY = yOffset + fixedBoxHeight / 2 - lineHeight * 2.5;
    const statusWidth = 40;
    const statusHeight = lineHeight * 2;
    doc.setFillColor(230, 240, 255); // Light blue
    doc.roundedRect(statusX, statusY, statusWidth, statusHeight, 5, 5, "FD");

    doc.setFontSize(12);
    doc.text("حالة الطلب", statusX + statusWidth / 2, statusY + 6, {
      align: "center",
    });
    doc.setFontSize(10);
    doc.text(orderStatus, statusX + statusWidth / 2, statusY + 13, {
      align: "center",
    });

    // Draw Amount container
    const amountX = margin + 5;
    const amountY = statusY + statusHeight + 5;
    const amountWidth = 40;
    const amountHeight = lineHeight * 2;
    doc.setFillColor(245, 245, 245); // Light grey
    doc.roundedRect(amountX, amountY, amountWidth, amountHeight, 5, 5, "FD");

    doc.setFontSize(12);
    doc.text("المبلغ", amountX + amountWidth / 2, amountY + 6, {
      align: "center",
    });
    doc.setFontSize(10);
    doc.text(amount, amountX + amountWidth / 2, amountY + 13, {
      align: "center",
    });

    yOffset += fixedBoxHeight + margin; // Move to next bill
  });

  doc.save("Bill_of_Lading.pdf");
};
