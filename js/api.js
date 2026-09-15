import { transformWeatherData } from "./weather.js";

const API_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 10_000;

function createApiError(message, cause) {
  const error = new Error(message, { cause });
  console.error(`[weather-api] ${message}`, cause);
  return error;
}

function validateDailyResponse(response) {
  const daily = response?.daily;
  const requiredFields = [
    "time",
    "temperature_2m_max",
    "temperature_2m_min",
    "weather_code",
  ];

  const hasRequiredArrays =
    daily && requiredFields.every((field) => Array.isArray(daily[field]));
  const hasSevenDays =
    hasRequiredArrays && requiredFields.every((field) => daily[field].length === 7);

  if (!hasSevenDays) {
    throw new TypeError("La respuesta no contiene 7 días de datos meteorológicos.");
  }
}

export function buildForecastUrl({ latitude, longitude }) {
  const url = new URL(API_ENDPOINT);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,weather_code",
  );
  url.searchParams.set("timezone", "America/La_Paz");
  url.searchParams.set("forecast_days", "7");
  return url.toString();
}

export async function fetchWeatherForecast(city) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildForecastUrl(city), {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondió con HTTP ${response.status}.`);
    }

    let rawResponse;
    try {
      rawResponse = await response.json();
    } catch (error) {
      throw createApiError("La respuesta de Open-Meteo no contiene JSON válido.", error);
    }

    try {
      validateDailyResponse(rawResponse);
      return transformWeatherData(rawResponse);
    } catch (error) {
      throw createApiError("La respuesta de Open-Meteo tiene una estructura inválida.", error);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw createApiError("La solicitud meteorológica excedió los 10 segundos.", error);
    }

    if (error.message?.startsWith("Open-Meteo respondió con HTTP")) {
      throw createApiError("No fue posible obtener el pronóstico del servidor.", error);
    }

    if (error.message?.startsWith("La respuesta de Open-Meteo")) {
      throw error;
    }

    throw createApiError("No fue posible conectar con el servicio meteorológico.", error);
  } finally {
    clearTimeout(timeoutId);
  }
}
