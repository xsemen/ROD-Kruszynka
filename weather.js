// Pogoda dla Kruszyna Krajeńskiego koło Bydgoszczy.
// Dane: Open-Meteo, bez klucza API.
const KRUSZYN_WEATHER = {
  latitude: 53.07745,
  longitude: 17.87434,
  timezone: "Europe/Warsaw"
};

function weatherApiUrl() {
  const p = new URLSearchParams({
    latitude: KRUSZYN_WEATHER.latitude,
    longitude: KRUSZYN_WEATHER.longitude,
    current: [
      "temperature_2m",
      "weather_code",
      "precipitation",
      "wind_speed_10m",
      "relative_humidity_2m",
      "cloud_cover"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum"
    ].join(","),
    forecast_days: "4",
    timezone: KRUSZYN_WEATHER.timezone
  });

  return "https://api.open-meteo.com/v1/forecast?" + p.toString();
}

function iconForWeather(code, precipitation) {
  if (precipitation && precipitation > 0) return "🌧️";
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "⛅";
}

function descriptionForWeather(code, precipitation) {
  if (precipitation && precipitation > 0) return "Opady w okolicy";
  if (code === 0) return "Słonecznie";
  if (code === 1) return "Przeważnie słonecznie";
  if (code === 2) return "Częściowe zachmurzenie";
  if (code === 3) return "Pochmurno";
  if (code === 45 || code === 48) return "Mgła";
  if ([51, 53, 55, 56, 57].includes(code)) return "Mżawka";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Deszcz";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Śnieg";
  if ([95, 96, 99].includes(code)) return "Burza";
  return "Zmienna pogoda";
}

function formatDay(dateText) {
  const d = new Date(dateText + "T12:00:00");
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  }).format(d);
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = text;
  });
}

async function loadKruszynWeather() {
  const menuTemps = document.querySelectorAll("[data-weather-temp]");
  const menuIcons = document.querySelectorAll("[data-weather-icon]");
  const pageWeather = document.querySelector("[data-weather-page]");

  if (!menuTemps.length && !menuIcons.length && !pageWeather) return;

  try {
    const response = await fetch(weatherApiUrl(), { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const data = await response.json();
    const current = data.current || {};
    const temp = Math.round(current.temperature_2m);
    const precipitation = Number(current.precipitation || 0);
    const code = Number(current.weather_code);
    const icon = iconForWeather(code, precipitation);
    const desc = descriptionForWeather(code, precipitation);

    menuTemps.forEach((el) => (el.textContent = temp + "°C"));
    menuIcons.forEach((el) => (el.textContent = icon));

    if (pageWeather) {
      setText("[data-current-icon]", icon);
      setText("[data-current-temp]", temp + "°C");
      setText("[data-current-desc]", desc);
      setText("[data-current-rain]", precipitation.toFixed(1).replace(".", ",") + " mm");
      setText("[data-current-wind]", Math.round(current.wind_speed_10m || 0) + " km/h");
      setText("[data-current-humidity]", Math.round(current.relative_humidity_2m || 0) + "%");
      setText("[data-current-clouds]", Math.round(current.cloud_cover || 0) + "%");

      if (current.time) {
        setText("[data-current-time]", current.time.replace("T", " "));
      }

      const list = document.querySelector("[data-forecast-list]");
      if (list && data.daily) {
        list.innerHTML = "";
        for (let i = 0; i < data.daily.time.length; i++) {
          const dayCode = Number(data.daily.weather_code[i]);
          const dayRain = Number(data.daily.precipitation_sum[i] || 0);
          const dayIcon = iconForWeather(dayCode, dayRain);
          const tMax = Math.round(data.daily.temperature_2m_max[i]);
          const tMin = Math.round(data.daily.temperature_2m_min[i]);
          const rain = dayRain.toFixed(1).replace(".", ",");

          const card = document.createElement("div");
          card.className = "weather-day";
          card.innerHTML = `
            <strong>${formatDay(data.daily.time[i])}</strong>
            <div class="weather-day-icon">${dayIcon}</div>
            <div>${tMin}°C / ${tMax}°C</div>
            <div class="small">Opady: ${rain} mm</div>
          `;
          list.appendChild(card);
        }
      }
    }
  } catch (err) {
    menuTemps.forEach((el) => (el.textContent = ""));
    menuIcons.forEach((el) => (el.textContent = "⛅"));
    if (pageWeather) {
      setText("[data-current-desc]", "Nie udało się pobrać pogody. Spróbuj odświeżyć stronę.");
    }
  }
}

document.addEventListener("DOMContentLoaded", loadKruszynWeather);
