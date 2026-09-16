import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresIn, setExpiresIn] = useState("");
  const [expiryUnit, setExpiryUnit] = useState("seconds");
  const [shortUrl, setShortUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    if (!shortUrl) return;
    const shortCode = shortUrl.split("/").pop();

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/analytics/${shortCode}`
        );

        const data = await response.json();

        if (response.ok) {
          setClicks(Number(data.total_clicks));
        }
      } catch (error) {
        console.error("Could not fetch analytics");
      }
    };
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);

    return () => clearInterval(interval);
    }, [shortUrl]);

  const shortenUrl = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    if (expiresIn && Number(expiresIn) < 1) {
  setError("Expiration time must be at least 1 second");
  return;
}
let expiryInSeconds;

if (expiresIn) {
  if (expiryUnit === "seconds") {
    expiryInSeconds = Number(expiresIn);
  } else if (expiryUnit === "minutes") {
    expiryInSeconds = Number(expiresIn) * 60;
  } else if (expiryUnit === "hours") {
    expiryInSeconds = Number(expiresIn) * 60 * 60;
  }
}

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url,
          alias: alias || undefined,
          expiresIn: expiresIn ? Number(expiresIn) : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShortUrl(data.shortUrl);
        setQrCode(data.qrCode);

        const shortCode = data.shortUrl.split("/").pop();

        const analyticsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/analytics/${shortCode}`
        );

        const analyticsData = await analyticsResponse.json();

        if (analyticsResponse.ok) {
          setClicks(Number(analyticsData.total_clicks));
        }
      }else {
        setError(data.message || "Something went wrong");
      }

    } catch (error) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shortUrl);
  };

  const refreshAnalytics = async () => {
  if (!shortUrl) return;

  try {
    const shortCode = shortUrl.split("/").pop();

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/analytics/${shortCode}`
    );

    const data = await response.json();

    if (response.ok) {
      setClicks(Number(data.total_clicks));
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert("Could not fetch analytics");
  }
  };

  return (
    <div className="container">

      <h1>SecureLink</h1>

      <p>Simple URL Shortener</p>

      <div className="input-section">

        <input
          type="text"
          placeholder="Paste your long URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <input
          type="text"
          placeholder="Custom alias (optional)"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />

        <div className="expiry-section">

  <input
    type="number"
    min="1"
    placeholder="Expiration time"
    value={expiresIn}
    onChange={(e) => setExpiresIn(e.target.value)}
  />

  <select
    value={expiryUnit}
    onChange={(e) => setExpiryUnit(e.target.value)}
  >
    <option value="seconds">Seconds</option>
    <option value="minutes">Minutes</option>
    <option value="hours">Hours</option>
  </select>

</div>

        <button onClick={shortenUrl} disabled={loading}>
          {loading ? "Shortening..." : "Shorten URL"}
        </button>

      </div>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {shortUrl && (
        <div className="result">

          <p>Your short URL:</p>

          <input
            type="text"
            value={shortUrl}
            readOnly
          />

          <button onClick={copyUrl}>
            Copy
          </button>

          {qrCode && (
            <div className="qr-section">
              <p>QR Code:</p>

              <img
                src={qrCode}
                alt="QR Code"
                width="200"
              />
            </div>
          )}
          <div className="analytics">
          <p>Total clicks</p>
          <strong>{clicks}</strong>

         
        </div>

        </div>
      )}

    </div>
  );
}

export default App;