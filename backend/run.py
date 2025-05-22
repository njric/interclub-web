import uvicorn
from app.database.database import recreate_tables

if __name__ == "__main__":
    # Recreate tables to ensure fresh database
    recreate_tables()

    # Run the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
