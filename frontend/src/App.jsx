import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const processData = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/process/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: input,
          value: 100,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "Backend connection failed",
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Horizon</h1>
      <h2>AI Hackathon Starter</h2>

      <input
        type="text"
        placeholder="Enter something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{
          padding: "10px",
          width: "300px",
          marginRight: "10px",
        }}
      />

      <button onClick={processData} disabled={loading}>
        {loading ? "Processing..." : "Process"}
      </button>

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h3>Backend Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;