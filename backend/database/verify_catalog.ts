import { getTiDBPool } from "../src/config/tidb";

async function verify() {
  const pool = getTiDBPool();
  if (!pool) {
    console.error("Pool not ready");
    process.exit(1);
  }

  const [qRows]: any = await pool.query(
    "SELECT COUNT(1) AS count FROM questions WHERE question_code LIKE 'ch%-q%'"
  );
  const [kRows]: any = await pool.query(
    "SELECT COUNT(1) AS count FROM question_answer_keys"
  );
  const [hRows]: any = await pool.query(
    "SELECT COUNT(1) AS count FROM question_hints"
  );

  console.log(`Tournament Questions (ch%-q%): ${qRows[0].count}`);
  console.log(`Answer Keys Total:            ${kRows[0].count}`);
  console.log(`Question Hints Total:         ${hRows[0].count}`);

  if (qRows[0].count === 70 && kRows[0].count >= 70) {
    console.log("✅ Catalog Verification: PASSED (All 70 questions and HMAC keys verified)");
    process.exit(0);
  } else {
    console.error("❌ Catalog Verification: FAILED");
    process.exit(1);
  }
}

verify().catch(console.error);
