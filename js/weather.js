export class InvalidForecastError extends TypeError {}

const WEATHER_CONDITIONS = [
  { min: 0, max: 0, label: "Despejado", emoji: "☀️" },
  { min: 1, max: 2, label: "Parcialmente nublado", emoji: "⛅" },
  { min: 3, max: 3, label: "Nublado", emoji: "☁️" },
  { min: 45, max: 48, label: "Niebla", emoji: "🌫️" },
  { min: 51, max: 57, label: "Llovizna", emoji: "🌦️" },
  { min: 61, max: 67, label: "Lluvia", emoji: "🌧️" },
  { min: 71, max: 77, label: "Nieve", emoji: "❄️" },
  { min: 80, max: 82, label: "Chubascos", emoji: "🌧️" },
  { min: 95, max: 99, label: "Tormenta", emoji: "⛈️" },
];

const UNKNOWN_CONDITION = "No disponible ❔";

export function getWeatherCondition(weatherCode) {
  const condition = WEATHER_CONDITIONS.find(
    ({ min, max }) => weatherCode >= min && weatherCode <= max,
  );

  return condition ? `${condition.label} ${condition.emoji}` : UNKNOWN_CONDITION;
}

export function transformWeatherData(response) {
  const daily = response?.daily;
  const requiredFields = [
    "time",
    "temperature_2m_max",
    "temperature_2m_min",
    "weather_code",
  ];

  if (!daily || requiredFields.some((field) => !Array.isArray(daily[field]))) {
    throw new InvalidForecastError(
      "La respuesta meteorológica no contiene datos diarios válidos.",
    );
  }

  const arraysHaveSevenDays = requiredFields.every(
    (field) => daily[field].length === 7,
  );

  if (!arraysHaveSevenDays) {
    throw new InvalidForecastError(
      "La respuesta meteorológica debe contener exactamente 7 días.",
    );
  }

  const hasInvalidValue = daily.time.some(
    (date, index) =>
      typeof date !== "string" ||
      date.length === 0 ||
      !Number.isFinite(daily.temperature_2m_max[index]) ||
      !Number.isFinite(daily.temperature_2m_min[index]) ||
      !Number.isFinite(daily.weather_code[index]),
  );

  if (hasInvalidValue) {
    throw new InvalidForecastError(
      "La respuesta meteorológica contiene datos incompletos.",
    );
  }

  return daily.time.map((date, index) => ({
    fecha: date,
    tempMax: daily.temperature_2m_max[index],
    tempMin: daily.temperature_2m_min[index],
    condicion: getWeatherCondition(daily.weather_code[index]),
  }));
}
