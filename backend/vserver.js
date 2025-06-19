const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const express = require('express'); // Ensure Express is imported



dotenv.config();


const app = express(); // ✅ Make sure this comes before app.use
const PORT = process.env.PORT || 3000;
const MONGO_URI = 'mongodb+srv://Dbuser777:qwerty777@fs.2rve44w.mongodb.net/fs?retryWrites=true&w=majority&appName=FS'; // Default to local MongoDB if not set
console.log('MONGO_URI:', MONGO_URI);

app.use(cors());
app.use(bodyParser.json()); // Parse JSON payloads

// ✅ Serve static files from public folder
app.use(express.static(path.join(__dirname, "../public")));

// ✅ Connect to MongoDB
if (!MONGO_URI) {
    console.error('❌ MongoDB URI is undefined. Check your .env file.');
    process.exit(1); // Exit the application
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ Error connecting to MongoDB:', err));

// ✅ Mount Authentication Routes
app.use("/auth", authRoutes);

// ✅ Your Gemini setup and API route
const genAI = new GoogleGenerativeAI('AIzaSyAtVHDSkPkkAu2UuRtSleZByEnsjqpWZbU');



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
        visual: `Generate 10 multiple choice questions designed for children with visual dyslexia. These questions should focus on visual discrimination—such as distinguishing between similar-looking letters, symbols, or shapes. The questions should be ${difficultyPrompt}. Present questions with one correct answer and three plausible distractors.
      
      Provide your response in the following JSON format(make sure to use key like question,symbol,options,correct only):
      [
        {
          "question": "Which symbol matches the one shown?",
          "symbol": "◊",
          "options": ["◊", "◇", "∆", "∇"],
          "correct": "◊"
        },
        ...
      ]`,

        phonological: `Generate 10 multiple choice questions to test phonological awareness in children with dyslexia. These questions should focus on identifying sounds, rhyming patterns, or syllable recognition. Adjust complexity according to this level: ${difficultyPrompt}. Ensure each question has four options with only one correct answer.
      
      Use this JSON format:
      [
        {
          "question": "Which word rhymes with 'cat'?",
          "options": ["Hat", "Dog", "Bus", "Car"],
          "correct": "Hat"
        },
        ...
      ]`,

        memory: `Generate 10 short-term memory recall questions suitable for children with dyslexia. At each level of difficulty (${difficultyPrompt}), present a list of 3–5 items that the child must remember. Then ask a question about one item’s position or content. Only one correct answer among four options.
      
      make sure the generated question are of the  below format
      [
        {"Remember": Apple, Banana, Cherry {
          "question": "What was the second item?",
          "options": ["Apple", "Banana", "Cherry", "Mango"],
          "correct": "Banana"
        },
        ...
      ]`,

        mathematics: `Generate 10 multiple choice questions focused on dyscalculia (math-related dyslexia). The questions should be ${difficultyPrompt} and should cover basic arithmetic, number recognition, or pattern identification. Only one correct answer per question.
      
      Respond in this JSON format:
      [
        {
          "question": "What is 5 + 3?",
          "options": ["6", "7", "8", "9"],
          "correct": "8"
        },
        ...
      ]`,

        auditory: `Generate 10 auditory discrimination questions for children with dyslexia. Each question should ask the child to identify the correct sound or word based on an auditory cue or spoken instruction. Adjust question difficulty to be ${difficultyPrompt}. Include phonetic or word recognition tasks.
      
      Use this response format:
      [
        {
          "question": "Which word begins with the same sound as 'ball'?",
          "options": ["Bat", "Cat", "Tall", "Dog"],
          "correct": "Bat"
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
