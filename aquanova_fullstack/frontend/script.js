/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyAPDVTQg2QdszsuI_OHKf0eONtVE7KzrCw",
  authDomain: "aquanova-auth.firebaseapp.com",
  projectId: "aquanova-auth",
  storageBucket: "aquanova-auth.firebasestorage.app",
  messagingSenderId: "758613244238",
  appId: "1:758613244238:web:550efcc2e86535dfdf061f",
  measurementId: "G-WNXTQNL3P8"
};

/* =========================
   FIREBASE INITIALIZE
========================= */

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

const provider =
  new firebase.auth.GoogleAuthProvider();

/* =========================
   BACKEND URL
========================= */

const API_URL =
  "https://aquanova-dashboard.onrender.com";

/* =========================
   THRESHOLD VALUE
========================= */

const THRESHOLD = 1;

/* =========================
   KEEP USER LOGGED IN
========================= */

auth.onAuthStateChanged(async (user) => {

  if (user) {

    try {

      const response = await fetch(
        `${API_URL}/api/auth/google-login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            name: user.displayName,
            email: user.email
          })
        }
      );

      if (!response.ok) {

        const err =
          await response.json();

        showAlert(err.message);

        await auth.signOut();

        return;

      }

      const data =
        await response.json();

      showDashboard(
        user.displayName,
        data.role
      );

    } catch (err) {

      console.error(err);

      showAlert(
        "Unable to connect to server"
      );

    }

  } else {

    document.getElementById(
      "loginSection"
    ).style.display = "flex";

    document.getElementById(
      "dashboard"
    ).style.display = "none";

  }

});

/* =========================
   GOOGLE LOGIN
========================= */

document
  .getElementById("googleLogin")
  .addEventListener("click", async () => {

    try {

      const result =
        await auth.signInWithPopup(provider);

      const user = result.user;

      const response = await fetch(
        `${API_URL}/api/auth/google-login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            name: user.displayName,
            email: user.email
          })
        }
      );

      if (!response.ok) {

        const err =
          await response.json();

        showAlert(err.message);

        await auth.signOut();

        return;

      }

      const data =
        await response.json();

      showDashboard(
        user.displayName,
        data.role
      );

      showSuccess(
        "Logged in Successfully"
      );

    } catch (err) {

      console.error(err);

      showAlert(err.message);

    }

});

/* =========================
   SHOW DASHBOARD
========================= */

function showDashboard(name, role) {

  document.getElementById(
    "loginSection"
  ).style.display = "none";

  document.getElementById(
    "dashboard"
  ).style.display = "block";

  document.getElementById(
    "userName"
  ).innerText = name;

  document.getElementById(
    "role"
  ).innerText =
    "Role: " + role;

  if (role === "admin") {

    document.getElementById(
      "adminPanel"
    ).style.display = "block";

  } else {

    document.getElementById(
      "adminPanel"
    ).style.display = "none";

  }

  loadSensorData();

}

/* =========================
   LOGOUT
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener("click", async () => {

    await auth.signOut();

    location.reload();

});

/* =========================
   SENSOR DATA
========================= */

let chartInstance = null;
let mapInstance = null;

async function loadSensorData() {

  try {

    const response = await fetch(
      `${API_URL}/api/sensor-data`
    );

    const data =
      await response.json();

    if (data.length === 0) return;

    const latest = data[0];

    /* =========================
       BIN WEIGHT
    ========================= */

    document.getElementById(
      "binWeight"
    ).innerText =
      latest.binWeight + " g";

    /* =========================
       THRESHOLD ALERT
    ========================= */

    if (latest.binWeight > THRESHOLD) {

      showThresholdPopup(
        "⚠ ALERT: Bin Level Exceeded Threshold!"
      );

    }

    /* =========================
       GPS TEXT
    ========================= */

    document.getElementById(
      "gpsText"
    ).innerText =
      "Latitude: " +
      latest.location.lat +
      " , Longitude: " +
      latest.location.lng;

    /* =========================
       CHART
    ========================= */

    const weights =
      data.map(item =>
        item.binWeight
      ).reverse();

    const labels =
      data.map((item, index) =>
        "Reading " +
        (index + 1)
      ).reverse();

    const ctx =
      document.getElementById(
        "weightChart"
      );

    if (chartInstance) {

      chartInstance.destroy();

    }

    chartInstance =
      new Chart(ctx, {

        type: "line",

        data: {

          labels,

          datasets: [{

            label:
              "Bin Weight (g)",

            data: weights,

            borderColor:
              latest.binWeight > THRESHOLD
                ? "red"
                : "#55ffd9",

            backgroundColor:
              latest.binWeight > THRESHOLD
                ? "rgba(255,0,0,0.2)"
                : "rgba(85,255,217,0.2)",

            tension: 0.4,

            fill: true,

            borderWidth: 3,

            pointBackgroundColor:
              latest.binWeight > THRESHOLD
                ? "red"
                : "#55ffd9"

          }]

        },

        options: {

          responsive: true,

          plugins: {

            legend: {

              labels: {
                color: "white"
              }

            }

          },

          scales: {

            x: {

              ticks: {
                color: "white"
              },

              grid: {
                color:
                  "rgba(255,255,255,0.1)"
              }

            },

            y: {

              ticks: {
                color: "white"
              },

              grid: {
                color:
                  "rgba(255,255,255,0.1)"
              }

            }

          }

        }

      });

    /* =========================
       MAP
    ========================= */

    if (mapInstance) {

      mapInstance.remove();

    }

    mapInstance =
      L.map("map").setView(
        [
          latest.location.lat,
          latest.location.lng
        ],
        13
      );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          "OpenStreetMap"
      }
    ).addTo(mapInstance);

    data.forEach(item => {

      L.marker([
        item.location.lat,
        item.location.lng
      ])
      .addTo(mapInstance)
      .bindPopup(
        "Weight: " +
        item.binWeight +
        " g"
      );

    });

  } catch (err) {

    console.error(err);

    showAlert(
      "Unable to load sensor data"
    );

  }

}

/* =========================
   NORMAL ALERT
========================= */

function showAlert(message){

  const alertBox =
    document.getElementById(
      "customAlert"
    );

  alertBox.style.display =
    "flex";

  document.getElementById(
    "alertText"
  ).innerText = message;

}

/* =========================
   THRESHOLD POPUP ALERT
========================= */

function showThresholdPopup(message){

  const popup =
    document.createElement("div");

  popup.innerText = message;

  popup.style.position = "fixed";
  popup.style.top = "30px";
  popup.style.right = "30px";
  popup.style.background = "red";
  popup.style.color = "white";
  popup.style.padding = "20px";
  popup.style.fontSize = "18px";
  popup.style.fontWeight = "bold";
  popup.style.borderRadius = "12px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow =
    "0 0 20px rgba(255,0,0,0.8)";

  document.body.appendChild(popup);

  setTimeout(() => {

    popup.remove();

  }, 5000);

}

/* =========================
   CLOSE ALERT
========================= */

function closeAlert(){

  document.getElementById(
    "customAlert"
  ).style.display = "none";

}

/* =========================
   SUCCESS NOTIFICATION
========================= */

function showSuccess(message){

  const notification =
    document.getElementById(
      "successNotification"
    );

  notification.innerText =
    message;

  notification.style.display =
    "block";

  setTimeout(() => {

    notification.style.display =
      "none";

  }, 3000);

}