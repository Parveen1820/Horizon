import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [trainingResult, setTrainingResult] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);

  const handleFileUpload = async () => {
    if (!file) {
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setTrainingResult(null);
    setTargetColumn("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_URL}/api/upload/csv`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploadResult(data);
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.message || "Unable to upload CSV.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!file || !targetColumn) {
      return;
    }

    setTraining(true);
    setTrainingResult(null);

    const formData = new FormData();

    formData.append("file", file);
    formData.append("target_column", targetColumn);

    try {
      const response = await fetch(
        `${API_URL}/api/process/train`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Model training failed."
        );
      }

      setTrainingResult(data);
    } catch (error) {
      setTrainingResult({
        success: false,
        message:
          error.message || "Unable to train model.",
      });
    } finally {
      setTraining(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    setFile(selectedFile);
    setUploadResult(null);
    setTrainingResult(null);
    setTargetColumn("");
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    return `${value}%`;
  };

  const getPredictionInfo = (prediction) => {
    const normalizedPrediction = String(prediction).toLowerCase();

    const isHighRisk =
      normalizedPrediction === "1" ||
      normalizedPrediction === "true" ||
      normalizedPrediction === "yes" ||
      normalizedPrediction === "churn";

    if (isHighRisk) {
      return {
        risk: "HIGH CHURN RISK",
        label: "Customer likely to churn",
        description:
          "The model predicts that this customer has a higher likelihood of leaving.",
        recommendation:
          "Consider targeted retention offers, proactive customer support, and personalized engagement.",
        tone: "danger",
      };
    }

    return {
      risk: "LOW CHURN RISK",
      label: "Customer likely to stay",
      description:
        "The model predicts that this customer is unlikely to churn.",
      recommendation:
        "Maintain engagement and monitor customer satisfaction to preserve retention.",
      tone: "success",
    };
  };

  const predictionInfo = trainingResult?.success
    ? getPredictionInfo(trainingResult.prediction?.value)
    : null;

  const confidence =
    trainingResult?.success &&
    trainingResult?.prediction?.confidence !== undefined
      ? Number(trainingResult.prediction.confidence)
      : 0;

  const safeConfidence = Math.min(
    Math.max(confidence, 0),
    100
  );

  const featureImportance =
    trainingResult?.feature_importance || [];

  const classDistribution =
    trainingResult?.class_distribution || [];

  const totalClassRecords = classDistribution.reduce(
    (total, item) => total + Number(item.count || 0),
    0
  );

  const maxFeatureImportance =
    featureImportance.length > 0
      ? Math.max(
          ...featureImportance.map((item) =>
            Number(item.importance || 0)
          )
        )
      : 1;

  const maxClassCount =
    classDistribution.length > 0
      ? Math.max(
          ...classDistribution.map((item) =>
            Number(item.count || 0)
          )
        )
      : 1;

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f7fb;
        }

        button,
        input,
        select {
          font: inherit;
        }

        .app {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 30%),
            #f4f7fb;
          color: #0f172a;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .topbar {
          background: linear-gradient(135deg, #0f172a 0%, #172554 100%);
          color: white;
          padding: 22px 24px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.16);
        }

        .topbar-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .brand h1 {
          margin: 0;
          font-size: 23px;
          letter-spacing: -0.4px;
        }

        .brand p {
          margin: 3px 0 0;
          color: #cbd5e1;
          font-size: 12px;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #dbeafe;
          font-size: 12px;
          white-space: nowrap;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.12);
        }

        .main {
          max-width: 1240px;
          margin: 0 auto;
          padding: 34px 24px 70px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 25px;
        }

        .eyebrow {
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .hero h2 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -1.3px;
          line-height: 1.08;
        }

        .hero p {
          max-width: 700px;
          color: #64748b;
          margin: 11px 0 0;
          line-height: 1.65;
          font-size: 15px;
        }

        .section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.055);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .section-header {
          padding: 24px 26px 0;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .section-title {
          margin: 0;
          font-size: 19px;
          letter-spacing: -0.3px;
        }

        .section-description {
          color: #64748b;
          margin: 7px 0 0;
          font-size: 13px;
          line-height: 1.55;
        }

        .section-number {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .section-content {
          padding: 24px 26px 26px;
        }

        .upload-zone {
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 32px 22px;
          text-align: center;
          background: #f8fafc;
          transition: 0.2s ease;
        }

        .upload-zone:hover {
          border-color: #93c5fd;
          background: #f8fbff;
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 12px;
          border-radius: 13px;
          background: #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .upload-zone h3 {
          margin: 0;
          font-size: 16px;
        }

        .upload-zone p {
          color: #64748b;
          font-size: 13px;
          margin: 6px 0 18px;
        }

        .file-input {
          max-width: 100%;
          padding: 9px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
        }

        .selected-file {
          margin: 15px auto 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .primary-button {
          border: none;
          border-radius: 10px;
          padding: 12px 19px;
          color: white;
          background: #2563eb;
          font-weight: 750;
          font-size: 13px;
          cursor: pointer;
          transition: 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18);
        }

        .primary-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .button-row {
          display: flex;
          justify-content: center;
          margin-top: 18px;
        }

        .dataset-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
          margin-bottom: 20px;
        }

        .info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 15px;
        }

        .info-label {
          margin: 0 0 5px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .info-value.file-name {
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .columns-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .columns-box strong {
          font-size: 12px;
        }

        .column-list {
          color: #64748b;
          font-size: 12px;
          line-height: 1.65;
          margin-top: 5px;
        }

        .target-box {
          border: 1px solid #bfdbfe;
          background: linear-gradient(135deg, #eff6ff, #f8fbff);
          border-radius: 14px;
          padding: 20px;
        }

        .target-box h3 {
          margin: 0;
          font-size: 15px;
        }

        .target-box p {
          margin: 6px 0 14px;
          color: #64748b;
          font-size: 12px;
        }

        .target-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .target-select {
          flex: 1;
          min-width: 240px;
          padding: 11px 13px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: white;
          color: #0f172a;
          outline: none;
        }

        .target-select:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.14);
        }

        .preview-wrapper {
          margin-top: 24px;
        }

        .subheading {
          margin: 0 0 12px;
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .data-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
          font-size: 11px;
        }

        .data-table th {
          padding: 11px 12px;
          text-align: left;
          background: #f1f5f9;
          color: #334155;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #eef2f7;
          color: #475569;
          white-space: nowrap;
        }

        .data-table tbody tr:last-child td {
          border-bottom: none;
        }

        .data-table tbody tr:hover {
          background: #f8fafc;
        }

        .results-header {
          padding: 25px 26px;
          background: linear-gradient(135deg, #0f172a, #172554);
          color: white;
        }

        .results-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .results-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .results-header p {
          margin: 6px 0 0;
          color: #cbd5e1;
          font-size: 12px;
        }

        .trained-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(74, 222, 128, 0.13);
          border: 1px solid rgba(134, 239, 172, 0.25);
          color: #bbf7d0;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .trained-badge span {
          width: 7px;
          height: 7px;
          background: #4ade80;
          border-radius: 50%;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 13px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          padding: 17px;
          position: relative;
          overflow: hidden;
        }

        .kpi-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #2563eb;
        }

        .kpi-label {
          margin: 0 0 7px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.55px;
        }

        .kpi-value {
          margin: 0;
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -0.8px;
        }

        .kpi-helper {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .dashboard-content {
          padding: 25px 26px 30px;
        }

        .prediction-hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          margin-bottom: 22px;
        }

        .prediction-card {
          border-radius: 16px;
          padding: 24px;
          border: 1px solid;
        }

        .prediction-card.success {
          background: linear-gradient(135deg, #ecfdf5, #f7fff9);
          border-color: #bbf7d0;
        }

        .prediction-card.danger {
          background: linear-gradient(135deg, #fff1f2, #fff8f8);
          border-color: #fecdd3;
        }

        .prediction-eyebrow {
          margin: 0 0 7px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .prediction-risk {
          margin: 0;
          font-size: clamp(25px, 4vw, 34px);
          letter-spacing: -1px;
          font-weight: 900;
        }

        .success .prediction-risk {
          color: #15803d;
        }

        .danger .prediction-risk {
          color: #be123c;
        }

        .prediction-label {
          margin: 7px 0 0;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        .prediction-description {
          margin: 12px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
        }

        .confidence-card {
          background: #0f172a;
          border-radius: 16px;
          padding: 24px;
          color: white;
        }

        .confidence-top {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: flex-end;
        }

        .confidence-title {
          margin: 0;
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .confidence-value {
          margin: 5px 0 0;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .confidence-level {
          color: #86efac;
          font-size: 11px;
          font-weight: 800;
          padding-bottom: 5px;
        }

        .confidence-track {
          height: 10px;
          border-radius: 99px;
          background: #334155;
          overflow: hidden;
          margin-top: 20px;
        }

        .confidence-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #60a5fa, #4ade80);
          transition: width 0.7s ease;
        }

        .confidence-note {
          margin: 10px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .inner-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
        }

        .inner-card h3 {
          margin: 0;
          font-size: 14px;
        }

        .inner-card-description {
          color: #94a3b8;
          font-size: 10px;
          margin: 5px 0 16px;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .metric-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 14px 9px;
          text-align: center;
        }

        .metric-label {
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          margin: 0 0 6px;
        }

        .metric-value {
          font-size: 21px;
          font-weight: 850;
          margin: 0;
        }

        .stat-list {
          display: grid;
          gap: 0;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 9px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-row span {
          color: #64748b;
        }

        .stat-row strong {
          text-align: right;
        }

        .feature-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 18px;
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 18px;
        }

        .feature-header h3 {
          margin: 0;
          font-size: 14px;
        }

        .feature-header p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .feature-list {
          display: grid;
          gap: 12px;
        }

        .feature-row {
          display: grid;
          grid-template-columns: 220px 1fr 58px;
          align-items: center;
          gap: 12px;
        }

        .feature-name {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .feature-rank {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-right: 6px;
          border-radius: 6px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 9px;
          font-weight: 850;
        }

        .feature-track {
          height: 8px;
          background: #e2e8f0;
          border-radius: 99px;
          overflow: hidden;
        }

        .feature-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          border-radius: 99px;
        }

        .feature-value {
          text-align: right;
          font-size: 11px;
          font-weight: 800;
          color: #334155;
        }

        .distribution-grid {
          display: grid;
          gap: 14px;
        }

        .class-row {
          display: grid;
          grid-template-columns: 85px 1fr 90px;
          align-items: center;
          gap: 12px;
        }

        .class-name {
          font-size: 11px;
          font-weight: 750;
          color: #334155;
        }

        .class-track {
          height: 12px;
          background: #e2e8f0;
          border-radius: 99px;
          overflow: hidden;
        }

        .class-fill {
          height: 100%;
          background: #64748b;
          border-radius: 99px;
        }

        .class-value {
          text-align: right;
          font-size: 11px;
          color: #64748b;
        }

        .recommendation {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 15px;
          align-items: flex-start;
          padding: 20px;
          border-radius: 14px;
          background: linear-gradient(135deg, #eff6ff, #f8fbff);
          border: 1px solid #bfdbfe;
        }

        .recommendation-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .recommendation h3 {
          margin: 0;
          font-size: 14px;
        }

        .recommendation p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
        }

        .pipeline {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          margin: 22px 0 0;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
        }

        .pipeline-step {
          text-align: center;
          position: relative;
          padding: 3px 8px;
        }

        .pipeline-step:not(:last-child)::after {
          content: "→";
          position: absolute;
          right: -5px;
          top: 6px;
          color: #94a3b8;
          font-weight: 900;
        }

        .pipeline-icon {
          width: 31px;
          height: 31px;
          border-radius: 9px;
          background: #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 6px;
          font-size: 12px;
          font-weight: 850;
        }

        .pipeline-step p {
          margin: 0;
          font-size: 9px;
          font-weight: 750;
          color: #475569;
        }

        .model-id {
          margin: 18px 0 0;
          color: #94a3b8;
          font-size: 9px;
          text-align: right;
        }

        .error {
          padding: 15px;
          margin-top: 18px;
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 38px 20px;
          color: #64748b;
        }

        .empty-state-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 10px;
          border-radius: 14px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .empty-state h3 {
          margin: 0;
          color: #334155;
          font-size: 15px;
        }

        .empty-state p {
          margin: 6px auto 0;
          max-width: 460px;
          font-size: 12px;
          line-height: 1.6;
        }

        .footer {
          text-align: center;
          color: #94a3b8;
          font-size: 10px;
          padding: 5px 0 20px;
        }

        @media (max-width: 900px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .prediction-hero,
          .content-grid {
            grid-template-columns: 1fr;
          }

          .feature-row {
            grid-template-columns: 180px 1fr 55px;
          }

          .dataset-grid {
            grid-template-columns: 1fr;
          }

          .pipeline {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .pipeline-step:not(:last-child)::after {
            content: "↓";
            position: static;
            display: block;
            margin-top: 5px;
          }
        }

        @media (max-width: 600px) {
          .topbar {
            padding: 18px 16px;
          }

          .topbar-inner {
            align-items: flex-start;
          }

          .system-status {
            display: none;
          }

          .main {
            padding: 25px 13px 50px;
          }

          .hero {
            margin-bottom: 20px;
          }

          .hero h2 {
            font-size: 28px;
          }

          .section-header,
          .section-content,
          .dashboard-content {
            padding-left: 16px;
            padding-right: 16px;
          }

          .results-header {
            padding: 20px 16px;
          }

          .results-header-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .kpi-grid {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }

          .kpi-card {
            padding: 13px;
          }

          .kpi-value {
            font-size: 21px;
          }

          .metric-grid {
            grid-template-columns: 1fr 1fr;
          }

          .feature-row {
            grid-template-columns: 1fr;
            gap: 5px;
          }

          .feature-value {
            text-align: left;
          }

          .class-row {
            grid-template-columns: 65px 1fr 70px;
          }

          .target-row {
            flex-direction: column;
            align-items: stretch;
          }

          .target-select {
            min-width: 0;
          }

          .target-row .primary-button {
            width: 100%;
          }

          .recommendation {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-icon">◈</div>

            <div>
              <h1>Horizon</h1>
              <p>AI/ML-Powered Predictive Insight Dashboard</p>
            </div>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            Predictive Engine Ready
          </div>
        </div>
      </header>

      <main className="main">
        {/* Hero */}
        <div className="hero">
          <div>
            <div className="eyebrow">Decision Intelligence Platform</div>

            <h2>Turn historical data into decisions.</h2>

            <p>
              Upload a raw dataset, let Horizon clean and analyze the data,
              train a machine learning model, and transform predictions into
              actionable business insights.
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <section className="section">
          <div className="section-header">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">
                  Upload & Analyze Dataset
                </h2>

                <p className="section-description">
                  Start with a historical CSV dataset. Horizon will inspect
                  the structure before model training.
                </p>
              </div>

              <div className="section-number">01</div>
            </div>
          </div>

          <div className="section-content">
            <div className="upload-zone">
              <div className="upload-icon">↑</div>

              <h3>Upload historical CSV data</h3>

              <p>
                Supported format: CSV • Recommended for predictive analysis
              </p>

              <input
                className="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />

              {file && (
                <div className="selected-file">
                  ✓ {file.name}
                </div>
              )}
            </div>

            <div className="button-row">
              <button
                className="primary-button"
                onClick={handleFileUpload}
                disabled={!file || uploading}
              >
                {uploading
                  ? "Analyzing Dataset..."
                  : "Analyze Dataset"}
              </button>
            </div>

            {uploadResult && uploadResult.success && (
              <div style={{ marginTop: "24px" }}>
                <div className="dataset-grid">
                  <InfoBox
                    label="Rows"
                    value={uploadResult.rows}
                  />

                  <InfoBox
                    label="Columns"
                    value={uploadResult.columns}
                  />

                  <InfoBox
                    label="Dataset"
                    value={uploadResult.filename}
                    small
                  />
                </div>

                <div className="columns-box">
                  <strong>Detected Columns</strong>

                  <div className="column-list">
                    {uploadResult.column_names?.join(", ")}
                  </div>
                </div>

                <div className="target-box">
                  <h3>Select Prediction Target</h3>

                  <p>
                    Choose the column that Horizon should predict using the
                    Random Forest model.
                  </p>

                  <div className="target-row">
                    <select
                      className="target-select"
                      value={targetColumn}
                      onChange={(e) =>
                        setTargetColumn(e.target.value)
                      }
                    >
                      <option value="">
                        -- Select target column --
                      </option>

                      {uploadResult.column_names?.map(
                        (column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      className="primary-button"
                      onClick={handleTrainModel}
                      disabled={!targetColumn || training}
                    >
                      {training
                        ? "Training Model..."
                        : "Train ML Model"}
                    </button>
                  </div>
                </div>

                <div className="preview-wrapper">
                  <h3 className="subheading">Data Preview</h3>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {uploadResult.column_names?.map(
                            (column) => (
                              <th key={column}>{column}</th>
                            )
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {uploadResult.preview?.map(
                          (row, index) => (
                            <tr key={index}>
                              {uploadResult.column_names?.map(
                                (column) => (
                                  <td key={column}>
                                    {String(
                                      row[column] ?? ""
                                    )}
                                  </td>
                                )
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {uploadResult && !uploadResult.success && (
              <ErrorMessage
                message={
                  uploadResult.message ||
                  "Unable to analyze dataset."
                }
              />
            )}
          </div>
        </section>

        {/* Results */}
        {trainingResult && (
          <section className="section">
            {trainingResult.success ? (
              <>
                {/* Results Header */}
                <div className="results-header">
                  <div className="results-header-row">
                    <div>
                      <h2>AI Predictive Insights</h2>

                      <p>
                        {trainingResult.model}{" "}
                        • Target:{" "}
                        {trainingResult.target_column}
                      </p>
                    </div>

                    <div className="trained-badge">
                      <span></span>
                      MODEL TRAINED
                    </div>
                  </div>
                </div>

                <div className="dashboard-content">
                  {/* Executive KPIs */}
                  <div className="kpi-grid">
                    <KpiCard
                      label="Customers Analyzed"
                      value={
                        trainingResult.dataset?.rows ?? "N/A"
                      }
                      helper="Historical records"
                    />

                    <KpiCard
                      label="Model Accuracy"
                      value={formatPercentage(
                        trainingResult.metrics?.accuracy
                      )}
                      helper="Test-set performance"
                    />

                    <KpiCard
                      label="Predictive Features"
                      value={
                        trainingResult.dataset?.features ?? "N/A"
                      }
                      helper="Features used by model"
                    />

                    <KpiCard
                      label="Prediction Confidence"
                      value={formatPercentage(
                        trainingResult.prediction?.confidence
                      )}
                      helper="Sample prediction"
                    />
                  </div>

                  {/* Prediction Hero */}
                  {predictionInfo && (
                    <div className="prediction-hero">
                      <div
                        className={`prediction-card ${predictionInfo.tone}`}
                      >
                        <p className="prediction-eyebrow">
                          Predicted Customer Status
                        </p>

                        <h2 className="prediction-risk">
                          {predictionInfo.risk}
                        </h2>

                        <p className="prediction-label">
                          {predictionInfo.label}
                        </p>

                        <p className="prediction-description">
                          {predictionInfo.description}
                        </p>
                      </div>

                      <div className="confidence-card">
                        <div className="confidence-top">
                          <div>
                            <p className="confidence-title">
                              Prediction Confidence
                            </p>

                            <p className="confidence-value">
                              {formatPercentage(confidence)}
                            </p>
                          </div>

                          <div className="confidence-level">
                            {safeConfidence >= 75
                              ? "HIGH CONFIDENCE"
                              : safeConfidence >= 50
                              ? "MODERATE"
                              : "LOW CONFIDENCE"}
                          </div>
                        </div>

                        <div className="confidence-track">
                          <div
                            className="confidence-fill"
                            style={{
                              width: `${safeConfidence}%`,
                            }}
                          />
                        </div>

                        <p className="confidence-note">
                          Confidence represents the model's certainty for
                          this prediction.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Model Performance + Data Summary */}
                  <div className="content-grid">
                    <div className="inner-card">
                      <h3>Model Performance</h3>

                      <p className="inner-card-description">
                        Evaluation results on the held-out test dataset.
                      </p>

                      <div className="metric-grid">
                        <MetricCard
                          label="Accuracy"
                          value={formatPercentage(
                            trainingResult.metrics?.accuracy
                          )}
                        />

                        <MetricCard
                          label="Precision"
                          value={formatPercentage(
                            trainingResult.metrics?.precision
                          )}
                        />

                        <MetricCard
                          label="Recall"
                          value={formatPercentage(
                            trainingResult.metrics?.recall
                          )}
                        />

                        <MetricCard
                          label="F1 Score"
                          value={formatPercentage(
                            trainingResult.metrics?.f1_score
                          )}
                        />
                      </div>
                    </div>

                    <div className="inner-card">
                      <h3>Data Quality & Preparation</h3>

                      <p className="inner-card-description">
                        Automated preprocessing performed before training.
                      </p>

                      <div className="stat-list">
                        <StatRow
                          label="Rows analyzed"
                          value={
                            trainingResult.dataset?.rows
                          }
                        />

                        <StatRow
                          label="Features"
                          value={
                            trainingResult.dataset?.features
                          }
                        />

                        <StatRow
                          label="Numerical features"
                          value={
                            trainingResult.dataset
                              ?.numerical_features
                          }
                        />

                        <StatRow
                          label="Categorical features"
                          value={
                            trainingResult.dataset
                              ?.categorical_features
                          }
                        />

                        <StatRow
                          label="Missing values handled"
                          value={
                            trainingResult.cleaning
                              ?.missing_values_before
                          }
                        />

                        <StatRow
                          label="Duplicate rows"
                          value={
                            trainingResult.cleaning
                              ?.duplicate_rows
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Training Details */}
                  <div className="content-grid">
                    <div className="inner-card">
                      <h3>Training Configuration</h3>

                      <p className="inner-card-description">
                        How the model was trained.
                      </p>

                      <div className="stat-list">
                        <StatRow
                          label="Algorithm"
                          value={
                            trainingResult.model ||
                            "Random Forest"
                          }
                        />

                        <StatRow
                          label="Training rows"
                          value={
                            trainingResult.training
                              ?.training_rows
                          }
                        />

                        <StatRow
                          label="Testing rows"
                          value={
                            trainingResult.training
                              ?.testing_rows
                          }
                        />

                        <StatRow
                          label="Numerical imputation"
                          value={
                            trainingResult.cleaning
                              ?.numerical_imputation
                          }
                        />

                        <StatRow
                          label="Categorical imputation"
                          value={
                            trainingResult.cleaning
                              ?.categorical_imputation
                          }
                        />

                        <StatRow
                          label="Encoding"
                          value={
                            trainingResult.cleaning
                              ?.categorical_encoding
                          }
                        />
                      </div>
                    </div>

                    <div className="inner-card">
                      <h3>Target Distribution</h3>

                      <p className="inner-card-description">
                        Distribution of target classes in the dataset.
                      </p>

                      <div className="distribution-grid">
                        {classDistribution.length > 0 ? (
                          classDistribution.map(
                            (item) => {
                              const count = Number(
                                item.count || 0
                              );

                              const percentage =
                                totalClassRecords > 0
                                  ? (
                                      (count /
                                        totalClassRecords) *
                                      100
                                    ).toFixed(1)
                                  : 0;

                              const width =
                                (count /
                                  maxClassCount) *
                                100;

                              return (
                                <div
                                  className="class-row"
                                  key={String(item.class)}
                                >
                                  <div className="class-name">
                                    Class {item.class}
                                  </div>

                                  <div className="class-track">
                                    <div
                                      className="class-fill"
                                      style={{
                                        width: `${width}%`,
                                      }}
                                    />
                                  </div>

                                  <div className="class-value">
                                    {count} ({percentage}%)
                                  </div>
                                </div>
                              );
                            }
                          )
                        ) : (
                          <p
                            style={{
                              color: "#94a3b8",
                              fontSize: "11px",
                            }}
                          >
                            Class distribution unavailable.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feature Importance */}
                  <div className="feature-card">
                    <div className="feature-header">
                      <div>
                        <h3>Top Predictive Factors</h3>

                        <p>
                          Features contributing most to the Random Forest
                          model's predictions.
                        </p>
                      </div>
                    </div>

                    {featureImportance.length > 0 ? (
                      <div className="feature-list">
                        {featureImportance.map(
                          (item, index) => {
                            const importance = Number(
                              item.importance || 0
                            );

                            const width =
                              maxFeatureImportance > 0
                                ? (importance /
                                    maxFeatureImportance) *
                                  100
                                : 0;

                            return (
                              <div
                                className="feature-row"
                                key={item.feature}
                              >
                                <div
                                  className="feature-name"
                                  title={item.feature}
                                >
                                  <span className="feature-rank">
                                    {index + 1}
                                  </span>
                                  {item.feature}
                                </div>

                                <div className="feature-track">
                                  <div
                                    className="feature-fill"
                                    style={{
                                      width: `${width}%`,
                                    }}
                                  />
                                </div>

                                <div className="feature-value">
                                  {importance}%
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                        }}
                      >
                        Feature importance is not available.
                      </p>
                    )}
                  </div>

                  {/* Business Recommendation */}
                  {predictionInfo && (
                    <div className="recommendation">
                      <div className="recommendation-icon">
                        💡
                      </div>

                      <div>
                        <h3>Recommended Business Action</h3>

                        <p>
                          {predictionInfo.recommendation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Pipeline */}
                  <div className="pipeline">
                    <PipelineStep
                      number="1"
                      label="Raw Data"
                    />

                    <PipelineStep
                      number="2"
                      label="Clean & Prepare"
                    />

                    <PipelineStep
                      number="3"
                      label="Train Model"
                    />

                    <PipelineStep
                      number="4"
                      label="Generate Prediction"
                    />

                    <PipelineStep
                      number="5"
                      label="Business Insight"
                    />
                  </div>

                  <p className="model-id">
                    Model ID:{" "}
                    {trainingResult.model_id || "N/A"}
                  </p>
                </div>
              </>
            ) : (
              <div className="dashboard-content">
                <ErrorMessage
                  message={
                    trainingResult.message ||
                    "Model training failed."
                  }
                />
              </div>
            )}
          </section>
        )}

        {/* Empty state before model training */}
        {!trainingResult && (
          <section className="section">
            <div className="empty-state">
              <div className="empty-state-icon">✦</div>

              <h3>Your predictive dashboard is waiting</h3>

              <p>
                Upload a historical CSV dataset above, select the prediction
                target, and train the model to unlock predictive insights,
                model performance, risk analysis, and business recommendations.
              </p>
            </div>
          </section>
        )}

        <div className="footer">
          Horizon • AI/ML-Powered Predictive Insight Dashboard
        </div>
      </main>
    </div>
  );
}

/* ---------------- Components ---------------- */

function InfoBox({ label, value, small = false }) {
  return (
    <div className="info-card">
      <p className="info-label">{label}</p>

      <p
        className={`info-value ${
          small ? "file-name" : ""
        }`}
      >
        {value ?? "N/A"}
      </p>
    </div>
  );
}

function KpiCard({ label, value, helper }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>

      <p className="kpi-value">{value}</p>

      <p className="kpi-helper">{helper}</p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>

      <p className="metric-value">{value}</p>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span>{label}</span>

      <strong>{value ?? "N/A"}</strong>
    </div>
  );
}

function PipelineStep({ number, label }) {
  return (
    <div className="pipeline-step">
      <div className="pipeline-icon">{number}</div>

      <p>{label}</p>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="error">
      {message}
    </div>
  );
}

export default App;