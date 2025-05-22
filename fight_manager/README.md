# Fight Manager Backend

Backend service for managing combat sports events, featuring real-time fight scheduling and tracking.

## Features

- Real-time fight management
- Dynamic fight scheduling with automatic time adjustments
- Fight status tracking (scheduled, in progress, completed)
- CSV import for bulk fight creation
- RESTful API with FastAPI
- PostgreSQL database with SQLAlchemy ORM

## Installation

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the package in development mode:
```bash
pip install -e .
```

## Configuration

Create a `.env` file in the root directory:

```env
# Database settings
DATABASE_URL=postgresql://user:password@localhost/fightdb

# CORS settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Fight settings
FIGHT_DURATION_BUFFER_MINUTES=2
MAX_DURATION_MINUTES=60
```

## Development

1. Start the development server:
```bash
uvicorn app.main:app --reload
```

2. Access the API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `GET /fights` - List all fights
- `POST /fights/start-time` - Set start time for fights
- `POST /fights/import` - Import fights from CSV
- `POST /fights/{fight_id}/start` - Start a fight
- `POST /fights/{fight_id}/end` - End a fight
- `GET /fights/ongoing` - Get current ongoing fight
- `GET /fights/ready` - Get next ready fight
- `GET /fights/next` - Get upcoming fights
- `GET /fights/past` - Get past fights

## Project Structure

```
fight_manager/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── database/            # Database configuration
│   ├── models/             # SQLAlchemy models
│   ├── routers/            # API endpoints
│   ├── schemas/            # Pydantic models
│   └── utils/              # Utility functions
├── tests/                  # Test files
├── pyproject.toml         # Project metadata and dependencies
├── README.md             # This file
└── .env                  # Environment variables (create from example)
```

## Testing

Run tests with pytest:
```bash
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request
