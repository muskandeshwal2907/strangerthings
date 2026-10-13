import fs from "fs";
import crypto from "crypto";
import { RAW_CHAPTER_QUESTIONS } from "../src/config/vault";
import { ENV } from "../src/config/env";

const secret = ENV.ANSWER_HMAC_SECRET || "HAWKINS_SECRET_HMAC_KEY_1983";
const qVals: string[] = [];
const kVals: string[] = [];
const hVals: string[] = [];

for (let ch = 1; ch <= 7; ch++) {
  const qs = RAW_CHAPTER_QUESTIONS[ch] || [];
  qs.forEach((q, idx) => {
    const order = idx + 1;
    const prompt = JSON.stringify({
      prompt: q.question,
      options: q.options || [],
      subHeader: q.subHeader || "",
      docketTag: q.docketTag || "",
      chapterId: ch,
    }).replace(/'/g, "''");

    qVals.push(`(${ch}, '${q.id}', ${order}, 'choice', 10.00, '${prompt}', 'trim_lowercase', 'exact_hmac', 1)`);

    const normAns = (q.correctAnswerId || "A").trim().toLowerCase();
    const hmac = crypto.createHmac("sha256", secret).update(normAns).digest("hex");
    kVals.push(`((SELECT question_id FROM questions WHERE question_code = '${q.id}'), '${hmac}', 1, 1)`);

    const matchingOpt = (q.options || []).find(
      (o) => o.id.trim().toUpperCase() === (q.correctAnswerId || "A").trim().toUpperCase()
    );
    if (matchingOpt && matchingOpt.text) {
      const normText = matchingOpt.text.trim().toLowerCase();
      const textHmac = crypto.createHmac("sha256", secret).update(normText).digest("hex");
      if (textHmac !== hmac) {
        kVals.push(`((SELECT question_id FROM questions WHERE question_code = '${q.id}'), '${textHmac}', 2, 1)`);
      }
    }

    if (q.hint) {
      const hintEsc = q.hint.replace(/'/g, "''");
      hVals.push(`((SELECT question_id FROM questions WHERE question_code = '${q.id}'), 1, '${hintEsc}', 5.00, 1)`);
    }
  });
}

const sql = `
-- ==============================================================================
-- 3.6.1 70 TOURNAMENT QUESTIONS CATALOG (ch1-q1 .. ch7-q10)
-- ==============================================================================
INSERT INTO questions (round_id, question_code, question_order, question_type, points, prompt_content, normalization_profile, validator_type, is_active)
VALUES
${qVals.join(",\n")}
ON DUPLICATE KEY UPDATE points = VALUES(points), prompt_content = VALUES(prompt_content);

-- ==============================================================================
-- 3.8.1 70 TOURNAMENT QUESTION ANSWER KEYS (HMAC SHA-256)
-- ==============================================================================
INSERT INTO question_answer_keys (question_id, accepted_answer_hmac, answer_variant_number, is_active)
VALUES
${kVals.join(",\n")}
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- ==============================================================================
-- 3.7.1 70 TOURNAMENT QUESTION HINTS
-- ==============================================================================
INSERT INTO question_hints (question_id, hint_order, hint_text, penalty_points, is_active)
VALUES
${hVals.join(",\n")}
ON DUPLICATE KEY UPDATE hint_text = VALUES(hint_text), penalty_points = VALUES(penalty_points);
`;

fs.writeFileSync("database/70_questions_seed.sql", sql);
console.log("Generated database/70_questions_seed.sql successfully.");
