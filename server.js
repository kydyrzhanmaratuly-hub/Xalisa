// server.js (ОБНОВЛЕННАЯ ВЕРСИЯ С РАСПИСАНИЯМИ)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); 

// Подключение к MongoDB
mongoose.connect("mongodb://localhost:27017/usersDB_final") 
  .then(() => console.log("✅ Подключено к MongoDB (usersDB_final)"))
  .catch((err) => console.error("❌ Ошибка подключения:", err));

// Схема пользователя
const userSchema = new mongoose.Schema({
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  group: { type: String, required: true },
  course: { type: Number, required: true }
});

const User = mongoose.model("User", userSchema);

// Регистрация
app.post("/register", async (req, res) => {
  const { login, password, name, email, group, course } = req.body;

  if (!login || !password || !name || !email || !group || !course) {
    return res.status(400).send({ message: "Все поля обязательны для заполнения." });
  }

  try {
    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(400).send({ message: "Такой логин уже существует." });
    }

    const newUser = new User({ login, password, name, email, group, course: parseInt(course) });
    await newUser.save();

    res.status(201).send({ message: "Пользователь успешно зарегистрирован." });
  } catch (error) {
      console.error("Ошибка при регистрации:", error);
      res.status(500).send({ message: "Внутренняя ошибка сервера." });
  }
});

// Вход
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).send({ message: "Логин и пароль обязательны." });
  }

  try {
    const user = await User.findOne({ login });

    if (!user || user.password !== password) {
      return res.status(401).send({ message: "Неверный логин или пароль." });
    }

    const userResponse = {
        login: user.login,
        name: user.name,
        email: user.email,
        group: user.group,
        course: user.course,
    };
    
    res.status(200).send({ message: "Вход успешен!", user: userResponse });
  } catch (error) {
      console.error("Ошибка при входе:", error);
      res.status(500).send({ message: "Внутренняя ошибка сервера." });
  }
});

// =========================================================
// НОВЫЙ ЭНДПОИНТ: ПОЛУЧЕНИЕ РАСПИСАНИЯ ПО ГРУППЕ
// =========================================================

// Временные слоты (15-минутные интервалы с 7:00 до 18:00)
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 18; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            slots.push(time);
            if (hour === 18 && min === 0) break; // Останавливаемся на 18:00
        }
    }
    return slots;
};

