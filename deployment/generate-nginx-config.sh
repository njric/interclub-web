#!/bin/bash
set -euo pipefail

readonly ENV_FILE="/opt/interclub/app/backend/.env.deploy"
readonly TEMPLATE="/opt/interclub/app/deployment/nginx.conf.template"
readonly OUTPUT="/opt/interclub/app/deployment/nginx.conf"

# Fonction de validation du domaine
validate_domain() {
    [[ $1 =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]
}

# Vérifier l'existence et les permissions
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found" >&2
    exit 1
fi

# Charger les variables de manière sécurisée
declare -A env_vars
while IFS='=' read -r key value || [ -n "$key" ]; do
    [[ $key =~ ^[[:space:]]*# || -z $key ]] && continue
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    value="${value%\"}"
    value="${value#\"}"
    env_vars[$key]="$value"
done < "$ENV_FILE"

# Valider les variables requises
for var in DOMAIN BACKEND_HOST BACKEND_PORT; do
    if [ -z "${env_vars[$var]:-}" ]; then
        echo "Error: $var not set" >&2
        exit 1
    fi
done

# Valider le format
if ! validate_domain "${env_vars[DOMAIN]}"; then
    echo "Error: Invalid DOMAIN format" >&2
    exit 1
fi

if ! [[ "${env_vars[BACKEND_PORT]}" =~ ^[0-9]+$ ]] || \
   [ "${env_vars[BACKEND_PORT]}" -lt 1 ] || \
   [ "${env_vars[BACKEND_PORT]}" -gt 65535 ]; then
    echo "Error: Invalid port" >&2
    exit 1
fi

# Valider les certificats SSL s'ils sont spécifiés
if [ -n "${env_vars[SSL_CERT_PATH]:-}" ]; then
    if [ ! -f "${env_vars[SSL_CERT_PATH]}" ]; then
        echo "Error: SSL certificate not found at ${env_vars[SSL_CERT_PATH]}" >&2
        exit 1
    fi
    if [ ! -r "${env_vars[SSL_CERT_PATH]}" ]; then
        echo "Error: SSL certificate is not readable" >&2
        exit 1
    fi
fi

if [ -n "${env_vars[SSL_KEY_PATH]:-}" ]; then
    if [ ! -f "${env_vars[SSL_KEY_PATH]}" ]; then
        echo "Error: SSL private key not found at ${env_vars[SSL_KEY_PATH]}" >&2
        exit 1
    fi
    if [ ! -r "${env_vars[SSL_KEY_PATH]}" ]; then
        echo "Error: SSL private key is not readable" >&2
        exit 1
    fi
    # Vérifier que la clé privée a des permissions restrictives
    key_perms=$(stat -c '%a' "${env_vars[SSL_KEY_PATH]}")
    if [ "$key_perms" != "600" ] && [ "$key_perms" != "400" ]; then
        echo "Warning: SSL private key has insecure permissions ($key_perms)" >&2
        echo "Recommended: chmod 600 ${env_vars[SSL_KEY_PATH]}" >&2
    fi
fi

# Générer la configuration de manière sécurisée
TEMP_CONF=$(mktemp)
trap "rm -f $TEMP_CONF" EXIT

export DOMAIN="${env_vars[DOMAIN]}"
export DOMAIN_WWW="${env_vars[DOMAIN_WWW]:-}"
export BACKEND_HOST="${env_vars[BACKEND_HOST]}"
export BACKEND_PORT="${env_vars[BACKEND_PORT]}"
export SSL_CERT_PATH="${env_vars[SSL_CERT_PATH]:-}"
export SSL_KEY_PATH="${env_vars[SSL_KEY_PATH]:-}"

envsubst '${DOMAIN} ${DOMAIN_WWW} ${BACKEND_HOST} ${BACKEND_PORT} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' \
    < "$TEMPLATE" > "$TEMP_CONF"

# Backup et déplacement atomique
[ -f "$OUTPUT" ] && cp "$OUTPUT" "${OUTPUT}.backup"
mv "$TEMP_CONF" "$OUTPUT"
chmod 644 "$OUTPUT"

echo "✓ Configuration generated successfully"
echo ""
echo "To install it, run:"
echo "  sudo cp $OUTPUT /etc/nginx/sites-available/interclub"
echo "  sudo ln -sf /etc/nginx/sites-available/interclub /etc/nginx/sites-enabled/interclub"
echo "  sudo nginx -t && sudo systemctl reload nginx"
