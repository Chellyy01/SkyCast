"use strict";

const alert = document.querySelector(".alert");
const getForecast = document.querySelector(".get-forecast-btn");
const btnLogin = document.querySelector(".btn-login");

if (btnLogin) {
  const loginFunction = function () {
    const name = document.getElementById("username").value;
    if (name) {
      localStorage.setItem("username", name);
      window.location.href = "dashboard.html";
    }
    document.getElementById("username").value = "";
  };

  btnLogin.addEventListener("click", loginFunction);

  document
    .getElementById("username")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        loginFunction();
      }
    });
}

if (getForecast) {
  const name = localStorage.getItem("username") || "Guest";
  const greetingEl = document.getElementById("greeting");
  if (greetingEl) greetingEl.textContent = `Welcome, ${name}!`;
}

async function loadWeather() {
  const cityInput = document.getElementById("city");
  const city = cityInput ? cityInput.value.trim() : "";

  if (!city) {
    alert.textContent = `Please input a valid city/location`;

    return;
  } else {
    alert.textContent = "";
  }

  const apiKey = "1273d9b9806f4ea387e94727251405";
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(
    city
  )}&days=7`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log(data);

    if (!res.ok || data.error) {
      alert.textContent = `Please input a valid city/location`;
      return;
    }

    // Normalizing user input and API result for comparison
    const inputNormalized = city.toLowerCase().replace(/\s+/g, "");
    const resultNameNormalized = data.location.name
      .toLowerCase()
      .replace(/\s+/g, "");

    // If the location name doesn't include the input, reject it
    if (!resultNameNormalized.includes(inputNormalized)) {
      alert.textContent = "Please input a valid city/location";
      return;
    }

    // Display the entered city at the top of the page
    const cityDisplay = document.getElementById("city-display");
    if (cityDisplay) {
      cityDisplay.textContent = `Weather forecast for: ${data.location.name}, ${data.location.country}`;
    }

    const forecastDiv = document.getElementById("forecast");
    forecastDiv.innerHTML = "";

    const forecastByDayIndex = new Array(7).fill(null);
    data.forecast.forecastday.forEach((day) => {
      const date = new Date(day.date);
      const dayIndex = date.getDay();
      forecastByDayIndex[dayIndex] = day;
    });

    const todayIndex = new Date().getDay();

    const weekdayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const orderedWeekdays = weekdayNames
      .slice(todayIndex)
      .concat(weekdayNames.slice(0, todayIndex));

    for (let i = 0; i < 7; i++) {
      const weekdayName = orderedWeekdays[i];
      const dayIndex = weekdayNames.indexOf(weekdayName);
      const forecast = forecastByDayIndex[dayIndex];
      if (!forecast) continue;

      const isToday = i === 0 ? "highlight" : "";
      const html = `
        <div class="day ${isToday}">
          <h3>${weekdayName} ${isToday ? "(Today)" : ""}</h3>
          <img src="${forecast.day.condition.icon}" alt="icon">
          <p>${forecast.day.condition.text}</p>
          <p>${forecast.day.avgtemp_c} °C</p>
        </div>
      `;

      forecastDiv.innerHTML += html;
    }

    cityInput.value = "";
  } catch (err) {
    console.error(err);
    const forecastDiv = document.getElementById("forecast");
    if (forecastDiv)
      forecastDiv.innerHTML =
        "Error loading weather data. Please check the city/state/country name.";
  }
}

document.getElementById("city").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    loadWeather();
  }
});

getForecast.addEventListener("click", loadWeather);