// Расписания для разных групп
const scheduleData = {
    "ИС-204": [
        { day: "Понедельник", subject: "Высшая математика", start: "08:00", end: "09:30", room: "Ауд. 301", type: "math-class" },
        { day: "Понедельник", subject: "Программирование", start: "10:00", end: "11:30", room: "Ауд. 205", type: "prog-class" },
        { day: "Понедельник", subject: "Английский язык", start: "12:00", end: "13:30", room: "Ауд. 102", type: "lang-class" },
        { day: "Вторник", subject: "Базы данных", start: "08:00", end: "09:30", room: "Ауд. 210", type: "prog-class" },
        { day: "Вторник", subject: "Веб-разработка", start: "10:00", end: "11:30", room: "Ауд. 208", type: "prog-class" },
        { day: "Вторник", subject: "Физика", start: "13:00", end: "14:30", room: "Ауд. 405", type: "science-class" },
        { day: "Среда", subject: "Дискретная математика", start: "09:00", end: "10:30", room: "Ауд. 303", type: "math-class" },
        { day: "Среда", subject: "Алгоритмы", start: "11:00", end: "12:30", room: "Ауд. 207", type: "prog-class" },
        { day: "Среда", subject: "Дизайн интерфейсов", start: "14:00", end: "15:30", room: "Ауд. 110", type: "design-class" },
        { day: "Четверг", subject: "Операционные системы", start: "08:00", end: "09:30", room: "Ауд. 212", type: "prog-class" },
        { day: "Четверг", subject: "Сети и протоколы", start: "10:00", end: "11:30", room: "Ауд. 215", type: "prog-class" },
        { day: "Четверг", subject: "Философия", start: "13:00", end: "14:30", room: "Ауд. 501", type: "lang-class" },
        { day: "Пятница", subject: "Проектирование ПО", start: "09:00", end: "10:30", room: "Ауд. 209", type: "prog-class" },
        { day: "Пятница", subject: "Физкультура", start: "11:00", end: "12:30", room: "Спорт. зал", type: "science-class" },
    ],
    
    "АТ-201": [
        { day: "Понедельник", subject: "Высшая математика", start: "09:00", end: "10:30", room: "Ауд. 302", type: "math-class" },
        { day: "Понедельник", subject: "Физика", start: "11:00", end: "12:30", room: "Ауд. 406", type: "science-class" },
        { day: "Вторник", subject: "Теория автоматов", start: "08:00", end: "09:30", room: "Ауд. 310", type: "prog-class" },
        { day: "Вторник", subject: "Микроэлектроника", start: "10:00", end: "11:30", room: "Ауд. 408", type: "science-class" },
        { day: "Среда", subject: "Программирование", start: "09:00", end: "10:30", room: "Ауд. 206", type: "prog-class" },
        { day: "Среда", subject: "Схемотехника", start: "12:00", end: "13:30", room: "Ауд. 410", type: "science-class" },
        { day: "Четверг", subject: "Английский язык", start: "10:00", end: "11:30", room: "Ауд. 103", type: "lang-class" },
        { day: "Четверг", subject: "Цифровая обработка", start: "13:00", end: "14:30", room: "Ауд. 312", type: "prog-class" },
        { day: "Пятница", subject: "Системы управления", start: "08:00", end: "09:30", room: "Ауд. 315", type: "prog-class" },
    ],
    
    "БИ-301": [
        { day: "Понедельник", subject: "Биохимия", start: "08:00", end: "09:30", room: "Лаб. 101", type: "science-class" },
        { day: "Понедельник", subject: "Генетика", start: "10:00", end: "11:30", room: "Ауд. 520", type: "science-class" },
        { day: "Понедельник", subject: "Английский язык", start: "13:00", end: "14:30", room: "Ауд. 104", type: "lang-class" },
        { day: "Вторник", subject: "Молекулярная биология", start: "09:00", end: "10:30", room: "Лаб. 102", type: "science-class" },
        { day: "Вторник", subject: "Биостатистика", start: "11:00", end: "12:30", room: "Ауд. 305", type: "math-class" },
        { day: "Среда", subject: "Микробиология", start: "08:00", end: "09:30", room: "Лаб. 103", type: "science-class" },
        { day: "Среда", subject: "Биоинформатика", start: "10:00", end: "11:30", room: "Ауд. 220", type: "prog-class" },
        { day: "Четверг", subject: "Экология", start: "09:00", end: "10:30", room: "Ауд. 525", type: "science-class" },
        { day: "Четверг", subject: "Физиология", start: "12:00", end: "13:30", room: "Ауд. 522", type: "science-class" },
        { day: "Пятница", subject: "Биоэтика", start: "10:00", end: "11:30", room: "Ауд. 530", type: "lang-class" },
        { day: "Пятница", subject: "Исследовательский семинар", start: "13:00", end: "14:30", room: "Ауд. 535", type: "design-class" },
    ],
    
    "ЭК-401": [
        { day: "Понедельник", subject: "Макроэкономика", start: "09:00", end: "10:30", room: "Ауд. 601", type: "math-class" },
        { day: "Понедельник", subject: "Финансовый менеджмент", start: "11:00", end: "12:30", room: "Ауд. 605", type: "design-class" },
        { day: "Вторник", subject: "Бухгалтерский учет", start: "10:00", end: "11:30", room: "Ауд. 610", type: "math-class" },
        { day: "Вторник", subject: "Маркетинг", start: "13:00", end: "14:30", room: "Ауд. 615", type: "design-class" },
        { day: "Среда", subject: "Английский язык", start: "08:00", end: "09:30", room: "Ауд. 105", type: "lang-class" },
        { day: "Среда", subject: "Эконометрика", start: "10:00", end: "11:30", room: "Ауд. 608", type: "math-class" },
        { day: "Четверг", subject: "Корпоративные финансы", start: "09:00", end: "10:30", room: "Ауд. 612", type: "math-class" },
        { day: "Пятница", subject: "Бизнес-планирование", start: "11:00", end: "12:30", room: "Ауд. 620", type: "design-class" },
    ],
    
    "ЮР-202": [
        { day: "Понедельник", subject: "Гражданское право", start: "08:00", end: "09:30", room: "Ауд. 701", type: "lang-class" },
        { day: "Понедельник", subject: "Уголовное право", start: "10:00", end: "11:30", room: "Ауд. 705", type: "lang-class" },
        { day: "Понедельник", subject: "Философия права", start: "13:00", end: "14:30", room: "Ауд. 710", type: "lang-class" },
        { day: "Вторник", subject: "Конституционное право", start: "09:00", end: "10:30", room: "Ауд. 702", type: "lang-class" },
        { day: "Вторник", subject: "Английский язык", start: "11:00", end: "12:30", room: "Ауд. 106", type: "lang-class" },
        { day: "Среда", subject: "Процессуальное право", start: "10:00", end: "11:30", room: "Ауд. 708", type: "lang-class" },
        { day: "Среда", subject: "Римское право", start: "13:00", end: "14:30", room: "Ауд. 712", type: "lang-class" },
        { day: "Четверг", subject: "Трудовое право", start: "08:00", end: "09:30", room: "Ауд. 703", type: "lang-class" },
        { day: "Четверг", subject: "Международное право", start: "11:00", end: "12:30", room: "Ауд. 715", type: "lang-class" },
        { day: "Пятница", subject: "Криминалистика", start: "09:00", end: "10:30", room: "Ауд. 720", type: "science-class" },
        { day: "Пятница", subject: "Юридическая практика", start: "12:00", end: "13:30", room: "Ауд. 725", type: "design-class" },
    ],
    
    "МЕД-303": [
        { day: "Понедельник", subject: "Анатомия", start: "08:00", end: "09:30", room: "Лаб. 201", type: "science-class" },
        { day: "Понедельник", subject: "Физиология", start: "10:00", end: "11:30", room: "Ауд. 801", type: "science-class" },
        { day: "Вторник", subject: "Патология", start: "08:00", end: "09:30", room: "Лаб. 202", type: "science-class" },
        { day: "Вторник", subject: "Фармакология", start: "11:00", end: "12:30", room: "Ауд. 805", type: "science-class" },
        { day: "Среда", subject: "Клиническая практика", start: "09:00", end: "10:30", room: "Клиника", type: "design-class" },
        { day: "Среда", subject: "Биохимия", start: "12:00", end: "13:30", room: "Лаб. 203", type: "science-class" },
        { day: "Четверг", subject: "Хирургия", start: "08:00", end: "09:30", room: "Ауд. 810", type: "science-class" },
        { day: "Четверг", subject: "Английский язык", start: "11:00", end: "12:30", room: "Ауд. 107", type: "lang-class" },
        { day: "Пятница", subject: "Терапия", start: "09:00", end: "10:30", room: "Ауд. 815", type: "science-class" },
    ]
};

app.get("/api/schedule/:group", (req, res) => {
    const group = decodeURIComponent(req.params.group);
    
    const schedule = scheduleData[group];
    
    if (!schedule) {
        return res.status(404).json({ 
            message: `Расписание для группы "${group}" не найдено.`,
            availableGroups: Object.keys(scheduleData)
        });
    }
    
    res.json({
        group: group,
        schedule: schedule,
        timeSlots: generateTimeSlots()
    });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});

