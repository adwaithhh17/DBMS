# FootTrack API

A comprehensive RESTful API for tracking and managing football data across Europe's Top 5 Leagues (Premier League, La Liga, Bundesliga, Serie A, and Ligue 1).

## Features

- **Multi-League Support**: Track data for all Top 5 European football leagues
- **Complete Team Management**: Teams, stadiums, coaches, and players
- **Match Tracking**: Schedule matches, update scores, and track live status
- **Player Statistics**: Detailed per-match statistics (goals, assists, cards, minutes played)
- **League Standings**: Real-time standings with automated goal difference and points calculation
- **RESTful API**: Clean, intuitive endpoints with JSON responses
- **Real-time Ready**: Socket.io integration for live updates
- **Normalized Database**: 3NF-compliant MySQL schema for data integrity

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0+
- **Real-time**: Socket.io
- **Dependencies**:
  - `express` - Web framework
  - `mysql2` - MySQL client with Promise support
  - `cors` - Cross-origin resource sharing
  - `dotenv` - Environment variable management
  - `socket.io` - Real-time bidirectional communication

## Database Schema

The database is normalized to Third Normal Form (3NF) with the following entities:

- **League**: Football leagues (Premier League, La Liga, etc.)
- **Stadium**: Venue information and capacity
- **Team**: Club details, home stadium, and league association
- **Coach**: Manager information and team assignment
- **Player**: Player profiles with position and team
- **Match**: Fixture scheduling, scores, and status
- **Player_Stats**: Per-match player performance metrics
- **Standing**: League table with auto-calculated points and goal difference

##  Getting Started

### Prerequisites

- Node.js 14.x or higher
- MySQL 8.0 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/foottrack-api.git
   cd foottrack-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Log into MySQL
   mysql -u root -p

   # Run the schema file
   source schema.sql
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=footmanager
   PORT=3001
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

The API will be running at `http://localhost:3001`

## API Endpoints

### Leagues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leagues` | Get all leagues |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | Get all teams (filter: `?league_id=1`) |
| GET | `/api/teams/:id` | Get team details with players |
| POST | `/api/teams` | Create a new team |
| PUT | `/api/teams/:id` | Update team information |
| DELETE | `/api/teams/:id` | Delete a team |

### Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players` | Get all players (filters: `?team_id=1&position=FWD`) |
| GET | `/api/players/:id` | Get player details with career stats |
| POST | `/api/players` | Add a new player |
| PUT | `/api/players/:id` | Update player information |
| DELETE | `/api/players/:id` | Remove a player |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | Get all matches (filters: `?league_id=1&status=live&team_id=2`) |
| GET | `/api/matches/:id` | Get match details with player stats |
| POST | `/api/matches` | Schedule a new match |
| PUT | `/api/matches/:id` | Update match details/scores |
| DELETE | `/api/matches/:id` | Delete a match |

### Standings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/standings/:league_id` | Get league standings |
| POST | `/api/standings` | Update/insert standings (upsert) |

### Player Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stats` | Record/update player match stats |
| DELETE | `/api/stats/:id` | Delete a stat entry |

## Usage Examples

### Get All Teams in Premier League
```bash
curl http://localhost:3001/api/teams?league_id=1
```

### Create a New Player
```bash
curl -X POST http://localhost:3001/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 25,
    "position": "MID",
    "jersey_number": 10,
    "nationality": "English",
    "team_id": 1
  }'
```

### Update Match Score
```bash
curl -X PUT http://localhost:3001/api/matches/1 \
  -H "Content-Type: application/json" \
  -d '{
    "home_score": 2,
    "away_score": 1,
    "status": "finished"
  }'
```

### Get League Standings
```bash
curl http://localhost:3001/api/standings/1
```

## Project Structure

```
foottrack-api/
├── server.js           # Main application file with API routes
├── schema.sql          # Database schema and sample data
├── index.html          # Frontend interface (if applicable)
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (create this)
└── README.md          # Documentation
```

## Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Sample Data

The schema includes pre-populated data for:
- 5 major European leagues
- 11 top clubs across leagues
- 11 stadiums
- 22 star players
- Multiple coaches
- Sample matches and statistics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Add authentication and authorization
- [ ] Implement real-time match updates via Socket.io
- [ ] Add advanced statistics and analytics endpoints
- [ ] Create player comparison features
- [ ] Add match prediction algorithms
- [ ] Implement data visualization endpoints
- [ ] Add export functionality (CSV, JSON, PDF)

## Notes

- Player positions are constrained to: `GK`, `DEF`, `MID`, `FWD`
- Match status can be: `scheduled`, `live`, or `finished`
- Standings automatically calculate `points` (W×3 + D) and `goal difference` (GF - GA)
- Each team can have only one coach
- Player stats are unique per player per match

##  License

This project is licensed under the MIT License.

## Authors
 Adwaith R
 Ashwin Rajesha Bhat
 
## 🙏 Acknowledgments

- Built for football fans and data enthusiasts
- Inspired by the beautiful game ⚽
- Sample data includes some of the world's top players and clubs



