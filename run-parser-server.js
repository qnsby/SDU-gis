// run-parser-server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";

const app = express();
app.use(cors());

app.get("/run-parser", (req, res) => {
  // абсолютный путь к Python-скрипту
  const pythonScript = path.resolve("./parser.py");

  console.log("▶ Запуск парсера:", pythonScript);

  exec(`py "${pythonScript}"`, { timeout: 60_000 }, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Ошибка выполнения парсера:", error);
      return res.status(500).send(`Ошибка: ${error.message}`);
    }
    if (stderr) console.error("⚠️ stderr:", stderr);

    console.log("✅ Парсер выполнен успешно.");
    console.log(stdout);

    res.send("✅ Парсер успешно выполнен");
  });
});

const PORT = 7777;
app.listen(PORT, () => {
  console.log(`🚀 Сервер для парсера запущен на http://localhost:${PORT}`);
});
