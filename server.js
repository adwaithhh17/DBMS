// ============================================================
//  FootTrack — Express + MySQL Backend  (fixed)
//  npm install express mysql2 cors dotenv
// ============================================================

const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── DB Pool ────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'foottrack',
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── Helpers ────────────────────────────────────────────────
const ok = (res, data) => res.json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(status).json({ success: false, error: e.message || e });

// ════════════════════════════════════════════════════════════
//  LEAGUES
// ════════════════════════════════════════════════════════════
app.get('/api/leagues', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM League ORDER BY name');
    ok(res, rows);
  } catch (e) { err(res, e); }
});

// ════════════════════════════════════════════════════════════
//  TEAMS
// ════════════════════════════════════════════════════════════
app.get('/api/teams', async (req, res) => {
  try {
    const { league_id } = req.query;
    let sql = `
      SELECT t.*, l.name AS league_name, s.name AS stadium_name
      FROM Team t
      JOIN League   l ON t.league_id  = l.league_id
      LEFT JOIN Stadium s ON t.stadium_id = s.stadium_id
    `;
    const params = [];
    if (league_id) { sql += ' WHERE t.league_id = ?'; params.push(league_id); }
    sql += ' ORDER BY t.name';
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
  } catch (e) { err(res, e); }
});

app.get('/api/teams/:id', async (req, res) => {
  try {
    const [[team]] = await pool.query(`
      SELECT t.*, l.name AS league_name, s.name AS stadium_name,
             c.name AS coach_name, c.nationality AS coach_nationality
      FROM Team t
      JOIN League  l ON t.league_id  = l.league_id
      LEFT JOIN Stadium s ON t.stadium_id = s.stadium_id
      LEFT JOIN Coach   c ON c.team_id    = t.team_id
      WHERE t.team_id = ?`, [req.params.id]);
    if (!team) return err(res, 'Team not found', 404);
    const [players] = await pool.query(
      'SELECT * FROM Player WHERE team_id = ? ORDER BY jersey_number', [req.params.id]);
    ok(res, { ...team, players });
  } catch (e) { err(res, e); }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { name, short_name, founded_year, logo_url, stadium_id, league_id } = req.body;
    if (!name || !league_id) return err(res, 'name and league_id are required', 400);
    const [result] = await pool.query(
      'INSERT INTO Team (name, short_name, founded_year, logo_url, stadium_id, league_id) VALUES (?,?,?,?,?,?)',
      [name, short_name, founded_year, logo_url, stadium_id, league_id]);
    ok(res, { team_id: result.insertId });
  } catch (e) { err(res, e); }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const { name, short_name, founded_year, logo_url, stadium_id, league_id } = req.body;
    const [result] = await pool.query(
      'UPDATE Team SET name=?, short_name=?, founded_year=?, logo_url=?, stadium_id=?, league_id=? WHERE team_id=?',
      [name, short_name, founded_year, logo_url, stadium_id, league_id, req.params.id]);
    if (result.affectedRows === 0) return err(res, 'Team not found', 404);
    ok(res, { updated: true });
  } catch (e) { err(res, e); }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Team WHERE team_id=?', [req.params.id]);
    if (result.affectedRows === 0) return err(res, 'Team not found', 404);
    ok(res, { deleted: true });
  } catch (e) { err(res, e); }
});

// ════════════════════════════════════════════════════════════
//  PLAYERS
// ════════════════════════════════════════════════════════════
app.get('/api/players', async (req, res) => {
  try {
    const { team_id, position } = req.query;
    let sql = `
      SELECT p.*, t.name AS team_name
      FROM Player p JOIN Team t ON p.team_id = t.team_id
      WHERE 1=1
    `;
    const params = [];
    if (team_id) { sql += ' AND p.team_id  = ?'; params.push(team_id); }
    if (position) { sql += ' AND p.position = ?'; params.push(position); }
    sql += ' ORDER BY p.name';
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
  } catch (e) { err(res, e); }
});

