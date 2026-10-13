const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'XvTn2VkXqThHS3a.root',
    password: '7h1Om30uVXky8w2D',
    database: 'stranger_thinks',
    ssl: { rejectUnauthorized: false }
  });

  // 1. Reset all teams in TiDB
  await conn.execute("UPDATE teams SET total_score = 0, penalty = 0, stage = 'hawkins', location = 'town', last_solved_at = NULL");
  console.log('TiDB teams reset to 0 points.');

  // 2. Clear tables
  await conn.execute('DELETE FROM score_ledger').catch(e => console.log('score_ledger:', e.message));
  await conn.execute('DELETE FROM question_submissions').catch(e => console.log('submissions:', e.message));
  await conn.execute('DELETE FROM team_hint_usages').catch(e => console.log('hints:', e.message));
  await conn.execute('DELETE FROM team_active_sessions').catch(e => console.log('sessions:', e.message));

  // 3. Set event to not_started
  await conn.execute("UPDATE events SET status = 'not_started', login_open = 1, submissions_open = 0, is_paused = 0, started_at = NULL WHERE event_id = 1");
  console.log('TiDB events set to not_started.');

  // 4. Verify
  const [teams] = await conn.execute('SELECT team_id, team_name, total_score FROM teams');
  console.log('Teams now:', teams);

  await conn.end();

  // 5. Also reset db-state.json in memory / file
  const statePath = path.join(__dirname, 'data', 'db-state.json');
  if (fs.existsSync(statePath)) {
    const data = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (data.teams) {
      for (const tId in data.teams) {
        data.teams[tId].totalScore = 0;
        data.teams[tId].penalty = 0;
        data.teams[tId].breakdown = { tech: 0, puzzle: 0, speed: 0, clue: 0, story: 0, teamwork: 0 };
        data.teams[tId].completedTasks = [];
        data.teams[tId].solvedChapters = [];
        data.teams[tId].lastSolvedAt = null;
        data.teams[tId].storyProgress = 0;
      }
    }
    fs.writeFileSync(statePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('db-state.json reset to 0 points.');
  }
}

run().catch(console.error);
