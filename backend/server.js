const express = require("express");
const cors = require("cors");
const matchCareers = require("./logic/careerMatcher");
const getAIAdvice = require("./logic/aiAdvisor");

const app = express();

app.use(cors());
app.use(express.json());

function normalizeInputList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase());
}

function sanitizeStudentData(rawData = {}) {
  const math = Number(rawData?.marks?.math ?? rawData?.math ?? 0);
  const ageRaw = Number(rawData?.age);

  return {
    name: String(rawData.name || "").trim(),
    age: Number.isFinite(ageRaw) ? ageRaw : null,
    interests: normalizeInputList(rawData.interests),
    marks: { math: Number.isFinite(math) ? math : 0 },
    aptitude: normalizeInputList(rawData.aptitude),
    personality: normalizeInputList(rawData.personality),
    financial: String(rawData.financial || "low").toLowerCase(),
    location: String(rawData.location || "urban").toLowerCase(),
    language: String(rawData.language || "english").toLowerCase()
  };
}

app.get("/", (req, res) => {
  res.send("AI Career Guidance Running");
});

app.post("/career-guidance", async (req, res) => {
  const studentData = sanitizeStudentData(req.body);

  const matches = matchCareers(studentData);
  const aiAdvice = await getAIAdvice(studentData, matches);

  res.json({
    matches,
    ai_advice: aiAdvice,
    best_match_debug: matches[0],
    meta: {
      language: studentData.language,
      age: studentData.age,
      realistic_matches_count: matches.length
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
