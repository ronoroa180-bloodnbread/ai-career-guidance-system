const axios = require("axios");
require("dotenv").config();

function getLanguageConfig(language) {
  const selected = String(language || "english").toLowerCase();
  if (selected === "hindi") {
    return {
      code: "hi",
      name: "Hindi",
      mustUseHindi: true
    };
  }
  return {
    code: "en",
    name: "English",
    mustUseHindi: false
  };
}

function getAgeRoadmapHint(age, languageConfig) {
  const lang = languageConfig.mustUseHindi ? "hi" : "en";
  if (!Number.isFinite(age)) {
    return lang === "hi"
      ? "उम्र नहीं दी गई है, इसलिए रोडमैप को निकट अवधि (0-6 महीने), मध्य अवधि (6-24 महीने) और दीर्घ अवधि (2+ वर्ष) में बनाएं।"
      : "Age is not provided, so build roadmap in near-term (0-6 months), mid-term (6-24 months), and long-term (2+ years).";
  }

  if (age <= 14) {
    return lang === "hi"
      ? "रोडमैप आयु 14 या उससे कम के लिए बनाएं: foundation, exploration, class selection."
      : "Build roadmap for age 14 or below: foundation, exploration, class selection.";
  }
  if (age <= 17) {
    return lang === "hi"
      ? "रोडमैप आयु 15-17 के लिए बनाएं: बोर्ड/एंट्रेंस तैयारी, बेसिक स्किल पोर्टफोलियो, शुरुआती प्रमाणपत्र।"
      : "Build roadmap for age 15-17: board/entrance prep, skill portfolio, starter certifications.";
  }
  if (age <= 22) {
    return lang === "hi"
      ? "रोडमैप आयु 18-22 के लिए बनाएं: डिप्लोमा/डिग्री/ITI विकल्प, इंटर्नशिप, जॉब-रेडी स्किल।"
      : "Build roadmap for age 18-22: degree/diploma/ITI choices, internships, job-ready skills.";
  }
  return lang === "hi"
    ? "रोडमैप वयस्क शिक्षार्थी के लिए बनाएं: तेज री-स्किलिंग, प्रमाणपत्र, और आय-सक्षम भूमिकाएं।"
    : "Build roadmap for adult learner: accelerated reskilling, certifications, and income-ready roles.";
}

function getGovtSchemes(studentData, matchedCareers) {
  const schemes = [];
  const financial = String(studentData.financial || "").toLowerCase();
  const location = String(studentData.location || "").toLowerCase();
  const topCategories = new Set((matchedCareers || []).map((m) => String(m.category || "")));

  if (financial === "low") {
    schemes.push(
      "NSP (National Scholarship Portal) - central/state scholarships for eligible students",
      "PM-YASASVI Scholarship - support for eligible OBC/EBC/DNT students",
      "PM eVIDYA + DIKSHA - free learning content for school and skill prep"
    );
  }

  if (location === "rural") {
    schemes.push(
      "DDU-GKY - placement-linked skilling for rural youth",
      "PMKVY (Pradhan Mantri Kaushal Vikas Yojana) - free short-term skill courses"
    );
  } else {
    schemes.push("NAPS - apprenticeship opportunities with stipend in industry");
  }

  if (topCategories.has("Agriculture")) {
    schemes.push(
      "Agri-Clinics & Agri-Business Centres - agri entrepreneurship support",
      "Kisan Credit Card - credit support for agriculture activities"
    );
  }

  if (topCategories.has("Government") || topCategories.has("Defense")) {
    schemes.push(
      "NCC / Sainik School preparation pathways (state-specific support varies)",
      "Free coaching schemes by state welfare departments for competitive exams"
    );
  }

  if (topCategories.has("IT") || topCategories.has("Technical")) {
    schemes.push(
      "Skill India Digital Hub - digital training and certification pathways",
      "CSC Academy programs - digital and entrepreneurial skilling modules"
    );
  }

  return [...new Set(schemes)].slice(0, 8);
}

