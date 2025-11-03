// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // чтобы открывать HTML прямо по localhost:3000

// Подключение к MongoDB
mongoose.connect("mongodb://localhost:27017/usersDB")
  .then(() => console.log("✅ Подключено к MongoDB"))
  .catch((err) => console.error("❌ Ошибка подключения:", err));

// Схема и модель пользователя
const userSchema = new mongoose.Schema({
  login: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// 📩 Регистрация
app.post("/register", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).send("Логин и пароль обязательны");
  }

  const existingUser = await User.findOne({ login });
  if (existingUser) {
    return res.status(400).send("Такой логин уже существует");
  }

  const newUser = new User({ login, password });
  await newUser.save();

  res.status(200).send("Пользователь зарегистрирован");
});

// 🔑 Вход
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  const user = await User.findOne({ login, password });

  if (!user) {
    return res.status(401).send("Неверный логин или пароль");
  }

  res.status(200).send("Вход выполнен");
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
