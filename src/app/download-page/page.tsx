"use client";

import { useState } from "react";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/download-store");
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "keevan-store.tar.gz";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#e2e8f0",
      }}
    >
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          KEEVAN STORE
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
          Source Code Archive
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: "inline-block",
            padding: "1rem 2.5rem",
            background: downloading ? "#6b7280" : "#3b82f6",
            color: "#fff",
            borderRadius: "0.5rem",
            border: "none",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: downloading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
          }}
        >
          {downloading ? "Downloading..." : "Download keevan-store.tar.gz (844 KB)"}
        </button>
        <p style={{ marginTop: "1.5rem", color: "#64748b", fontSize: "0.85rem" }}>
          Excludes: node_modules, .next, .git, .env files, skills, tool-results
        </p>
      </div>
    </div>
  );
}
