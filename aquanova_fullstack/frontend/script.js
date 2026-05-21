alert("script loaded");
/* =========================
   SENSOR DATA
========================= */

async function loadSensorData() {

  try {

    const response = await fetch(
      `${API_URL}/api/sensor-data`
    );

    const data = await response.json();

    if (data.length === 0) return;

    const latest = data[0];

    /* =========================
       BIN WEIGHT
    ========================= */

    document.getElementById("binWeight")
      .innerText = latest.binWeight + " g";

    /* =========================
       GPS TEXT
    ========================= */

    document.getElementById("gpsText")
      .innerText =
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
        "Reading " + (index + 1)
      ).reverse();

    const ctx =
      document.getElementById("weightChart");

    new Chart(ctx, {

      type: "line",

      data: {

        labels,

        datasets: [{

          label: "Bin Weight (g)",

          data: weights,

          borderColor: "#55ffd9",

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

    const map = L.map("map").setView(
      [
        latest.location.lat,
        latest.location.lng
      ],
      13
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "OpenStreetMap"
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

    showAlert(
      "Unable to load sensor data"
    );

  }

}