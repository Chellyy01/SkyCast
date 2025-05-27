"use strict";

const alertBox = document.querySelector(".alert");
const getForecast = document.querySelector(".get-forecast-btn");
const btnLogin = document.querySelector(".btn-login");

// ===== LOGIN =====
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

const initMap = function (lat, lon) {
  if (window.mapInstance) {
    window.mapInstance.setView([lat, lon], 13);
  } else {
    window.mapInstance = L.map("map").setView([lat, lon], 13);
  }

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(window.mapInstance);

  L.marker([lat, lon]).addTo(window.mapInstance);
};

const updateWeatherDetails = function (dayData, isToday = false) {
  const uv = isToday ? window.currentWeatherData.current.uv : dayData.day.uv;
  const wind = isToday
    ? window.currentWeatherData.current.wind_kph
    : dayData.day.maxwind_kph;
  const humidity = isToday
    ? window.currentWeatherData.current.humidity
    : dayData.day.avghumidity;
  const pressure = isToday
    ? window.currentWeatherData.current.pressure_mb
    : null;

  document.getElementById("uv-index").textContent = uv;
  document.getElementById("wind").textContent = wind + " km/h";
  document.getElementById("humidity").textContent = humidity + "%";
  document.getElementById("pressure").textContent = pressure
    ? pressure + " hPa"
    : "N/A";

  document.querySelector(".weather-metrics").style.opacity = 10;
};

// Function to update summary for selected day
const updateSummary = function (
  dayData,
  cityName,
  cityCountry,
  isToday = false
) {
  const summaryEl = document.getElementById("summary");
  if (summaryEl) {
    const currentTemp = isToday
      ? window.currentWeatherData.current.temp_c
      : dayData.day.avgtemp_c;
    const condition = dayData.day.condition.text;
    const maxTemp = dayData.day.maxtemp_c;
    const minTemp = dayData.day.mintemp_c;

    summaryEl.innerHTML = `
      <h2>${cityName} ${cityCountry}</h2> 
      <h1>${currentTemp}°C</h1> 
      <div>
        <p>${condition}</p>
        <p>H: ${maxTemp}°C &nbsp;&nbsp; L: ${minTemp}°C</p>
      </div>
    `;
  }

  // 🟡 Update the bottom section
  updateWeatherDetails(dayData, isToday);
};

// Function to display hourly forecast for TODAY (starting from current hour)
const displayTodayHourlyForecast = function (data) {
  const hourlyForecastDiv = document.getElementById("hourly-forecast");
  hourlyForecastDiv.innerHTML = "";

  const localTimeString = data.location.localtime;
  const currentHour = parseInt(localTimeString.split(" ")[1].split(":")[0]);
  const todayHours = data.forecast.forecastday[0].hour;

  // Show next 24 hours (from current time)
  for (let i = currentHour; i < currentHour + 24; i++) {
    const hourData =
      i < 24 ? todayHours[i] : data.forecast.forecastday[1].hour[i - 24];

    if (!hourData) continue;

    const hourLabel = i === currentHour ? "Now" : hourData.time.split(" ")[1];

    const hourHtml = `
      <div class="hour">
        <p><strong>${hourLabel}</strong></p>
        <img src="${hourData.condition.icon}" alt="icon" />
        <p>${hourData.condition.text}</p>
        <p>${hourData.temp_c} °C</p>
      </div>
    `;

    hourlyForecastDiv.style.opacity = "10";
    hourlyForecastDiv.innerHTML += hourHtml;
  }
};

// Function to display hourly forecast for OTHER DAYS (starting from midnight)
const displayOtherDayHourlyForecast = function (selectedDay) {
  const hourlyForecastDiv = document.getElementById("hourly-forecast");
  hourlyForecastDiv.innerHTML = "";

  selectedDay.hour.forEach((hourData) => {
    const hourHtml = `
        <div class="hour">
          <p><strong>${hourData.time.split(" ")[1]}</strong></p>
          <img src="${hourData.condition.icon}" alt="icon" />
          <p>${hourData.condition.text}</p>
          <p>${hourData.temp_c} °C</p>
        </div>
      `;
    hourlyForecastDiv.innerHTML += hourHtml;
  });
};

