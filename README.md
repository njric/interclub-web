# Fight Manager System

A comprehensive system for managing combat sports events, featuring real-time fight scheduling, tracking, and management.

## Features

- Real-time fight management
- Dynamic fight scheduling with automatic time adjustments
- Fight status tracking (scheduled, in progress, completed)
- Fighter and club management
- CSV import for bulk fight creation
- Admin interface for fight management
- Public interface for viewing fight schedules
- Drag-and-drop fight reordering
- Fight editing and cancellation

## Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM
- Pydantic for data validation

### Frontend
- React
- TypeScript
- Material-UI (MUI)
- React Beautiful DND
- Vite

## Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

4. Initialize the database:
```bash
# Make sure PostgreSQL is running
python fight_manager_backend.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd fight-manager-admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Usage

### Admin Interface
- Access the admin interface at `http://localhost:5173/admin`
- Features:
  - Set start time for fights
  - Add/Edit/Cancel fights
  - Import fights from CSV
  - Monitor ongoing fights
  - Start/End fights
  - Reorder fights via drag and drop

### Public Interface
- Access the public interface at `http://localhost:5173`
- Features:
  - View ongoing fight
  - View upcoming fights
  - View past fights
  - Real-time updates

## API Documentation

The API documentation is available at `http://localhost:8000/docs` when the backend server is running.

### Key Endpoints

- `GET /fights` - List all fights
- `POST /fights/start-time` - Set start time for fights
- `POST /fights/import` - Import fights from CSV
- `POST /fights/{fight_id}/start` - Start a fight
- `POST /fights/{fight_id}/end` - End a fight
- `POST /fights/{fight_id}/cancel` - Cancel a fight
- `GET /fights/ongoing` - Get current ongoing fight
- `GET /fights/ready` - Get next ready fight
- `GET /fights/next` - Get upcoming fights
- `GET /fights/past` - Get past fights

## Development

### Project Structure

```
├── backend/               # Backend modules
├── fight-manager-admin/   # Frontend React application
├── requirements.txt       # Python dependencies
├── .env                  # Environment variables
└── README.md            # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- FastAPI for the backend framework
- React Beautiful DND for drag-and-drop functionality
