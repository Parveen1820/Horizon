import { useState } from "react";
import { processData } from "./services/api";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await processData({
        input: input,
      });

      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "Unable to connect to backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#111827",
          color: "white",
          padding: "20px 40px",
        }}
      >
        <h1 style={{ margin: 0 }}>Horizon</h1>
        <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>
          AI Hackathon Starter Platform
        </p>
      </header>

      {/* Main */}
      <main
        style={{
          maxWidth: "1100px",
          margin: "40px auto",
          padding: "0 20px",
        }}
      >
        {/* Status Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h3>Frontend</h3>
            <p style={{ color: "green" }}>● Connected</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h3>Backend</h3>
            <p style={{ color: "green" }}>● Connected</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h3>API</h3>
            <p style={{ color: "green" }}>● Ready</p>
          </div>
        </div>

        {/* Processing Section */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Data Processing</h2>

          <p style={{ color: "#64748b" }}>
            Enter any data to test the frontend and backend workflow.
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your data here..."
            rows={6}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />

          <button
            onClick={handleProcess}
            disabled={loading}
            style={{
              marginTop: "15px",
              padding: "12px 24px",
              background: "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : "Process Data"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            style={{
              marginTop: "30px",
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2>Result</h2>

            <pre
              style={{
                background: "#f1f5f9",
                padding: "20px",
                borderRadius: "8px",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;