app.get('/api/players/:id', async (req, res) => {
  try {
    const [[player]] = await pool.query(`
      SELECT p.*, t.name AS team_name,
             SUM(ps.goals)        AS total_goals,
             SUM(ps.assists)      AS total_assists,
             SUM(ps.yellow_cards) AS total_yellows,
             SUM(ps.red_cards)    AS total_reds
      FROM Player p
      JOIN Team t ON p.team_id = t.team_id
      LEFT JOIN Player_Stats ps ON ps.player_id = p.player_id
      WHERE p.player_id = ?
      GROUP BY p.player_id`, [req.params.id]);
    if (!player) return err(res, 'Player not found', 404);
    ok(res, player);
  } catch (e) { err(res, e); }
});

app.post('/api/players', async (req, res) => {
  try {
    const { name, age, position, jersey_number, nationality, team_id } = req.body;
    if (!name || !position || !team_id)
      return err(res, 'name, position, team_id required', 400);
    const [result] = await pool.query(
      'INSERT INTO Player (name, age, position, jersey_number, nationality, team_id) VALUES (?,?,?,?,?,?)',
      [name, age, position, jersey_number, nationality, team_id]);
    ok(res, { player_id: result.insertId });
  } catch (e) { err(res, e); }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const { name, age, position, jersey_number, nationality, team_id } = req.body;
    const [result] = await pool.query(
      'UPDATE Player SET name=?, age=?, position=?, jersey_number=?, nationality=?, team_id=? WHERE player_id=?',
      [name, age, position, jersey_number, nationality, team_id, req.params.id]);
    if (result.affectedRows === 0) return err(res, 'Player not found', 404);
    ok(res, { updated: true });
  } catch (e) { err(res, e); }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Player WHERE player_id=?', [req.params.id]);
    if (result.affectedRows === 0) return err(res, 'Player not found', 404);
    ok(res, { deleted: true });
  } catch (e) { err(res, e); }
});

// ════════════════════════════════════════════════════════════
//  MATCHES
// ════════════════════════════════════════════════════════════
app.get('/api/matches', async (req, res) => {
  try {
    const { league_id, status, team_id } = req.query;
    let sql = `
      SELECT m.*,
             ht.name AS home_team, ht.short_name AS home_abbr,
             at.name AS away_team, at.short_name AS away_abbr,
             s.name  AS stadium_name, l.name AS league_name
      FROM \`Match\` m
      JOIN Team ht ON m.home_team_id = ht.team_id
      JOIN Team at ON m.away_team_id = at.team_id
      LEFT JOIN Stadium s ON m.stadium_id = s.stadium_id
      JOIN League l ON m.league_id = l.league_id
      WHERE 1=1
    `;
    const params = [];
    if (league_id) { sql += ' AND m.league_id = ?'; params.push(league_id); }
    if (status) { sql += ' AND m.status = ?'; params.push(status); }
    if (team_id) { sql += ' AND (m.home_team_id = ? OR m.away_team_id = ?)'; params.push(team_id, team_id); }
    sql += ' ORDER BY m.match_date DESC';
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
  } catch (e) { err(res, e); }
});

app.get('/api/matches/:id', async (req, res) => {
  try {
    const [[match]] = await pool.query(`
      SELECT m.*,
             ht.name AS home_team, at.name AS away_team,
             s.name AS stadium_name, l.name AS league_name
      FROM \`Match\` m
      JOIN Team ht ON m.home_team_id = ht.team_id
      JOIN Team at ON m.away_team_id = at.team_id
      LEFT JOIN Stadium s ON m.stadium_id = s.stadium_id
      JOIN League l ON m.league_id = l.league_id
      WHERE m.match_id = ?`, [req.params.id]);
    if (!match) return err(res, 'Match not found', 404);
    const [stats] = await pool.query(`
      SELECT ps.*, p.name AS player_name, p.position, t.name AS team_name
      FROM Player_Stats ps
      JOIN Player p ON ps.player_id = p.player_id
      JOIN Team   t ON p.team_id    = t.team_id
      WHERE ps.match_id = ?`, [req.params.id]);
    ok(res, { ...match, stats });
  } catch (e) { err(res, e); }
});

app.post('/api/matches', async (req, res) => {
  try {
    const { match_date, stadium_id, league_id, home_team_id, away_team_id } = req.body;
    if (!match_date || !league_id || !home_team_id || !away_team_id)
      return err(res, 'match_date, league_id, home_team_id, away_team_id required', 400);
    if (home_team_id === away_team_id)
      return err(res, 'home and away teams must differ', 400);
    const [result] = await pool.query(
      "INSERT INTO `Match` (match_date, stadium_id, league_id, home_team_id, away_team_id, status) VALUES (?,?,?,?,?,'scheduled')",
      [match_date, stadium_id, league_id, home_team_id, away_team_id]);
    ok(res, { match_id: result.insertId });
  } catch (e) { err(res, e); }
});

