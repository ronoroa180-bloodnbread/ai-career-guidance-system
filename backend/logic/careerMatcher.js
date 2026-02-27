const careers = require("../data/careers.json");

function growthBonus(growth) {
  if (growth === "high") return 6;
  if (growth === "medium") return 3;
  return 0;
}

function normalizeList(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase());
}

function uniqueStrings(list = []) {
  return [...new Set(normalizeList(list))];
}

function getStudentAge(student) {
  const rawAge = Number(student.age);
  if (!Number.isFinite(rawAge)) return null;
  if (rawAge < 10 || rawAge > 80) return null;
  return rawAge;
}

function getAgeStage(age) {
  if (!age) return "unknown";
  if (age <= 14) return "early";
  if (age <= 17) return "school";
  if (age <= 22) return "college";
  return "adult";
}

function getRealismPenalty(career, student, mathScore) {
  let penalty = 0;

  if (career.education_cost === "high" && student.financial === "low") penalty += 16;
  if (career.education_cost === "medium" && student.financial === "low") penalty += 4;

  if (mathScore + 20 < career.min_math) penalty += 18;
  else if (mathScore + 10 < career.min_math) penalty += 8;
  else if (mathScore < career.min_math) penalty += 4;

  if (student.location === "rural" && !career.rural_friendly && student.financial === "low") {
    penalty += 4;
  }

  return penalty;
}

function isCareerRealistic(career, student, mathScore) {
  const highCostBarrier = career.education_cost === "high" && student.financial === "low";
  const majorAcademicGap = mathScore + 25 < career.min_math;
  return !(highCostBarrier && majorAcademicGap);
}

function matchCareers(student) {
  const studentInterests = uniqueStrings(student.interests);
  const studentAptitude = uniqueStrings(student.aptitude);
  const studentPersonality = uniqueStrings(student.personality);
  const mathScore = Number(student.marks?.math) || 0;
  const age = getStudentAge(student);
  const ageStage = getAgeStage(age);

  const results = [];

  careers.forEach((career) => {
    let score = 0;
    const explanation = [];
    const aptitudeMatches = [];

    if (!isCareerRealistic(career, student, mathScore)) {
      return;
    }

    career.interests.forEach((interest) => {
      const normalizedInterest = String(interest).toLowerCase();
      if (studentInterests.includes(normalizedInterest)) {
        score += 10;
        explanation.push(`Interest match: ${interest}`);
      }
    });

    if (mathScore >= career.min_math) {
      score += 8;
      explanation.push("Math requirement satisfied");
    }

    if (student.financial === "low" && career.education_cost === "low") {
      score += 10;
      explanation.push("Affordable education path");
    }

    career.aptitude?.forEach((aptitude) => {
      const normalizedAptitude = String(aptitude).toLowerCase();
      if (studentAptitude.includes(normalizedAptitude)) {
        score += 7;
        aptitudeMatches.push(aptitude);
        explanation.push(`Aptitude match: ${aptitude}`);
      }
    });

    career.personality?.forEach((personality) => {
      const normalizedPersonality = String(personality).toLowerCase();
      if (studentPersonality.includes(normalizedPersonality)) {
        score += 4;
        explanation.push(`Personality fit: ${personality}`);
      }
    });

    if (student.location === "rural" && career.rural_friendly) {
      score += 5;
      explanation.push("Rural friendly career");
    }

    if (ageStage === "early" && career.education_cost === "high") {
      score -= 3;
      explanation.push("Long preparation path for current age stage");
    }

    score += growthBonus(career.growth);

    const realismPenalty = getRealismPenalty(career, student, mathScore);
    score -= realismPenalty;

    const normalizedScore = Math.max(0, Math.min(100, score));
    const aptitudeReasoning =
      aptitudeMatches.length > 0
        ? `Aptitude alignment on ${aptitudeMatches.join(", ")}.`
        : "Limited direct aptitude match; requires deliberate skill-building.";

    results.push({
      career: career.career,
      category: career.category,
      score: normalizedScore,
      realistic: true,
      aptitude_reasoning: aptitudeReasoning,
      explanation,
      fit_breakdown: {
        interest_overlap: career.interests.filter((interest) =>
          studentInterests.includes(String(interest).toLowerCase())
        ),
        aptitude_overlap: aptitudeMatches,
        personality_overlap: career.personality.filter((personality) =>
          studentPersonality.includes(String(personality).toLowerCase())
        ),
        math_gap: Math.max(0, career.min_math - mathScore),
        education_cost: career.education_cost,
        growth: career.growth,
        realism_penalty: realismPenalty
      }
    });
  });

  results.sort((a, b) => b.score - a.score);

  const finalResults = [];
  const usedCategories = new Set();

  for (const result of results) {
    if (!usedCategories.has(result.category)) {
      finalResults.push(result);
      usedCategories.add(result.category);
    }
    if (finalResults.length === 5) break;
  }

  return finalResults;
}

module.exports = matchCareers;
