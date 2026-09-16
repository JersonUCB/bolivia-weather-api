import { fetchWeatherForecast } from "./api.js";
import { cities } from "./config.js";

const cityStates = new Map();

// These no-op renderers define the contract consumed by the next UI iteration.
export const ui = {
  renderLoadingState() {},
  renderCityLoading() {},
  renderCitySuccess() {},
  renderCityError() {},
  renderGeneralError() {},
  clearGeneralError() {},
};

function updateCityState(city, state) {
  cityStates.set(city.name, { city, ...state });
}

function setAllCitiesLoading(cityList, renderer) {
  renderer.renderLoadingState(cityList);

  for (const city of cityList) {
    updateCityState(city, { status: "loading" });
    renderer.renderCityLoading(city);
  }
}

function handleCitySuccess(city, forecast, renderer) {
  updateCityState(city, { status: "success", forecast });
  renderer.renderCitySuccess(city, forecast);
}

function handleCityError(city, error, renderer, fetchForecast) {
  updateCityState(city, { status: "error", error });
  renderer.renderCityError(city, error, () =>
    retryCity(city, renderer, fetchForecast),
  );
}

export async function loadForecasts(
  cityList = cities,
  renderer = ui,
  fetchForecast = fetchWeatherForecast,
) {
  setAllCitiesLoading(cityList, renderer);
  renderer.clearGeneralError();

  const results = await Promise.allSettled(
    cityList.map((city) => fetchForecast(city)),
  );

  results.forEach((result, index) => {
    const city = cityList[index];

    if (result.status === "fulfilled") {
      handleCitySuccess(city, result.value, renderer);
      return;
    }

    handleCityError(city, result.reason, renderer, fetchForecast);
  });

  if (results.every((result) => result.status === "rejected")) {
    renderer.renderGeneralError(() =>
      retryAll(cityList, renderer, fetchForecast),
    );
  }

  return results;
}

export async function retryCity(
  city,
  renderer = ui,
  fetchForecast = fetchWeatherForecast,
) {
  updateCityState(city, { status: "loading" });
  renderer.renderCityLoading(city);

  try {
    const forecast = await fetchForecast(city);
    handleCitySuccess(city, forecast, renderer);
    renderer.clearGeneralError();
    return { status: "fulfilled", value: forecast };
  } catch (error) {
    handleCityError(city, error, renderer, fetchForecast);
    return { status: "rejected", reason: error };
  }
}

export function retryAll(
  cityList = cities,
  renderer = ui,
  fetchForecast = fetchWeatherForecast,
) {
  return loadForecasts(cityList, renderer, fetchForecast);
}

export function getCityState(cityName) {
  return cityStates.get(cityName);
}

export function initializeApp() {
  return loadForecasts();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
  } else {
    initializeApp();
  }
}
