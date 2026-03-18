// run-parser-server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Python: venv в проекте или системный python/py
const venvPython = path.join(__dirname, "venv", "Scripts", "python.exe");
const pythonCmd = existsSync(venvPython) ? `"${venvPython}"` : "python";

const app = express();
app.use(cors());

app.get("/run-parser", (req, res) => {
  const pythonScript = path.resolve(__dirname, "parser.py");

  console.log("▶ Запуск парсера:", pythonScript);

  exec(`${pythonCmd} "${pythonScript}"`, { timeout: 60_000 }, (error, stdout, stderr) => {
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
