alert("script loaded");

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

      if (!response.ok) return;

      const data = await response.json();

      showDashboard(
        user.displayName,
        data.role
      );

    } catch (err) {

      console.error(err);

    }

  }

});

/* =========================
   GOOGLE LOGIN
========================= */

document
  .getElementById("googleLogin")
  .addEventListener("click", async () => {

    console.log("button clicked");

    try {

      const result =
        await auth.signInWithPopup(provider);

      const user = result.user;

      console.log("Google login success");

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

    new Chart(ctx, {

      type: "line",

      data: {

        labels,

        datasets: [{

          label:
            "Bin Weight (g)",

          data: weights,

          borderColor:
            "#55ffd9",

          backgroundColor:
            "rgba(85,255,217,0.2)",

          tension: 0.4,

          fill: true,

          borderWidth: 3,

          pointBackgroundColor:
            "#55ffd9"

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

    const map =
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
    ).addTo(map);

    data.forEach(item => {

      L.marker([
        item.location.lat,
        item.location.lng
      ])
      .addTo(map)
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
   CUSTOM ALERT
========================= */

function showAlert(message){

  document.getElementById(
    "customAlert"
  ).style.display = "flex";

  document.getElementById(
    "alertText"
  ).innerText = message;

}

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