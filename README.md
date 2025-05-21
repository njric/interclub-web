# Fight Manager Backend

A FastAPI-based backend service for managing fighting events.

## Features

- Fight scheduling and management
- CSV import for bulk fight creation
- Real-time fight tracking (start/end times)
- PostgreSQL database for persistent storage
- Input validation and error handling
- CORS support for frontend integration

## Prerequisites

- Python 3.8+
- PostgreSQL
- pip

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a PostgreSQL database:
```sql
CREATE DATABASE fightdb;
```

4. Create a `.env` file in the project root with the following content:
```
DATABASE_URL=postgresql://user:password@localhost/fightdb
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
FIGHT_DURATION_BUFFER_MINUTES=2
MAX_DURATION_MINUTES=60
```

Replace the database URL with your actual PostgreSQL credentials.

## Running the Application

Start the server:
```bash
uvicorn fight_manager_backend:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

- `GET /fights` - List all fights
- `PATCH /fights/{fight_id}` - Update fighter information
- `POST /fights/import` - Import fights from CSV
- `POST /fights/{fight_id}/start` - Start a fight
- `POST /fights/{fight_id}/end` - End a fight

## CSV Import Format

The CSV file should have the following columns:
- `fighter_a` - Name of the first fighter
- `fighter_b` - Name of the second fighter
- `duration` - Fight duration in minutes

Example:
```csv
fighter_a,fighter_b,duration
John Doe,Jane Smith,15
Mike Johnson,Sarah Wilson,20
```
