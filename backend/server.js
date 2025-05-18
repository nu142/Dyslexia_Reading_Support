// server.js
const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/questions/visual", async (req, res) => {
  const prompt =
    "Generate a visual dyslexia training question suitable for children.";
  const ollama = spawn("ollama", ["run", "mistral"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let output = "";
  ollama.stdout.on("data", (data) => (output += data.toString()));
  ollama.stdin.write(prompt);
  ollama.stdin.end();

  ollama.on("close", () => {
    res.json({ question: output.trim() });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
