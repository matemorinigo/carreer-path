#!/bin/bash

# Script de prueba para la API de Carreer Path Backend
# Ejecuta peticiones HTTP de ejemplo contra los endpoints

API_URL="http://localhost:8080/api"
PLAN_FILE="ejemplo-ingesta.json"

echo "================================"
echo "🧪 Carreer Path Backend API Test"
echo "================================"
echo ""

# 1. Limpiar (eliminar todas las materias)
echo "1️⃣  Eliminando materias existentes..."
curl -s -X DELETE "${API_URL}/materias" | jq . || echo "❌ Error"
echo ""
sleep 1

# 2. Ingestar plan de estudios
echo "2️⃣  Ingester plan de estudios..."
if [ -f "$PLAN_FILE" ]; then
    curl -s -X POST "${API_URL}/materias/ingestar" \
        -H "Content-Type: application/json" \
        -d @"$PLAN_FILE" | jq .
else
    echo "❌ Archivo $PLAN_FILE no encontrado"
fi
echo ""
sleep 1

# 3. Obtener todas las materias
echo "3️⃣  Obtener todas las materias..."
curl -s "${API_URL}/materias" | jq 'length' | xargs echo "Total de materias:"
echo ""
sleep 1

# 4. Obtener materias obligatorias
echo "4️⃣  Materias obligatorias:"
curl -s "${API_URL}/materias/filter/obligatorias" | jq '.[0:3]' && echo "..."
echo ""
sleep 1

# 5. Obtener materias optativas
echo "5️⃣  Materias optativas:"
curl -s "${API_URL}/materias/filter/optativas" | jq .
echo ""
sleep 1

# 6. Obtener una materia específica
echo "6️⃣  Materia específica (3621):"
curl -s "${API_URL}/materias/3621" | jq .
echo ""
sleep 1

# 7. Obtener opciones de Electiva I (3672)
echo "7️⃣  Opciones de Electiva I (hijas de 3672):"
curl -s "${API_URL}/materias/3672/hijas" | jq .
echo ""
sleep 1

# 8. Obtener estadísticas
echo "8️⃣  Estadísticas del plan:"
curl -s "${API_URL}/materias/estadisticas" | jq .
echo ""

echo "✅ Test completado"
