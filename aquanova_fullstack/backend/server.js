const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* =========================
   USER SCHEMA
========================= */

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: {
    type: String,
    default: "user"
  }
});

const User = mongoose.model("User", userSchema);

/* =========================
   SENSOR DATA SCHEMA
========================= */

const sensorSchema = new mongoose.Schema({

  binWeight: Number,

  location: {
    lat: Number,
    lng: Number
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

const SensorData = mongoose.model("SensorData", sensorSchema);

/* =========================
   ALLOWED EMAILS
========================= */

const allowedEmails = [

  "pranjali.bidwe2904@gmail.com",
  "aaryaashtekar111@gmail.com",
  "chetnabendale04@gmail.com"

];

/* =========================
   GOOGLE LOGIN API
========================= */

app.post("/api/auth/google-login", async (req, res) => {

  try {

    const { name, email } = req.body;

    /* =========================
       CHECK AUTHORIZED USERS
    ========================= */

    if (!allowedEmails.includes(email)) {

      return res.status(403).json({
        message: "Unauthorized User"
      });

    }

    let user = await User.findOne({ email });

    if (!user) {

      user = await User.create({

        name,
        email,

        role:
          email === process.env.ADMIN_EMAIL
            ? "admin"
            : "user"

      });

    }

    res.json(user);

  } catch (err) {

    res.status(500).json({
      message: "Server Error"
    });

  }

});

/* =========================
   SAVE SENSOR DATA API
========================= */

app.post("/api/sensor-data", async (req, res) => {

  try {

    const { binWeight, lat, lng } = req.body;

    const newData = await SensorData.create({

      binWeight,

      location: {
        lat,
        lng
      }

    });

    res.json(newData);

  } catch (err) {

    res.status(500).json({
      message: "Error saving sensor data"
    });

  }

});

/* =========================
   GET SENSOR DATA API
========================= */

app.get("/api/sensor-data", async (req, res) => {

  try {

    const data = await SensorData.find()
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {

    res.status(500).json({
      message: "Error fetching sensor data"
    });

  }

});

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("Backend Running");
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});