function stripMarkdownCodeFences(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function containsUnsafeSuggestions(text) {
  const combined = String(text || "").toLowerCase();
  const blocked = [
    "betting",
    "gambling",
    "hack",
    "illegal",
    "fraud",
    "dark web",
    "money laundering"
  ];
  return blocked.some((word) => combined.includes(word));
}

function isLikelyHindi(text) {
  return /[\u0900-\u097F]/.test(String(text || ""));
}

function toStringList(input) {
  if (!Array.isArray(input)) return [];
  return input.map((v) => String(v)).filter(Boolean);
}

function buildFallbackAdvice(studentData, matchedCareers, baseSchemes, languageConfig) {
  const best = matchedCareers?.[0]?.career || "Skilled Career Path";
  const age = Number(studentData.age);

  if (languageConfig.mustUseHindi) {
    return {
      recommended_career: best,
      reason: `${best} आपकी रुचि, योग्यता और वर्तमान परिस्थितियों के आधार पर एक व्यावहारिक विकल्प है।`,
      aptitude_reasoning:
        matchedCareers?.[0]?.aptitude_reasoning ||
        "आपकी योग्यता प्रोफाइल को देखते हुए इस क्षेत्र में नियमित अभ्यास से अच्छा प्रदर्शन संभव है।",
      roadmap: [
        Number.isFinite(age)
          ? `आयु ${age} के अनुसार अगले 3 महीनों में बुनियादी कौशल और दैनिक अभ्यास शुरू करें।`
          : "अगले 3 महीनों में बुनियादी कौशल और दैनिक अभ्यास शुरू करें।",
        "6-12 महीनों में प्रमाणपत्र/डिप्लोमा और छोटे प्रोजेक्ट पूरे करें।",
        "12-24 महीनों में इंटर्नशिप/एप्रेंटिसशिप या एंट्री-लेवल जॉब पर फोकस करें।"
      ],
      skills: ["Communication", "Problem Solving", "Digital Literacy"],
      resources: ["SWAYAM", "DIKSHA", "YouTube educational channels (Hindi)"],
      govt_schemes: baseSchemes,
      safety_notes: [
        "यह सलाह शैक्षिक मार्गदर्शन के लिए है, अंतिम निर्णय परिवार/मेंटॉर के साथ लें।",
        "किसी भी अवैध या अनैतिक आय स्रोत से दूर रहें।"
      ],
      language: "hindi"
    };
  }

  return {
    recommended_career: best,
    reason: `${best} is a practical fit for your profile, finances, and growth potential.`,
    aptitude_reasoning:
      matchedCareers?.[0]?.aptitude_reasoning ||
      "Your profile indicates workable aptitude fit, with strong outcomes possible through guided practice.",
    roadmap: [
      Number.isFinite(age)
        ? `At age ${age}, start with foundational skills and daily practice in the next 3 months.`
        : "Start with foundational skills and daily practice in the next 3 months.",
      "Complete a certificate/diploma and 2-3 practical projects in 6-12 months.",
      "Target internship/apprenticeship or entry-level role in 12-24 months."
    ],
    skills: ["Communication", "Problem Solving", "Digital Literacy"],
    resources: ["SWAYAM", "DIKSHA", "NPTEL / Skill India courses"],
    govt_schemes: baseSchemes,
    safety_notes: [
      "This is educational guidance, not a guaranteed outcome.",
      "Avoid illegal or unethical career shortcuts."
    ],
    language: "english"
  };
}

function sanitizeAdvice(parsed, languageConfig, fallback, baseSchemes) {
  if (!parsed || typeof parsed !== "object") return fallback;

  const safe = {
    recommended_career: String(parsed.recommended_career || fallback.recommended_career),
    reason: String(parsed.reason || fallback.reason),
    aptitude_reasoning: String(parsed.aptitude_reasoning || fallback.aptitude_reasoning),
    roadmap: toStringList(parsed.roadmap).slice(0, 8),
    skills: toStringList(parsed.skills).slice(0, 10),
    resources: toStringList(parsed.resources).slice(0, 10),
    govt_schemes: [...new Set([...toStringList(parsed.govt_schemes), ...baseSchemes])].slice(0, 10),
    safety_notes: toStringList(parsed.safety_notes).slice(0, 6),
    language: languageConfig.mustUseHindi ? "hindi" : "english"
  };

  const combined = [
    safe.reason,
    safe.aptitude_reasoning,
    ...safe.roadmap,
    ...safe.skills,
    ...safe.resources,
    ...safe.govt_schemes
  ].join(" ");

  if (containsUnsafeSuggestions(combined)) {
    return fallback;
  }

  if (languageConfig.mustUseHindi) {
    const hindiSignal = [
      safe.reason,
      safe.aptitude_reasoning,
      safe.roadmap.join(" "),
      safe.safety_notes.join(" ")
    ].join(" ");
    if (!isLikelyHindi(hindiSignal)) {
      return fallback;
    }
  }

  if (!safe.roadmap.length) safe.roadmap = fallback.roadmap;
  if (!safe.skills.length) safe.skills = fallback.skills;
  if (!safe.resources.length) safe.resources = fallback.resources;
  if (!safe.safety_notes.length) safe.safety_notes = fallback.safety_notes;

  return safe;
}

async function getAIAdvice(studentData, matchedCareers) {
  const languageConfig = getLanguageConfig(studentData.language);
  const age = Number(studentData.age);
  const ageHint = getAgeRoadmapHint(age, languageConfig);
  const govtSchemes = getGovtSchemes(studentData, matchedCareers);
  const fallback = buildFallbackAdvice(studentData, matchedCareers, govtSchemes, languageConfig);

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return fallback;
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "arcee-ai/trinity-large-preview:free",
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are a professional career counselor for Indian students.
Output must be valid JSON only.

Hard rules:
- No illegal, unethical, exploitative, gambling, or harmful suggestions.
- Keep advice realistic with financial and location constraints.
- Prioritize achievable pathways with scholarships, ITI/diploma/apprenticeship when suitable.
- Give explicit aptitude reasoning tied to the student's profile.
- Include age-appropriate actionable roadmap.
- Mention relevant India-friendly government schemes if useful.
- Language must be ${languageConfig.name}. ${
              languageConfig.mustUseHindi
                ? "All narrative fields must be in Hindi (Devanagari script)."
                : "All narrative fields must be in English."
            }
`
          },
          {
            role: "user",
            content: `
Student Profile:
${JSON.stringify(studentData)}

Top Career Matches with fit details:
${JSON.stringify(matchedCareers)}

Suggested govt schemes shortlist:
${JSON.stringify(govtSchemes)}

Age roadmap rule:
${ageHint}

Return JSON:
{
  "recommended_career": "",
  "reason": "",
  "aptitude_reasoning": "",
  "roadmap": [],
  "skills": [],
  "resources": [],
  "govt_schemes": [],
  "safety_notes": []
}
`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const raw = response?.data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(stripMarkdownCodeFences(raw));
    return sanitizeAdvice(parsed, languageConfig, fallback, govtSchemes);
  } catch (error) {
    console.error("AI Error:", error.response?.data || error.message);
    return fallback;
  }
}

module.exports = getAIAdvice;
