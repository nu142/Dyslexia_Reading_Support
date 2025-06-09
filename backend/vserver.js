const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express(); // ✅ Make sure this comes before app.use

const PORT = process.env.PORT || 3000;

app.use(cors());

// ✅ Serve static files from public folder
app.use(express.static(path.join(__dirname, "../public")));

// ✅ Your Gemini setup and API route
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



async function getDyslexiaQuestions(type = "visual", level = 1) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const difficultyPrompt =
    level == 1
      ? "very basic and easy"
      : level == 2
      ? "moderate difficulty"
      : level == 3
      ? "a bit more difficult, challenging patterns"
      : "very basic and easy";

  const promptMap = {
    visual: `Generate 10 multiple choice questions for children with visual dyslexia. Each question should ask the user to identify letters or patterns that are visually different. The questions should be ${difficultyPrompt}. Provide the response in the following JSON format:

[
  {
    "question": "check for matching symbols?",
    "symbol": "◊",
    "options": ["◊", "◇", "∆", "∇"],
    "correct": "◊"
  },
  ...
]`,
    phonological: `Generate 10 phonological awareness questions for dyslexic children...
    Each question should ask the user to identify sounds or syllables in words. The questions should be ${difficultyPrompt}. Provide the response in the following JSON format:

[
  {
    "question": "What sound does the letter 'B' make?",
    "options": ["B", "D", "P", "T"],
    "correct": "B"
  },
  ...
]`,
    memory: `Generate 10 questions to test short-term memory recall in dyslexic children. Each question should present a short list of items and ask the user to recall them. The questions should be ${difficultyPrompt}. Provide the response in the following JSON format:

[
  {
    "question": "Remember these words: apple, banana, cherry. What was the second word?",
    "options": ["Apple", "Banana", "Cherry", "Date"],
    "correct": "Banana"
  },
  ...
]`,
    mathematics: `Generate 10 math-related dyslexia (dyscalculia) multiple choice questions for children. Each question should ask the user to solve simple math problems or identify numbers. The questions should be ${difficultyPrompt}. Provide the response in the following JSON format:
    [
      {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correct": "4"
      },
      ...
    ]`,
    auditory: `Generate 10 auditory discrimination questions for dyslexic children. Each question should ask the user to identify sounds or words based on auditory cues. The questions should be ${difficultyPrompt}. Provide the response in the following JSON format:
    [
      {
        "question": "What sound does the letter 'A' make?",
        "options": ["A", "E", "I", "O"],
        "correct": "A"
      },
      ...
    ]`,
  };

  const prompt = promptMap[type.toLowerCase()] || promptMap["visual"];
  console.log(`🔍 Generating ${type} level ${level} questions...`);
  const result = await model.generateContent(prompt);
  const text = await result.response.text();

  try {
    const startIndex = text.indexOf("[");
    const endIndex = text.lastIndexOf("]") + 1;
    const jsonSubstring = text.substring(startIndex, endIndex);
    const questions = JSON.parse(jsonSubstring).map((q) => ({
      ...q,
      attempted: false,
    }));
    console.log(`📦 Generated ${type} level ${level} questions:\n`, questions);
    return questions;
  } catch (err) {
    throw new Error("Gemini returned invalid JSON");
  }
}


app.get("/api/dyslexia-questions", async (req, res) => {
  try {
    const level = parseInt(req.query.level) || 1;
    const type = req.query.type || "visual";
    console.log(`🔍 Fetching ${type} questions for level ${level}...`);
    const questions = await getDyslexiaQuestions(type, level);
    res.json(questions);
  } catch (error) {
    console.error("Error fetching Gemini questions:", error);
    res.status(500).json({ error: "Failed to fetch questions from Gemini" });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
