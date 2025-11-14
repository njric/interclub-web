# Environment Configuration Guide

This guide explains how to configure the application for different environments (development, preproduction, production).

## Overview

The application uses environment variables to configure:
- **Frontend**: API endpoint URLs
- **Backend**: Database connections, CORS settings, authentication

## File Structure

```
interclub-web/
├── admin/
│   ├── .env.example        # Template with all variables
│   ├── .env.development    # Local development config (gitignored)
│   ├── .env.preprod        # Preproduction config (gitignored)
│   └── .env.production     # Production config (gitignored)
└── backend/
    ├── .env.example        # Template with all variables
    ├── .env.development    # Local development config (gitignored)
    ├── .env.preprod        # Preproduction config (gitignored)
    └── .env.production     # Production config (gitignored)
```

## Frontend Configuration

### Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API endpoint URL | `http://localhost:8000` |

### Setup by Environment

**Development** (`.env.development`)
```bash
VITE_API_URL=http://localhost:8000
```

**Preproduction** (`.env.preprod`)
```bash
VITE_API_URL=https://preprod-api.yourdomain.com
```

**Production** (`.env.production`)
```bash
VITE_API_URL=https://api.yourdomain.com
```

### Building for Specific Environment

```bash
# Development (uses .env.development by default)
npm run dev

# Production build
npm run build
# Then copy .env.production to .env before building
```

## Backend Configuration

### Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `https://yourdomain.com` |
| `FIGHT_DURATION_BUFFER_MINUTES` | Buffer time between fights | `2` |
| `MAX_DURATION_MINUTES` | Maximum fight duration | `60` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `strong_password` |
| `JWT_SECRET` | Secret key for JWT tokens | `64_char_random_string` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |

### Setup by Environment

**Development** (`.env.development`)
```bash
DATABASE_URL=postgresql://mbfight:interclubdb@localhost/fightdb
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dev_password
JWT_SECRET=development_secret_key
```

**Preproduction** (`.env.preprod`)
```bash
DATABASE_URL=postgresql://preprod_user:STRONG_PASSWORD@preprod-server/fightdb_preprod
ALLOWED_ORIGINS=https://preprod.yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=STRONG_PREPROD_PASSWORD
JWT_SECRET=STRONG_PREPROD_SECRET_MINIMUM_64_CHARS
```

**Production** (`.env.production`)
```bash
DATABASE_URL=postgresql://prod_user:VERY_STRONG_PASSWORD@prod-server/fightdb_prod
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=VERY_STRONG_PRODUCTION_PASSWORD
JWT_SECRET=VERY_STRONG_PRODUCTION_SECRET_MINIMUM_64_CHARS
```

## Initial Setup

### 1. Create Your Environment Files

Copy the appropriate template and customize it:

```bash
# Frontend
cd admin
cp .env.example .env.development
# Edit .env.development with your local settings

# Backend
cd ../backend
cp .env.example .env.development
# Edit .env.development with your local settings
```

### 2. Generate Strong Secrets

For production and preprod, generate strong secrets:

```bash
# Generate a strong JWT secret (64 characters)
python -c "import secrets; print(secrets.token_hex(32))"

# Or using openssl
openssl rand -hex 32
```

### 3. Configure Database

Ensure your PostgreSQL database is created:

```bash
# Create database
createdb fightdb

# Or for preprod/prod environments
createdb fightdb_preprod
createdb fightdb_prod
```

## Deployment

### Preproduction Deployment

1. Copy `.env.preprod` to the server
2. Rename it to `.env` on the server
3. Update all placeholder values
4. Build and deploy

```bash
# On preprod server
cd /path/to/app/backend
cp .env.preprod .env
# Edit .env with actual credentials
```

### Production Deployment

1. Copy `.env.production` to the server
2. Rename it to `.env` on the server
3. Update all placeholder values with strong credentials
4. Build and deploy

```bash
# On production server
cd /path/to/app/backend
cp .env.production .env
# Edit .env with actual strong credentials
```

## Security Best Practices

1. **Never commit** `.env.development`, `.env.preprod`, or `.env.production` to git
2. **Use strong passwords** (minimum 16 characters, mix of letters, numbers, symbols)
3. **Use unique secrets** for each environment
4. **Rotate secrets** regularly in production
5. **Limit CORS origins** to only trusted domains
6. **Use HTTPS** in production and preprod

## Troubleshooting

### Frontend can't connect to backend

- Check `VITE_API_URL` matches your backend URL
- Ensure backend CORS allows your frontend origin
- Verify backend is running and accessible

### Database connection errors

- Verify `DATABASE_URL` format is correct
- Ensure PostgreSQL server is running
- Check database user has proper permissions
- Confirm database exists

### Authentication issues

- Verify `JWT_SECRET` is set and matches across restarts
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` are correct
- Ensure tokens haven't expired (check `ACCESS_TOKEN_EXPIRE_MINUTES`)

## Environment Variables Reference

See `.env.example` files for the complete list of supported variables and their default values.
