-- ============================================================
--  FootTrack DB Schema — Top 5 Leagues Football Tracker
--  Normalized to 3NF | Node/Express + MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS footmanager;
USE footmanager;

-- ─────────────────────────────────────────────
--  LEAGUES
-- ─────────────────────────────────────────────
CREATE TABLE League (
    league_id   INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    country     VARCHAR(100) NOT NULL,
    season      VARCHAR(20)  NOT NULL,   -- e.g. '2025-26'
    logo_url    VARCHAR(255)
);

-- ─────────────────────────────────────────────
--  STADIUMS
-- ─────────────────────────────────────────────
CREATE TABLE Stadium (
    stadium_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    capacity    INT
);

-- ─────────────────────────────────────────────
--  TEAMS
-- ─────────────────────────────────────────────
CREATE TABLE Team (
    team_id      INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    short_name   VARCHAR(10),
    founded_year int,
    logo_url     VARCHAR(255),
    stadium_id   INT,
    league_id    INT NOT NULL,
    FOREIGN KEY (stadium_id) REFERENCES Stadium(stadium_id) ON DELETE SET NULL,
    FOREIGN KEY (league_id)  REFERENCES League(league_id)   ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  COACHES
-- ─────────────────────────────────────────────
CREATE TABLE Coach (
    coach_id         INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    nationality      VARCHAR(100),
    experience_years INT,
    team_id          INT UNIQUE,          -- 1 coach per team
    FOREIGN KEY (team_id) REFERENCES Team(team_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
--  PLAYERS
-- ─────────────────────────────────────────────
CREATE TABLE Player (
    player_id     INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    age           INT,
    position      ENUM('GK','DEF','MID','FWD') NOT NULL,
    jersey_number INT,
    nationality   VARCHAR(100),
    team_id       INT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES Team(team_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  MATCHES
-- ─────────────────────────────────────────────
CREATE TABLE `Match` (
    match_id      INT AUTO_INCREMENT PRIMARY KEY,
    match_date    DATETIME    NOT NULL,
    stadium_id    INT,
    league_id     INT NOT NULL,
    home_team_id  INT NOT NULL,
    away_team_id  INT NOT NULL,
    home_score    INT DEFAULT NULL,
    away_score    INT DEFAULT NULL,
    status        ENUM('scheduled','live','finished') DEFAULT 'scheduled',
    FOREIGN KEY (stadium_id)   REFERENCES Stadium(stadium_id) ON DELETE SET NULL,
    FOREIGN KEY (league_id)    REFERENCES League(league_id)   ON DELETE CASCADE,
    FOREIGN KEY (home_team_id) REFERENCES Team(team_id)       ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES Team(team_id)       ON DELETE CASCADE,
    CHECK (home_team_id <> away_team_id)
);

-- ─────────────────────────────────────────────
--  PLAYER STATS  (per match)
-- ─────────────────────────────────────────────
CREATE TABLE Player_Stats (
    stat_id      INT AUTO_INCREMENT PRIMARY KEY,
    player_id    INT NOT NULL,
    match_id     INT NOT NULL,
    goals        INT DEFAULT 0,
    assists      INT DEFAULT 0,
    yellow_cards INT DEFAULT 0,
    red_cards    INT DEFAULT 0,
    minutes      INT DEFAULT 90,
    UNIQUE KEY uq_player_match (player_id, match_id),
    FOREIGN KEY (player_id) REFERENCES Player(player_id) ON DELETE CASCADE,
    FOREIGN KEY (match_id)  REFERENCES `Match`(match_id)  ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  STANDINGS  (computed / cached per league-season)
-- ─────────────────────────────────────────────
CREATE TABLE Standing (
    standing_id INT AUTO_INCREMENT PRIMARY KEY,
    league_id   INT NOT NULL,
    team_id     INT NOT NULL,
    played      INT DEFAULT 0,
    won         INT DEFAULT 0,
    drawn       INT DEFAULT 0,
    lost        INT DEFAULT 0,
    gf          INT DEFAULT 0,   -- goals for
    ga          INT DEFAULT 0,   -- goals against
    gd          INT GENERATED ALWAYS AS (gf - ga) STORED,
    points      INT GENERATED ALWAYS AS (won * 3 + drawn) STORED,
    UNIQUE KEY uq_league_team (league_id, team_id),
    FOREIGN KEY (league_id) REFERENCES League(league_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id)   REFERENCES Team(team_id)     ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  SAMPLE DATA — Top 5 Leagues
-- ─────────────────────────────────────────────
INSERT INTO League (name, country, season) VALUES
('Premier League',  'England', '2025-26'),
('La Liga',         'Spain',   '2025-26'),
('Bundesliga',      'Germany', '2025-26'),
('Serie A',         'Italy',   '2025-26'),
('Ligue 1',         'France',  '2025-26');

INSERT INTO Stadium (name, city, capacity) VALUES
('Old Trafford',        'Manchester United',  74310),
('Anfield',             'Liverpool',   61276),
('Etihad Stadium',      'Manchester City',  55017),
('Emirates Stadium',    'Arsenal',      60704),
('Santiago Bernabéu',   'Real Madrid',      81044),
('Camp Nou',            'Barcelona',   99354),
('Allianz Arena',       'Bayern Munich',      75024),
('Signal Iduna Park',   'Borussia Dortmund',    81365),
('San Siro',            'AC Milan',       75923),
('Stadio Olimpico',     'AS Roma',        70634),
('Parc des Princes',    'Paris Saint-Germain',       47929);

INSERT INTO Team (name, short_name, founded_year, stadium_id, league_id) VALUES
('Manchester United', 'MUN', 1878, 1, 1),
('Liverpool',         'LIV', 1892, 2, 1),
('Manchester City',   'MCI', 1880, 3, 1),
('Arsenal',           'ARS', 1886, 4, 1),
('Real Madrid',       'RMA', 1902, 5, 2),
('FC Barcelona',      'BAR', 1899, 6, 2),
('Bayern Munich',     'BAY', 1900, 7, 3),
('Borussia Dortmund', 'BVB', 1909, 8, 3),
('AC Milan',          'MIL', 1899, 9, 4),
('AS Roma',           'ROM', 1927, 10, 4),
('Paris Saint-Germain','PSG', 1970, 11, 5);

INSERT INTO Coach (name, nationality, experience_years, team_id) VALUES
('Michael Carrick',   'Portuguese', 5,  1),
('Arne Slot',      'Dutch',      8,  2),
('Pep Guardiola',  'Spanish',    20, 3),
('Mikel Arteta',   'Spanish',    6,  4),
('Carlo Ancelotti','Italian',    30, 5),
('Hansi Flick',    'German',     12, 6),
('Vincent Kompany','Belgian',    4,  7),
('Niko Kovač',     'Croatian',   10, 8),
('Paulo Fonseca',  'Portuguese', 8,  9),
('Daniele De Rossi','Italian',   3,  10),
('Luis Enrique',   'Spanish',    14, 11);

INSERT INTO Player (name, age, position, jersey_number, nationality, team_id) VALUES
('Marcus Rashford',   27, 'FWD', 10, 'English',    1),
('Bruno Fernandes',   30, 'MID', 8,  'Portuguese', 1),
('Mohamed Salah',     32, 'FWD', 11, 'Egyptian',   2),
('Virgil van Dijk',   33, 'DEF', 4,  'Dutch',      2),
('Erling Haaland',    24, 'FWD', 9,  'Norwegian',  3),
('Kevin De Bruyne',   33, 'MID', 17, 'Belgian',    3),
('Bukayo Saka',       23, 'MID', 7,  'English',    4),
('Martin Ødegaard',   26, 'MID', 8,  'Norwegian',  4),
('Vinicius Jr.',      24, 'FWD', 7,  'Brazilian',  5),
('Jude Bellingham',   21, 'MID', 5,  'English',    5),
('Robert Lewandowski',36, 'FWD', 9,  'Polish',     6),
('Pedri',             22, 'MID', 8,  'Spanish',    6),
('Harry Kane',        31, 'FWD', 9,  'English',    7),
('Jamal Musiala',     22, 'MID', 42, 'German',     7),
('Karim Adeyemi',     23, 'FWD', 27, 'German',     8),
('Julian Brandt',     28, 'MID', 10, 'German',     8),
('Rafael Leão',       25, 'FWD', 10, 'Portuguese', 9),
('Tijjani Reijnders', 26, 'MID', 14, 'Dutch',      9),
('Paulo Dybala',      31, 'FWD', 21, 'Argentine',  10),
('Lorenzo Pellegrini',28, 'MID', 7,  'Italian',    10),
('Ousmane Dembélé',   27, 'FWD', 23, 'French',     11),
('Vitinha',           24, 'MID', 17, 'Portuguese', 11);

INSERT INTO `Match` (match_date, stadium_id, league_id, home_team_id, away_team_id, home_score, away_score, status) VALUES
('2026-05-04 16:30:00', 2,  1, 2, 1,  3, 1, 'finished'),
('2026-05-04 19:00:00', 3,  1, 3, 4,  2, 2, 'finished'),
('2026-05-07 19:45:00', 5,  2, 5, 6,  NULL, NULL, 'scheduled'),
('2026-05-08 20:00:00', 11, 5, 11, 8, NULL, NULL, 'scheduled'),
('2026-05-10 17:30:00', 7,  3, 7, 8,  NULL, NULL, 'scheduled'),
('2026-05-11 20:00:00', 9,  4, 9, 10, NULL, NULL, 'scheduled');

INSERT INTO Player_Stats (player_id, match_id, goals, assists, yellow_cards, red_cards, minutes) VALUES
(3, 1, 2, 1, 0, 0, 90),
(4, 1, 0, 0, 1, 0, 90),
(1, 1, 1, 0, 0, 0, 72),
(2, 1, 0, 1, 0, 0, 90),
(5, 2, 1, 0, 0, 0, 90),
(6, 2, 0, 1, 0, 0, 90),
(7, 2, 1, 0, 1, 0, 90),
(8, 2, 0, 1, 0, 0, 90);

INSERT INTO Standing (league_id, team_id, played, won, drawn, lost, gf, ga) VALUES
(1, 1, 34, 14, 8, 12, 52, 50),
(1, 2, 34, 22, 6, 6,  75, 38),
(1, 3, 34, 20, 7, 7,  68, 42),
(1, 4, 34, 21, 5, 8,  72, 40),
(2, 5, 34, 26, 4, 4,  82, 30),
(2, 6, 34, 23, 5, 6,  74, 38),
(3, 7, 33, 24, 4, 5,  80, 32),
(3, 8, 33, 18, 6, 9,  61, 50),
(4, 9, 34, 19, 8, 7,  60, 45),
(4, 10, 34, 16, 9, 9, 54, 48),
(5, 11, 33, 22, 5, 6, 70, 38);
