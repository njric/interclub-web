# Interclub Competition Management System

A comprehensive web application for managing interclub combat sports competitions, featuring real-time fight scheduling, status tracking, and administrative controls.

## Project Structure

```
interclub-web/
├── backend/                # FastAPI backend service
│   ├── app/               # Application code
│   │   ├── database/      # Database configuration
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   ├── schemas/       # Pydantic models
│   │   └── utils/         # Utility functions
│   ├── tests/             # Backend tests
│   └── README.md          # Backend documentation
├── admin/                 # React admin dashboard
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── context/      # React context providers
│   │   └── services/     # API services
│   └── README.md         # Frontend documentation
└── README.md             # This file
```

## Features

- **Real-time Fight Management**
  - Live fight status tracking
  - Dynamic schedule adjustments
  - Automatic time calculations

- **Administrative Dashboard**
  - Secure authentication system
  - Fight import from CSV
  - Manual fight creation and editing
  - Schedule management

- **User Interface**
  - Public view for spectators
  - Real-time fight status updates
  - Upcoming and past fights display

## Technology Stack

### Backend
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- JWT Authentication
- Pytest (Testing)

### Frontend
- React 18
- TypeScript
- Material-UI
- Vite
- React Router
- Axios

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/interclub-web.git
cd interclub-web
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
```

3. Set up the frontend:
```bash
cd ../admin
npm install
```

4. Create environment files:
- Copy `backend/.env.example` to `backend/.env`
- Configure your database and authentication settings

5. Start the development servers:

Backend:
```bash
cd backend
uvicorn app.main:app --reload
```

Frontend:
```bash
cd admin
npm run dev
```

## Development

- Backend API documentation: http://localhost:8000/docs
- Admin dashboard: http://localhost:5173
- Public interface: http://localhost:5173/

## Testing

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd admin
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
