const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* =========================
   USER SCHEMA
========================= */

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: {
    type: String,
    default: "user",
  },
});

const User = mongoose.model("User", userSchema);

/* =========================
   SENSOR DATA SCHEMA
========================= */

const sensorSchema = new mongoose.Schema({
  boatId: {
    type: String,
    required: true,
  },

  binWeight: Number,

  location: {
    lat: Number,
    lng: Number,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SensorData = mongoose.model("SensorData", sensorSchema);

/* =========================
   BOAT SCHEMA
========================= */

const boatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const Boat = mongoose.model("Boat", boatSchema);

/* =========================
   ADD BOAT API
========================= */

app.post("/api/boats", async (req, res) => {
  try {
    const { name } = req.body;

    const boat = await Boat.create({
      name,
    });

    await SensorData.create({
      boatId: boat._id.toString(),

      binWeight: 0,

      location: {
        lat: 0,
        lng: 0,
      },
    });

    res.json(boat);
  } catch (err) {
    res.status(500).json({
      message: "Error adding boat",
    });
  }
});

/* =========================
   GET BOATS API
========================= */

app.get("/api/boats", async (req, res) => {
  try {
    const boats = await Boat.find();

    res.json(boats);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching boats",
    });
  }
});

/* =========================
   DELETE BOAT API
========================= */

app.delete("/api/boats/:id", async (req, res) => {
  try {
    await Boat.findByIdAndDelete(req.params.id);

    await SensorData.deleteMany({
      boatId: req.params.id,
    });

    res.json({
      message: "Boat Deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting boat",
    });
  }
});

/* =========================
   ADD USER API
========================= */

app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,

      email,

      role: email === process.env.ADMIN_EMAIL ? "admin" : "user",
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Error adding user",
    });
  }
});

/* =========================
   DELETE USER API
========================= */

app.delete("/api/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "User Deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting user",
    });
  }
});

/* =========================
   DELETE USER BY EMAIL
========================= */

app.delete("/api/users/email/:email", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      email: req.params.email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    res.json({
      message: "User Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting user",
    });
  }
});

/* =========================
   GOOGLE LOGIN API
========================= */

app.post("/api/auth/google-login", async (req, res) => {
  try {
    const { name, email } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({
        message: "User Not Authorized",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

/* =========================
   SAVE SENSOR DATA API
========================= */

app.post("/api/sensor-data", async (req, res) => {
  try {
    const { boatId, binWeight, lat, lng } = req.body;

    const newData = await SensorData.create({
      boatId,

      binWeight,

      location: {
        lat,
        lng,
      },
    });

    res.json(newData);
  } catch (err) {
    res.status(500).json({
      message: "Error saving sensor data",
    });
  }
});

/* =========================
   GET SENSOR DATA BY BOAT
========================= */

app.get("/api/sensor-data/:boatId", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ createdAt: -1 });

    const formattedData = data.map((item) => ({
      ...item.toObject(),

      "Date and Time": new Date(item.createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    }));

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching sensor data",
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