const loadWeather = async function () {
  const cityInput = document.getElementById("city");
  const city = cityInput ? cityInput.value.trim() : "";

  if (!city) {
    alertBox.textContent = `Please input a valid city/location`;
    return;
  } else {
    alertBox.textContent = "";
  }

  const apiKey = "1273d9b9806f4ea387e94727251405";
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log(data);

    if (!res.ok || data.error) {
      alertBox.textContent = `Please input a valid city/location`;
      return;
    }

    // Store weather data globally for summary updates
    window.currentWeatherData = data;

    const searchSection = document.getElementById("search-section");
    if (searchSection) searchSection.style.display = "none";

    document.getElementById("back-btn").style.display = "block";

    const todayForecast = data.forecast.forecastday[0];
    const cityName = data.location.name;
    const cityCountry = data.location.country;

    // Initial summary for today
    updateSummary(todayForecast, cityName, cityCountry, true);

    const lat = data.location.lat;
    const lon = data.location.lon;

    initMap(lat, lon);
    document.getElementById("map").style.display = "block";

    const inputNormalized = city.toLowerCase().replace(/\s+/g, "");
    const resultNameNormalized = data.location.name
      .toLowerCase()
      .replace(/\s+/g, "");

    if (!resultNameNormalized.includes(inputNormalized)) {
      alertBox.textContent = "Please input a valid city/location";
      return;
    }

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

      if (forecast.day.condition.text.includes("Rain")) {
        document.body.style.backgroundColor = "#6e7f80";
      }
      const isToday = i === 0 ? "highlight" : "";

      const html = `
  <div class="day ${isToday}" data-date="${forecast.date}">
    <h3>${weekdayName} ${isToday ? "(Today)" : ""}</h3>
    <img src="${forecast.day.condition.icon}" alt="icon">
    <p>${forecast.day.condition.text}</p>
    <p>${forecast.day.avgtemp_c} °C</p>
  </div>
`;

      forecastDiv.innerHTML += html;
    }

    cityInput.value = "";

    // Show 24-hour forecast for today immediately (from current hour)
    displayTodayHourlyForecast(data);

    // Handle day clicks
    document.querySelectorAll(".day").forEach((dayEl) => {
      dayEl.addEventListener("click", () => {
        const selectedDate = dayEl.dataset.date;
        const selectedDay = data.forecast.forecastday.find(
          (d) => d.date === selectedDate
        );
        const todayDate = new Date().toISOString().split("T")[0];

        if (!selectedDay) return;

        // Update summary for selected day
        const isToday = selectedDate === todayDate;
        updateSummary(selectedDay, cityName, cityCountry, isToday);

        // Remove highlight from all days
        document
          .querySelectorAll(".day")
          .forEach((d) => d.classList.remove("highlight"));
        // Add highlight to selected day
        dayEl.classList.add("highlight");

        // Check if selected day is today
        if (selectedDate === todayDate) {
          // Show today's forecast starting from current hour
          displayTodayHourlyForecast(data);
        } else {
          // Show other day's forecast starting from midnight
          displayOtherDayHourlyForecast(selectedDay);
        }
      });
    });
  } catch (err) {
    console.error(err);
    const forecastDiv = document.getElementById("forecast");
    if (forecastDiv)
      forecastDiv.innerHTML =
        "Error loading weather data. Please check the city/state/country name.";
  }
};

const cityInput = document.getElementById("city");
if (cityInput) {
  cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      loadWeather();
    }
  });
}

//Back button implementation
document.getElementById("back-btn")?.addEventListener("click", () => {
  document.getElementById("forecast").innerHTML = "";
  document.getElementById("hourly-forecast").style.opacity = 0;
  document.getElementById("hourly-forecast").innerHTML = "";

  document.getElementById("summary").innerHTML = "";
  document.getElementById("city").value = "";

  document.getElementById("search-section").style.display = "block";
  document.getElementById("back-btn").style.display = "none";
  document.getElementById("map").style.display = "none";

  document.querySelector(".weather-metrics").style.opacity = 0;
});

if (getForecast) {
  getForecast.addEventListener("click", loadWeather);
}
