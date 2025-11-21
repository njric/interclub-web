# Guide de Déploiement en Production - Ubuntu

Ce guide détaillé vous accompagne dans le déploiement du système Interclub Competition Management sur un serveur Ubuntu en production.

## Prérequis Serveur

- Ubuntu 20.04 LTS ou plus récent
- Au moins 2GB de RAM
- 20GB d'espace disque libre
- Accès sudo/root
- Nom de domaine configuré (recommandé)

## Étape 1: Préparation du Serveur

### 1.1 Mise à jour du système
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### 1.2 Installation des dépendances système
```bash
# Outils de base
sudo apt install -y curl wget git unzip software-properties-common

# Build tools pour certains packages Python
sudo apt install -y build-essential python3-dev libpq-dev

# Nginx pour le reverse proxy
sudo apt install -y nginx

# Outils de monitoring (optionnel)
sudo apt install -y htop tree
```

## Étape 2: Installation de Python et Node.js

### 2.1 Installation de Python 3.9+
```bash
# Vérifier la version Python (doit être 3.9+)
python3 --version

# Si version < 3.9, installer Python 3.11
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Créer un alias si nécessaire
echo 'alias python3=python3.11' >> ~/.bashrc
source ~/.bashrc
```

### 2.2 Installation de Node.js 20+
```bash
# Installation via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier les versions
node --version  # doit être 20+
npm --version
```

## Étape 3: Installation de PostgreSQL

### 3.1 Installation et configuration de PostgreSQL
```bash
# Installation
sudo apt install -y postgresql postgresql-contrib

# Démarrage et activation du service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configuration initiale
sudo -u postgres psql << EOF
CREATE USER fightuser WITH PASSWORD 'votre_mot_de_passe_securise';
CREATE DATABASE fightdb OWNER fightuser;
GRANT ALL PRIVILEGES ON DATABASE fightdb TO fightuser;
\q
EOF
```

### 3.2 Sécurisation de PostgreSQL
```bash
# Éditer le fichier de configuration
sudo nano /etc/postgresql/*/main/postgresql.conf

# Modifier ces lignes:
# listen_addresses = 'localhost'
# port = 5432

# Configuration de l'authentification
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ajouter cette ligne pour l'authentification locale:
# local   fightdb     fightuser                     md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

## Étape 4: Création de l'Utilisateur Application

### 4.1 Création de l'utilisateur dédié
```bash
# Créer l'utilisateur sans privilèges sudo
sudo adduser --system --group --home /opt/interclub interclub

# Créer les répertoires nécessaires
sudo mkdir -p /opt/interclub/{app,logs,env}
sudo chown -R interclub:interclub /opt/interclub
```

### 4.2 Configuration des permissions
```bash
# Donner les permissions nécessaires
sudo usermod -a -G www-data interclub
sudo usermod -s /bin/bash interclub
```

## Étape 5: Déploiement de l'Application

### 5.1 Clonage du code source
```bash
# Se connecter en tant qu'utilisateur interclub
sudo -u interclub -i

# Cloner le repository dans /opt/interclub/app
cd /opt/interclub
git clone https://github.com/votre-username/interclub-web.git app
cd app
```

### 5.2 Configuration Backend
```bash
# Toujours en tant qu'utilisateur interclub
cd /opt/interclub/app/backend

# Créer l'environnement virtuel Python
python3 -m venv /opt/interclub/env
source /opt/interclub/env/bin/activate

# Installer les dépendances
pip install --upgrade pip
pip install -e .

# Copier le template de configuration
cp .env.example .env

# Éditer le fichier de configuration production
# OU créer directement avec les bonnes valeurs:
cat > .env << EOF
# Base de données PostgreSQL
DATABASE_URL=postgresql://fightuser:votre_mot_de_passe_securise@localhost/fightdb

# CORS - remplacer par votre domaine
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com

# Paramètres des combats
FIGHT_DURATION_BUFFER_MINUTES=2
MAX_DURATION_MINUTES=60

# Authentification - CHANGEZ CES VALEURS EN PRODUCTION
ADMIN_USERNAME=admin
ADMIN_PASSWORD=votre_mot_de_passe_admin_securise
JWT_SECRET=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=60
EOF

# Sécuriser le fichier .env
chmod 600 .env