// FIX: original PUT only updated score/status/date — it lost league_id and team IDs on edit.
// Now includes all editable fields so edits don't silently corrupt the record.
app.put('/api/matches/:id', async (req, res) => {
  try {
    const {
      home_score, away_score, status,
      match_date, stadium_id,
      league_id, home_team_id, away_team_id,
    } = req.body;

    // Validate teams differ if both supplied
    if (home_team_id && away_team_id && home_team_id === away_team_id)
      return err(res, 'home and away teams must differ', 400);

    const [result] = await pool.query(`
      UPDATE \`Match\`
      SET home_score    = ?,
          away_score    = ?,
          status        = ?,
          match_date    = ?,
          stadium_id    = ?,
          league_id     = COALESCE(?, league_id),
          home_team_id  = COALESCE(?, home_team_id),
          away_team_id  = COALESCE(?, away_team_id)
      WHERE match_id = ?`,
      [home_score, away_score, status, match_date, stadium_id,
        league_id ?? null, home_team_id ?? null, away_team_id ?? null,
        req.params.id]);

    if (result.affectedRows === 0) return err(res, 'Match not found', 404);
    ok(res, { updated: true });
  } catch (e) { err(res, e); }
});

app.delete('/api/matches/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM `Match` WHERE match_id=?', [req.params.id]);
    if (result.affectedRows === 0) return err(res, 'Match not found', 404);
    ok(res, { deleted: true });
  } catch (e) { err(res, e); }
});

// ════════════════════════════════════════════════════════════
//  STANDINGS
// ════════════════════════════════════════════════════════════
app.get('/api/standings/:league_id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT st.*, t.name AS team_name, t.short_name, t.logo_url
      FROM Standing st JOIN Team t ON st.team_id = t.team_id
      WHERE st.league_id = ?
      ORDER BY st.points DESC, (st.gf - st.ga) DESC, st.gf DESC`,
      [req.params.league_id]);
    ok(res, rows);
  } catch (e) { err(res, e); }
});

app.post('/api/standings', async (req, res) => {
  try {
    const { league_id, team_id, played, won, drawn, lost, gf, ga } = req.body;
    await pool.query(`
      INSERT INTO Standing (league_id, team_id, played, won, drawn, lost, gf, ga)
      VALUES (?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        played = VALUES(played), won    = VALUES(won),
        drawn  = VALUES(drawn),  lost   = VALUES(lost),
        gf     = VALUES(gf),     ga     = VALUES(ga)`,
      [league_id, team_id, played, won, drawn, lost, gf, ga]);
    ok(res, { upserted: true });
  } catch (e) { err(res, e); }
});

// ════════════════════════════════════════════════════════════
//  PLAYER STATS (per match)
// ════════════════════════════════════════════════════════════
app.post('/api/stats', async (req, res) => {
  try {
    const { player_id, match_id, goals, assists, yellow_cards, red_cards, minutes } = req.body;
    if (!player_id || !match_id) return err(res, 'player_id and match_id required', 400);
    const [result] = await pool.query(`
      INSERT INTO Player_Stats (player_id, match_id, goals, assists, yellow_cards, red_cards, minutes)
      VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        goals        = VALUES(goals),
        assists      = VALUES(assists),
        yellow_cards = VALUES(yellow_cards),
        red_cards    = VALUES(red_cards),
        minutes      = VALUES(minutes)`,
      [player_id, match_id,
        goals || 0, assists || 0, yellow_cards || 0, red_cards || 0, minutes || 90]);
    ok(res, { stat_id: result.insertId || 'updated' });
  } catch (e) { err(res, e); }
});

app.delete('/api/stats/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Player_Stats WHERE stat_id=?', [req.params.id]);
    if (result.affectedRows === 0) return err(res, 'Stat not found', 404);
    ok(res, { deleted: true });
  } catch (e) { err(res, e); }
});

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`FootTrack API running on http://localhost:${PORT}`));
