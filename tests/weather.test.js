import assert from "node:assert/strict";
import { test } from "node:test";
import { getWeatherCondition, transformWeatherData } from "../js/weather.js";

const representativeResponse = {
  daily: {
    time: [
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
      "2026-09-21",
    ],
    temperature_2m_max: [24, 25, 23, 22, 26, 27, 24],
    temperature_2m_min: [12, 13, 11, 10, 14, 15, 12],
    weather_code: [0, 1, 3, 45, 61, 80, 95],
  },
};

test("código 0 corresponde a Despejado", () => {
  assert.equal(getWeatherCondition(0), "Despejado ☀️");
});

test("código 61 corresponde a Lluvia", () => {
  assert.equal(getWeatherCondition(61), "Lluvia 🌧️");
});

test("código 95 corresponde a Tormenta", () => {
  assert.equal(getWeatherCondition(95), "Tormenta ⛈️");
});

test("un código desconocido corresponde a No disponible", () => {
  assert.equal(getWeatherCondition(999), "No disponible ❔");
});

test("transforma una respuesta de Open-Meteo en 7 objetos", () => {
  const forecast = transformWeatherData(representativeResponse);

  assert.equal(forecast.length, 7);
  assert.deepEqual(forecast[0], {
    fecha: "2026-09-15",
    tempMax: 24,
    tempMin: 12,
    condicion: "Despejado ☀️",
  });
  assert.deepEqual(Object.keys(forecast[0]).sort(), [
    "condicion",
    "fecha",
    "tempMax",
    "tempMin",
  ]);
});

test("rechaza una respuesta con datos faltantes", () => {
  assert.throws(
    () => transformWeatherData({ daily: { time: [] } }),
    { name: "TypeError" },
  );
});
