import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Upload, Button, Typography, Layout } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { generatePDF } from "./HelperFunc";
const { Title, Text } = Typography;

const { Content } = Layout;

const App = () => {
  const [data, setData] = useState([]);

  const handleFileUpload = (file) => {
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

  
  return (
    <Layout className="min-h-screen bg-gray-100">
      <Content className="flex flex-col items-center justify-center py-20 px-4">
        <Title level={2} style={{ color: "#333" }}>
          Excel to PDF Converter
        </Title>
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          customRequest={({ file, onSuccess }) => {
            handleFileUpload(file);
            setTimeout(() => onSuccess("ok"), 0);
          }}
        >
          <Button
            icon={<UploadOutlined />}
            size="large"
            style={{
              backgroundColor: "#1890ff",
              color: "white",
              marginTop: 20,
              borderRadius: 6,
              width: 250,
            }}
          >
            رفع ملف Excel
          </Button>
        </Upload>
      </Content>
    </Layout>
  );
};

export default App;
