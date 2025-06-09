const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

// ✅ Replace this with your actual Gemini API key
require("dotenv").config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


app.use(express.json());
app.use(express.static("public"));

// POST endpoint to generate visual dyslexia question
app.post("/api/questions/visual", async (req, res) => {
  const prompt =
    "generate a visual dyslexia training question and 3 options never,sometime,often(only one question) generate only question and no other description"; //"Generate a visual dyslexia training question suitable for children. It should involve identifying differences between similar-looking letters (like 'b' vs 'd') in a fun and engaging way. Format it as a simple sentence or instruction children can understand.";

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            //role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const output =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    if (output) {
      res.json({ question: output.trim() });
    } else {
      res.status(500).json({ question: "No question generated." });
    }
  } catch (error) {
    console.error("Gemini API error:", error.message);
    res
      .status(500)
      .json({ question: "Error generating question", details: error.message });
  }
});

// Serve the HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "tbd.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
