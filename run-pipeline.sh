#!/bin/bash

# Script de integración: Scraper → Backend
# Ejecuta el scraper para generar JSON y luego lo ingesta en el backend

set -e

echo "🔄 Pipeline Scraper → Backend"
echo "=============================="
echo ""

# Configuración
SCRAPER_DIR="./scraper"
BACKEND_API="http://localhost:8080/api/materias"
PLAN_JSON="${SCRAPER_DIR}/plan_estudios.json"

# 1. Ejecutar scraper
echo "1️⃣  Ejecutando scraper Python..."
if [ ! -d "$SCRAPER_DIR" ]; then
    echo "❌ Directorio scraper no encontrado"
    exit 1
fi

cd "$SCRAPER_DIR"

# Crear venv si no existe
if [ ! -d ".venv" ]; then
    echo "  📦 Creando entorno virtual..."
    python3 -m venv .venv
fi

# Activar venv
source .venv/bin/activate

# Instalar dependencias
echo "  📚 Instalando dependencias..."
pip install -q -r requirements.txt

# Ejecutar parser
echo "  🔨 Ejecutando parser..."
python3 plan_parser.py

deactivate
cd ..

# Verificar que se generó el JSON
if [ ! -f "$PLAN_JSON" ]; then
    echo "❌ No se generó plan_estudios.json"
    exit 1
fi

echo "✅ Scraper completado: $PLAN_JSON"
echo ""

# 2. Verificar que el backend está corriendo
echo "2️⃣  Verificando backend..."
if ! curl -s "$BACKEND_API" > /dev/null 2>&1; then
    echo "⚠️  Backend no está disponible en $BACKEND_API"
    echo "   Inicia el backend con:"
    echo "   cd backend && mvn spring-boot:run"
    echo ""
    echo "   El JSON está listo en: $PLAN_JSON"
    exit 0
fi

echo "✅ Backend disponible"
echo ""

# 3. Limpiar ingensta anterior
echo "3️⃣  Limpiando ingesta anterior..."
curl -s -X DELETE "$BACKEND_API" > /dev/null
echo "✅ Limpio"
echo ""

# 4. Ingestar el plan
echo "4️⃣  Ingesterando plan de estudios..."
echo "   Payload: $PLAN_JSON"
RESPONSE=$(curl -s -X POST "$BACKEND_API/ingestar" \
    -H "Content-Type: application/json" \
    -d @"$PLAN_JSON")

echo "$RESPONSE" | jq .

# Verificar éxito
EXITO=$(echo "$RESPONSE" | jq -r '.exito')
if [ "$EXITO" = "true" ]; then
    CANTIDAD=$(echo "$RESPONSE" | jq -r '.materiasGuardadas')
    echo ""
    echo "✅ Ingesta exitosa: $CANTIDAD materias guardadas"
else
    echo ""
    echo "❌ Error en la ingesta"
    exit 1
fi

echo ""
echo "📊 Estadísticas:"
curl -s "$BACKEND_API/estadisticas" | jq .

echo ""
echo "🎉 Pipeline completado exitosamente"
echo ""
echo "Próximos pasos:"
echo "  - Accede a http://localhost:8080/api/materias"
echo "  - Visualiza el plan en el frontend (cuando esté listo)"
