# Interclub Competition Management System

Un système web complet pour la gestion de compétitions de sports de combat inter-clubs, avec planification en temps réel des combats, suivi des statuts et contrôles administratifs.

## Structure du Projet

```
interclub-web/
├── backend/                # Service FastAPI backend
│   ├── app/               # Code de l'application
│   │   ├── database/      # Configuration base de données
│   │   ├── models/        # Modèles SQLAlchemy
│   │   ├── routers/       # Endpoints API (fights, auth)
│   │   ├── schemas/       # Modèles Pydantic
│   │   └── utils/         # Fonctions utilitaires
│   ├── tests/             # Tests backend
│   ├── pyproject.toml     # Configuration moderne Python
│   ├── requirements.txt   # Dépendances Python
│   └── run.py            # Script de lancement
├── admin/                 # Dashboard React d'administration
│   ├── src/              # Code source
│   │   ├── components/   # Composants React
│   │   │   ├── auth/     # Authentification
│   │   │   └── user/     # Interface utilisateur publique
│   │   ├── context/      # Providers React Context
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── services/     # Services API
│   │   ├── translations/ # Traductions i18n
│   │   ├── types/        # Types TypeScript
│   │   └── utils/        # Utilitaires
│   ├── package.json      # Dépendances Node.js
│   └── vite.config.ts    # Configuration Vite
├── sample_fights.csv      # Exemple de données
└── .gitignore            # Configuration Git
```

## Fonctionnalités

### Gestion des Combats en Temps Réel
- Suivi en direct du statut des combats
- Ajustements dynamiques de planning
- Calculs automatiques des durées
- Réorganisation par glisser-déposer

### Dashboard Administratif
- Système d'authentification sécurisé JWT
- Import de combats depuis CSV
- Création et édition manuelle de combats
- Gestion complète du planning
- Interface multilingue (FR/EN)

### Interface Utilisateur Publique
- Vue publique pour les spectateurs
- Mises à jour en temps réel des statuts
- Affichage des combats à venir et passés
- Interface responsive et moderne

## Stack Technologique

### Backend
- **FastAPI** - Framework web Python moderne
- **SQLAlchemy 2.0** - ORM avec support async
- **SQLite/PostgreSQL** - Base de données (configurable)
- **Pydantic v2** - Validation et sérialisation des données
- **JWT Authentication** - Authentification sécurisée
- **Pytest** - Framework de tests
- **Python 3.9+** - Langage de base

### Frontend
- **React 18** - Framework UI avec hooks
- **TypeScript** - Typage statique
- **Material-UI (MUI)** - Composants UI modernes
- **Vite** - Build tool rapide
- **React Router v7** - Routage SPA
- **Axios** - Client HTTP
- **React Beautiful DnD** - Glisser-déposer
- **Date-fns** - Manipulation des dates

## Installation et Démarrage

### Prérequis
- Python 3.9+
- Node.js 20+
- npm ou yarn

### 1. Cloner le repository
```bash
git clone https://github.com/yourusername/interclub-web.git
cd interclub-web
```

### 2. Configuration Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
```

### 3. Configuration Frontend
```bash
cd ../admin
npm install
```

### 4. Variables d'Environnement
Créer un fichier `.env` dans le dossier `backend/` :
```env
# Base de données
DATABASE_URL=sqlite:///./fights.db
# Pour PostgreSQL: postgresql://user:password@localhost/fightdb

# Authentification
SECRET_KEY=your-very-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Paramètres des combats
FIGHT_DURATION_BUFFER_MINUTES=2
MAX_DURATION_MINUTES=60
```

### 5. Lancement des Serveurs

**Backend** (Terminal 1):
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (Terminal 2):
```bash
cd admin
npm run dev
```

## URLs d'Accès

- **API Documentation**: http://localhost:8000/docs
- **Interface Admin**: http://localhost:5173/admin
- **Interface Publique**: http://localhost:5173/
- **Authentification**: http://localhost:5173/login

## Tests

### Backend
```bash
cd backend
pytest -v
```

### Frontend
```bash
cd admin
npm run test
```

### Linting et Formatage
```bash
# Backend
cd backend
black . && isort . && flake8

# Frontend
cd admin
npm run lint
```

## Base de Données

Le système utilise SQLite par défaut pour le développement, avec support PostgreSQL pour la production. Les tables sont créées automatiquement au démarrage.

### Modèles Principaux
- **Fight**: Combats avec statut, horaires, participants
- **User**: Utilisateurs administrateurs avec authentification

## API Endpoints

### Publics
- `GET /` - Status de l'API
- `GET /fights/current` - Combat en cours
- `GET /fights/upcoming` - Combats à venir
- `GET /fights/past` - Combats terminés

### Administratifs (Authentification requise)
- `POST /auth/login` - Connexion
- `GET /fights` - Liste complète des combats
- `POST /fights` - Créer un combat
- `PUT /fights/{id}` - Mettre à jour un combat
- `POST /fights/import` - Import CSV

## Contribution

1. Fork du repository
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit des changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## Déploiement

Voir le guide de déploiement détaillé dans `DEPLOYMENT.md` pour les instructions de mise en production sur Ubuntu.

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

## Support

Pour les questions et le support, créer une issue sur GitHub.
