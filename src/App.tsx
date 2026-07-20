import { useEffect, useState } from "react";
import { describeWeather, fetchWeather, type WeatherData } from "./weather";

// Reminder banner: on Thursday you should have your girlfriend over at your place.
function ThursdayReminder() {
  const isThursday = new Date().getDay() === 4;
  return (
    <div className={`reminder${isThursday ? " today" : ""}`}>
      <span className="icon">📅</span>
      <div>
        You should have your girlfriend over at your place.
      </div>
    </div>
  );
}

export default function App() {
  const [city, setCity] = useState("Oslo");
  const [query, setQuery] = useState("Oslo");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWeather(query)
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setWeather(null);
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = city.trim();
    if (trimmed) setQuery(trimmed);
  }

  const current = weather ? describeWeather(weather.weatherCode) : null;

  return (
    <div className="app">
      <h1>🌤️ Weather</h1>

      <ThursdayReminder />

      <form className="search" onSubmit={handleSubmit}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search for a city…"
          aria-label="City"
        />
        <button type="submit" disabled={loading}>
          {loading ? "…" : "Search"}
        </button>
      </form>

      {error && <div className="status error">{error}</div>}

      {loading && !weather && <div className="status">Loading weather…</div>}

      {weather && current && (
        <div className="card">
          <div className="current">
            <div>
              <div className="temp">{weather.temperature}°C</div>
              <div className="place">{weather.place}</div>
              <div className="desc">{current.label}</div>
            </div>
            <div className="emoji">{current.emoji}</div>
          </div>

          <div className="forecast">
            {weather.daily.map((day) => {
              const info = describeWeather(day.code);
              return (
                <div className="day" key={day.date}>
                  <div className="name">{day.weekday}</div>
                  <div className="day-emoji">{info.emoji}</div>
                  <div className="max">{day.max}°</div>
                  <div className="min">{day.min}°</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
