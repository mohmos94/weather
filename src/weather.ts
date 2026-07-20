export interface DailyForecast {
  date: string;
  weekday: string;
  max: number;
  min: number;
  code: number;
}

export interface WeatherData {
  place: string;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  daily: DailyForecast[];
}

interface GeoResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

// Maps WMO weather codes to a short description and an emoji.
// https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: "clear sky", emoji: "☀️" },
  1: { label: "mainly clear", emoji: "🌤️" },
  2: { label: "partly cloudy", emoji: "⛅" },
  3: { label: "overcast", emoji: "☁️" },
  45: { label: "fog", emoji: "🌫️" },
  48: { label: "rime fog", emoji: "🌫️" },
  51: { label: "light drizzle", emoji: "🌦️" },
  53: { label: "drizzle", emoji: "🌦️" },
  55: { label: "dense drizzle", emoji: "🌦️" },
  61: { label: "light rain", emoji: "🌧️" },
  63: { label: "rain", emoji: "🌧️" },
  65: { label: "heavy rain", emoji: "🌧️" },
  66: { label: "freezing rain", emoji: "🌧️" },
  67: { label: "freezing rain", emoji: "🌧️" },
  71: { label: "light snow", emoji: "🌨️" },
  73: { label: "snow", emoji: "🌨️" },
  75: { label: "heavy snow", emoji: "❄️" },
  77: { label: "snow grains", emoji: "🌨️" },
  80: { label: "light showers", emoji: "🌦️" },
  81: { label: "showers", emoji: "🌧️" },
  82: { label: "violent showers", emoji: "⛈️" },
  85: { label: "snow showers", emoji: "🌨️" },
  86: { label: "snow showers", emoji: "❄️" },
  95: { label: "thunderstorm", emoji: "⛈️" },
  96: { label: "thunderstorm w/ hail", emoji: "⛈️" },
  99: { label: "thunderstorm w/ hail", emoji: "⛈️" },
};

export function describeWeather(code: number): { label: string; emoji: string } {
  return WEATHER_CODES[code] ?? { label: "unknown", emoji: "❓" };
}

async function geocode(city: string): Promise<GeoResult> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not look up that city.");
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`No location found for "${city}".`);
  }
  return data.results[0] as GeoResult;
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const location = await geocode(city);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "5");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load the weather forecast.");
  const data = await res.json();

  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    weekday: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    max: Math.round(data.daily.temperature_2m_max[i]),
    min: Math.round(data.daily.temperature_2m_min[i]),
    code: data.daily.weather_code[i],
  }));

  return {
    place: location.country ? `${location.name}, ${location.country}` : location.name,
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    daily,
  };
}
