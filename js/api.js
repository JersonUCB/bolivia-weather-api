import {
  InvalidForecastError,
  transformWeatherData,
} from "./weather.js";

const API_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 10_000;

function createApiError(message, cause, code) {
  const error = new Error(message, { cause });
  error.code = code;
  console.error(`[weather-api] ${message}`, cause);
  return error;
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
      throw createApiError(
        "No fue posible obtener el pronóstico del servidor.",
        new Error(`Open-Meteo respondió con HTTP ${response.status}.`),
        "http",
      );
    }

    let rawResponse;
    try {
      rawResponse = await response.json();
    } catch (error) {
      throw createApiError(
        "La respuesta de Open-Meteo no contiene JSON válido.",
        error,
        "invalid-json",
      );
    }

    return transformWeatherData(rawResponse);
  } catch (error) {
    if (error instanceof InvalidForecastError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw createApiError("La solicitud meteorológica excedió los 10 segundos.", error);
    }

    if (error.code === "http" || error.code === "invalid-json") {
      throw error;
    }

    throw createApiError("No fue posible conectar con el servicio meteorológico.", error);
  } finally {
    clearTimeout(timeoutId);
  }
}
