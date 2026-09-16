const dateFormatter = new Intl.DateTimeFormat("es-BO", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const elements = {
  loading: () => document.querySelector("#loading-state"),
  generalError: () => document.querySelector("#general-error"),
  cities: () => document.querySelector("#cities-container"),
};

function getCityCard(city) {
  const container = elements.cities();
  let card = [...container.children].find(
    (candidate) => candidate.dataset.cityName === city.name,
  );

  if (!card) {
    card = document.createElement("article");
    card.dataset.cityName = city.name;
    card.className = "city-card";
    container.append(card);
  }

  return card;
}

function createCityHeading(city) {
  const heading = document.createElement("h3");
  heading.textContent = city.name;
  return heading;
}

function setCardState(card, state) {
  card.dataset.state = state;
  card.setAttribute("aria-busy", state === "loading" ? "true" : "false");
}

function createStatusMessage(message, className = "") {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = message;
  return paragraph;
}

export function renderLoadingState() {
  const loading = elements.loading();
  loading.hidden = false;
  loading.textContent = "Cargando pronóstico...";
}

export function renderLoadingComplete() {
  elements.loading().hidden = true;
}

export function renderCityLoading(city) {
  const card = getCityCard(city);
  card.replaceChildren(
    createCityHeading(city),
    createStatusMessage("Cargando pronóstico...", "city-loading"),
  );
  setCardState(card, "loading");
}

export function renderCitySuccess(city, forecast) {
  const card = getCityCard(city);
  const forecastList = document.createElement("ol");
  forecastList.className = "forecast-list";

  for (const day of forecast) {
    const item = document.createElement("li");
    const date = document.createElement("h4");
    const temperatures = document.createElement("p");
    const condition = document.createElement("p");

    date.textContent = formatForecastDate(day.fecha);
    temperatures.textContent = `Máxima: ${day.tempMax} °C · Mínima: ${day.tempMin} °C`;
    condition.textContent = `Condición: ${day.condicion}`;

    item.append(date, temperatures, condition);
    forecastList.append(item);
  }

  card.replaceChildren(createCityHeading(city), forecastList);
  setCardState(card, "success");
}

export function renderCityError(city, error, onRetry) {
  const card = getCityCard(city);
  const retryButton = document.createElement("button");

  retryButton.type = "button";
  retryButton.textContent = "Reintentar";
  retryButton.setAttribute("aria-label", `Reintentar pronóstico de ${city.name}`);
  retryButton.addEventListener("click", onRetry, { once: true });

  card.replaceChildren(
    createCityHeading(city),
    createStatusMessage(
      error?.message || "No fue posible cargar el pronóstico de esta ciudad.",
      "city-error",
    ),
    retryButton,
  );
  setCardState(card, "error");
}

export function renderGeneralError(onRetryAll) {
  const generalError = elements.generalError();
  const retryButton = document.createElement("button");

  retryButton.type = "button";
  retryButton.textContent = "Reintentar todo";
  retryButton.setAttribute("aria-label", "Reintentar pronóstico de todas las ciudades");
  retryButton.addEventListener("click", onRetryAll, { once: true });

  generalError.replaceChildren(
    createStatusMessage(
      "No fue posible cargar el pronóstico de ninguna ciudad.",
    ),
    retryButton,
  );
  generalError.hidden = false;
}

export function clearGeneralError() {
  const generalError = elements.generalError();
  generalError.hidden = true;
  generalError.replaceChildren();
}

export function formatForecastDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : dateFormatter.format(date);
}
