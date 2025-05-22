import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Fight settings
FIGHT_DURATION_BUFFER_MINUTES = int(os.getenv("FIGHT_DURATION_BUFFER_MINUTES", "2"))
MAX_DURATION_MINUTES = int(os.getenv("MAX_DURATION_MINUTES", "60"))

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/fightdb")

# CORS settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
