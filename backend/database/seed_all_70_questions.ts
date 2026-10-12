import crypto from "crypto";
import { tidb, getTiDBPool } from "../src/config/tidb";
import { ENV } from "../src/config/env";
import { RAW_CHAPTER_QUESTIONS } from "../src/config/vault";

export async function seedAll70Questions(): Promise<{
  questionsSeeded: number;
  keysSeeded: number;
  hintsSeeded: number;
}> {
  console.log("==================================================================");
  console.log("⚡ SEEDING ALL 70 TOURNAMENT QUESTIONS & HMAC KEYS INTO TIDB");
  console.log("==================================================================");

  const pool = getTiDBPool();
  if (!pool) {
    throw new Error("[SEED ERROR] TiDB connection pool could not be initialized.");
  }

  // 1. Ensure rounds 1 through 7 exist in TiDB
  const ROUND_NAMES = [
    "Chapter 1: The Vanishing of Will Byers",
    "Chapter 2: The Weirdo on Maple Street",
    "Chapter 3: Holly, Jolly — The Hawkins Lab Gate",
    "Chapter 4: The Body in Sattler Quarry",
    "Chapter 5: The Flea and the Acrobat",
    "Chapter 6: The Monster Communicates",
    "Chapter 7: The Bathtub & The Upside Down",
  ];

  for (let r = 1; r <= 7; r++) {
    await pool.query(
      `INSERT INTO rounds (round_id, event_id, round_number, round_code, round_name, is_active)
       VALUES (?, 1, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE round_name = VALUES(round_name), is_active = 1`,
      [r, r, `R${r}`, ROUND_NAMES[r - 1]]
    );
  }
  console.log("✅ Rounds 1 through 7 confirmed in TiDB.");

  // 2. Clear out or bump old placeholder questions (e.g. Q_CH1_CORONER) to order 90+
  // so that question_order 1..10 is completely free for each round
  await pool.query(
    `UPDATE questions
     SET question_order = 90 + question_order
     WHERE question_code NOT LIKE 'ch%-q%' AND question_order < 90`
  );
  console.log("✅ Placeholder questions order adjusted to avoid constraint collisions.");

  let questionsSeeded = 0;
  let keysSeeded = 0;
  let hintsSeeded = 0;

  const hmacSecret = ENV.ANSWER_HMAC_SECRET || "HAWKINS_SECRET_HMAC_KEY_1983";
  console.log(`Using HMAC Secret: ${hmacSecret.substring(0, 6)}***`);

  for (let chId = 1; chId <= 7; chId++) {
    const questions = RAW_CHAPTER_QUESTIONS[chId] || [];
    console.log(`Processing Chapter ${chId} (${questions.length} questions)...`);

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const questionCode = q.id; // e.g. ch1-q1
      const questionOrder = idx + 1;

      const promptContent = JSON.stringify({
        prompt: q.question,
        options: q.options || [],
        subHeader: q.subHeader || "",
        docketTag: q.docketTag || "",
        chapterId: chId,
      });

      // Insert or update question
      await pool.query(
        `INSERT INTO questions (
          round_id, question_code, question_order, question_type, points,
          prompt_content, normalization_profile, validator_type, is_active
        ) VALUES (?, ?, ?, 'choice', 10.00, ?, 'trim_lowercase', 'exact_hmac', 1)
        ON DUPLICATE KEY UPDATE
          round_id = VALUES(round_id),
          question_order = VALUES(question_order),
          question_type = VALUES(question_type),
          points = 10.00,
          prompt_content = VALUES(prompt_content),
          normalization_profile = VALUES(normalization_profile),
          validator_type = VALUES(validator_type),
          is_active = 1`,
        [chId, questionCode, questionOrder, promptContent]
      );
      questionsSeeded++;

      // Retrieve the generated/existing question_id
      const [qRow]: any = await pool.query(
        "SELECT question_id FROM questions WHERE question_code = ?",
        [questionCode]
      );
      const questionId = qRow?.[0]?.question_id;
      if (!questionId) {
        throw new Error(`Failed to retrieve question_id for question_code: ${questionCode}`);
      }

      // Compute HMAC-SHA256 hash for correct answer
      const rawAns = q.correctAnswerId || "A";
      const normalizedAns = rawAns.trim().toLowerCase();
      const answerHmac = crypto
        .createHmac("sha256", hmacSecret)
        .update(normalizedAns)
        .digest("hex");

      // Variant 1: Option key (e.g. "b")
      await pool.query(
        `INSERT INTO question_answer_keys (
          question_id, accepted_answer_hmac, answer_variant_number, is_active
        ) VALUES (?, ?, 1, 1)
        ON DUPLICATE KEY UPDATE
          accepted_answer_hmac = VALUES(accepted_answer_hmac),
          is_active = 1`,
        [questionId, answerHmac]
      );
      keysSeeded++;

      // Variant 2 (optional): If matching option text exists, also compute and seed its HMAC
      const matchingOpt = (q.options || []).find(
        (o) => o.id.trim().toUpperCase() === rawAns.trim().toUpperCase()
      );
      if (matchingOpt && matchingOpt.text) {
        const normalizedText = matchingOpt.text.trim().toLowerCase();
        const textHmac = crypto
          .createHmac("sha256", hmacSecret)
          .update(normalizedText)
          .digest("hex");

        if (textHmac !== answerHmac) {
          await pool.query(
            `INSERT INTO question_answer_keys (
              question_id, accepted_answer_hmac, answer_variant_number, is_active
            ) VALUES (?, ?, 2, 1)
            ON DUPLICATE KEY UPDATE
              accepted_answer_hmac = VALUES(accepted_answer_hmac),
              is_active = 1`,
            [questionId, textHmac]
          );
          keysSeeded++;
        }
      }

      // Seed Hint if available
      if (q.hint) {
        await pool.query(
          `INSERT INTO question_hints (
            question_id, hint_order, hint_text, penalty_points, is_active
          ) VALUES (?, 1, ?, 5.00, 1)
          ON DUPLICATE KEY UPDATE
            hint_text = VALUES(hint_text),
            penalty_points = 5.00,
            is_active = 1`,
          [questionId, q.hint]
        );
        hintsSeeded++;
      }
    }
  }

  console.log("==================================================================");
  console.log(`🎉 SEEDING COMPLETE:`);
  console.log(`   - Questions seeded: ${questionsSeeded}`);
  console.log(`   - HMAC keys seeded: ${keysSeeded}`);
  console.log(`   - Hints seeded:     ${hintsSeeded}`);
  console.log("==================================================================");

  return { questionsSeeded, keysSeeded, hintsSeeded };
}

// Auto-run if executed directly via node/tsx
if (require.main === module || process.argv[1]?.endsWith("seed_all_70_questions.ts")) {
  seedAll70Questions()
    .then(() => {
      console.log("Seeding script finished successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding script failed:", err);
      process.exit(1);
    });
}