# Créer le fichier de configuration de déploiement
cp .env.deploy.example .env.deploy

# Éditer .env.deploy avec vos valeurs de production
nano .env.deploy
# Configurer: DOMAIN, DOMAIN_WWW, BACKEND_HOST, BACKEND_PORT, BACKEND_WORKERS, SSL paths
```

### 5.3 Configuration Frontend
```bash
# Toujours en tant qu'utilisateur interclub
cd /opt/interclub/app/admin

# Installer toutes les dépendances (devDependencies nécessaires pour le build)
npm install

# Copier le template et créer le fichier de configuration
cp .env.example .env

# Charger les variables de déploiement et créer le .env frontend
source ../backend/.env.deploy
cat > .env << EOF
VITE_API_URL=https://${DOMAIN}/api
EOF

# Build de production
npm run build

# Vérifier que le build est créé
ls -la dist/
```

## Étape 6: Configuration des Services Systemd

### 6.1 Service Backend
```bash
# Copier le template du service systemd
sudo cp /opt/interclub/app/deployment/interclub-backend.service.template /etc/systemd/system/interclub-backend.service

# Le service charge automatiquement les variables depuis:
# - /opt/interclub/app/backend/.env (variables d'application)
# - /opt/interclub/app/backend/.env.deploy (variables de déploiement: BACKEND_HOST, BACKEND_PORT, BACKEND_WORKERS)
```

### 6.2 Activation du service backend
```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer et démarrer le service
sudo systemctl enable interclub-backend.service
sudo systemctl start interclub-backend.service

# Vérifier le statut
sudo systemctl status interclub-backend.service

# Voir les logs si nécessaire
sudo journalctl -u interclub-backend.service -f
```

## Étape 7: Configuration Nginx

### 7.1 Génération de la configuration Nginx depuis le template
```bash
# Donner les permissions d'exécution au script de génération
chmod +x /opt/interclub/app/deployment/generate-nginx-config.sh

# Générer la configuration Nginx depuis le template
# Le script utilise les variables de .env.deploy (DOMAIN, BACKEND_HOST, BACKEND_PORT, SSL paths)
sudo -u interclub /opt/interclub/app/deployment/generate-nginx-config.sh

# Copier la configuration générée vers Nginx
sudo cp /opt/interclub/app/deployment/nginx.conf /etc/nginx/sites-available/interclub
```

### 7.2 Activation du site
```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/interclub /etc/nginx/sites-enabled/

# Supprimer le site par défaut
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx si tout est OK
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Étape 8: Configuration SSL avec Let's Encrypt

### 8.1 Installation de Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtention du certificat SSL
```bash
# Arrêter Nginx temporairement
sudo systemctl stop nginx

# Obtenir le certificat
sudo certbot certonly --standalone -d votre-domaine.com -d www.votre-domaine.com

# Redémarrer Nginx
sudo systemctl start nginx
```

### 8.3 Renouvellement automatique
```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré via cron automatiquement
```

## Étape 9: Configuration du Firewall

### 9.1 Configuration UFW
```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH
sudo ufw allow ssh

# Autoriser HTTP et HTTPS
sudo ufw allow 'Nginx Full'

# Vérifier les règles
sudo ufw status
```

## Étape 10: Initialisation de la Base de Données

### 10.1 Première utilisation
```bash
# Se connecter en tant qu'utilisateur interclub
sudo -u interclub -i
cd /opt/interclub/app/backend
source /opt/interclub/env/bin/activate

# Les tables sont créées automatiquement au démarrage de l'application
# Les identifiants admin sont configurés dans le fichier .env:
# - ADMIN_USERNAME
# - ADMIN_PASSWORD

# Vérifier que les tables sont créées
python3 << EOF
from app.database.database import engine, Base
from app.models.fight import Fight

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)
print("Tables créées/vérifiées avec succès")

# Vérifier la connexion
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text("SELECT COUNT(*) FROM fights"))
    count = result.scalar()
    print(f"Nombre de combats en base: {count}")
EOF

# L'authentification utilise maintenant les variables d'environnement
# ADMIN_USERNAME et ADMIN_PASSWORD définies dans .env
# Aucune création d'utilisateur en base n'est nécessaire
```

## Étape 11: Monitoring et Logs

