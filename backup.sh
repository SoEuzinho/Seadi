#!/bin/bash
# ========================================================================
# Backup automático do SEADI (banco MariaDB + uploads)
# ========================================================================
# - Dump do banco via mariadb-dump (sem interromper transações)
# - Compacta a pasta backend/uploads (fotos de perfil)
# - Retenção de 14 dias
#
# Execução: adicionar ao cron, ex.:
#   30 3 * * * /home/servidor/senacpi/seadi/backup.sh >/dev/null 2>&1
# ========================================================================
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BASE_DIR}/backups"
RETENTION_DAYS=14
STAMP="$(date +%F_%H%M%S)"

# Lê credenciais do .env (sem expor no histórico)
DB_ROOT="$(grep '^MYSQL_ROOT_PASSWORD=' "${BASE_DIR}/.env" | head -n1 | cut -d= -f2-)"
DB_NAME="$(grep '^MYSQL_DATABASE=' "${BASE_DIR}/.env" | head -n1 | cut -d= -f2-)"

mkdir -p "${BACKUP_DIR}"

# 1) Banco de dados (single-transaction: consistente, sem lock longo)
docker exec seadi-db mariadb-dump \
  --user=root --password="${DB_ROOT}" \
  --single-transaction --quick --routines --triggers \
  "${DB_NAME}" \
  | gzip -9 > "${BACKUP_DIR}/seadi-db_${STAMP}.sql.gz"

# 2) Uploads (fotos de perfil)
if [ -d "${BASE_DIR}/backend/uploads" ]; then
  tar -czf "${BACKUP_DIR}/seadi-uploads_${STAMP}.tar.gz" \
    -C "${BASE_DIR}/backend" uploads
fi

# 3) Retenção: remove backups com mais de RETENTION_DAYS dias
find "${BACKUP_DIR}" -type f \( -name 'seadi-db_*.sql.gz' -o -name 'seadi-uploads_*.tar.gz' \) \
  -mtime +"${RETENTION_DAYS}" -delete

echo "Backup OK: ${STAMP} (${DB_NAME})"
