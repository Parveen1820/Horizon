import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const processData = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/process/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            input: input,
          },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch {
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
        padding: "40px",
        fontFamily: "Arial",
        background: "#f5f7fa",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
        }}
      >
        <h1>Horizon</h1>

        <p>Reusable AI Hackathon Starter</p>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your data..."
          style={{
            width: "70%",
            padding: "12px",
            marginRight: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <button
          onClick={processData}
          disabled={loading}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Processing..." : "Process"}
        </button>

        {result && (
          <div style={{ marginTop: "30px" }}>
            <h2>Result</h2>

            <pre
              style={{
                background: "#f1f1f1",
                padding: "20px",
                borderRadius: "8px",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;