### 11.1 Configuration de la rotation des logs
```bash
sudo tee /etc/logrotate.d/interclub << EOF
/var/log/nginx/interclub_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

### 11.2 Script de monitoring simple
```bash
sudo tee /opt/interclub/monitor.sh << EOF
#!/bin/bash
# Script de monitoring simple

echo "=== Status des Services ==="
systemctl is-active postgresql
systemctl is-active interclub-backend
systemctl is-active nginx

echo "=== Utilisation Disque ==="
df -h / /opt

echo "=== Utilisation Mémoire ==="
free -h

echo "=== Dernières lignes des logs ==="
journalctl -u interclub-backend.service --lines=5 --no-pager

echo "=== Test API ==="
curl -s http://localhost:8000/ | grep -q "Fight Manager API" && echo "API OK" || echo "API ERROR"
EOF

chmod +x /opt/interclub/monitor.sh
```

## Étape 12: Sauvegarde

### 12.1 Script de sauvegarde automatique
```bash
sudo tee /opt/interclub/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/interclub/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Sauvegarde de la base de données
pg_dump -h localhost -U fightuser -d fightdb > \$BACKUP_DIR/db_\$DATE.sql

# Sauvegarde des fichiers de configuration
tar -czf \$BACKUP_DIR/config_\$DATE.tar.gz /opt/interclub/app/backend/.env /etc/nginx/sites-available/interclub

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée: \$DATE"
EOF

chmod +x /opt/interclub/backup.sh

# Ajouter au crontab pour exécution quotidienne à 2h du matin
echo "0 2 * * * /opt/interclub/backup.sh >> /opt/interclub/logs/backup.log 2>&1" | sudo crontab -u interclub -
```

## Étape 13: Tests de Validation

### 13.1 Tests de connectivité
```bash
# Test de l'API
curl -X GET https://votre-domaine.com/api/

# Test de l'interface web
curl -I https://votre-domaine.com/

# Test de l'authentification
curl -X POST https://votre-domaine.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"votre_mot_de_passe_admin"}'
```

### 13.2 Test de performance
```bash
# Installer ab (Apache Bench) pour les tests de charge
sudo apt install -y apache2-utils

# Test simple de charge
ab -n 100 -c 10 https://votre-domaine.com/api/
```

## Étape 14: Mise à Jour en Production

### 14.1 Script de déploiement
```bash
sudo tee /opt/interclub/deploy.sh << EOF
#!/bin/bash
set -e

echo "=== Début du déploiement ==="

# Backup avant mise à jour
/opt/interclub/backup.sh

cd /opt/interclub/app

# Pull des dernières modifications
git pull origin master

# Backend
cd backend
source /opt/interclub/env/bin/activate
pip install -e .

# Frontend (npm install sans --production car devDependencies nécessaires pour le build)
cd ../admin
npm install
npm run build

# Redémarrage des services
sudo systemctl restart interclub-backend.service
sudo systemctl reload nginx

echo "=== Déploiement terminé ==="
EOF

chmod +x /opt/interclub/deploy.sh
```

## Troubleshooting Courant

### Problèmes de Base de Données
```bash
# Vérifier la connexion PostgreSQL
sudo -u postgres psql -c "\l"

# Vérifier les logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Problèmes de Service Backend
```bash
# Logs détaillés du service
sudo journalctl -u interclub-backend.service -f

# Test manuel du backend
sudo -u interclub -i
cd /opt/interclub/app/backend
source /opt/interclub/env/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Problèmes Nginx
```bash
# Tester la configuration
sudo nginx -t

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/interclub_error.log
```

## Sécurité Recommandations

1. **Changez tous les mots de passe par défaut**
2. **Configurez fail2ban pour protéger SSH**
3. **Mettez à jour régulièrement le système**
4. **Surveillez les logs d'accès**
5. **Limitez les connexions SSH par clé publique uniquement**
6. **Configurez un monitoring externe (Uptime Robot, etc.)**

## Maintenance Régulière

### Hebdomadaire
- Vérifier les logs d'erreur
- Contrôler l'espace disque
- Valider les sauvegardes

### Mensuelle
- Mise à jour des dépendances de sécurité
- Rotation manuelle des logs si nécessaire
- Test de restauration de sauvegarde

Votre application est maintenant déployée en production sur Ubuntu avec une architecture robuste et sécurisée !
