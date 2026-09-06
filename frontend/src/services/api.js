const API_URL = "http://127.0.0.1:8000";

export async function processData(data) {
  const response = await fetch(`${API_URL}/api/process/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data,
    }),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}