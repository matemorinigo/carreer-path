# 🚀 Getting Started - Carreer Path

Guía rápida para poner en marcha el sistema de ingesta de planes de estudio.

## Prerequisitos

✅ Python 3.8+ (para scraper)
✅ Java 21 (para backend)
✅ Maven 3.6+ (compilación)
✅ Git (control de versiones)

**Opcional:**
- Docker & Docker Compose (para prod)
- curl o Postman (para probar API)
- PostgreSQL 12+ (para producción)

---

## 📍 Opción 1: Flujo Completo (Scraper → Backend)

### Paso 1: Ejecutar el Scraper

```bash
cd scraper

# Crear y activar entorno virtual
python3 -m venv .venv
source .venv/bin/activate        # macOS/Linux
# o: .venv\Scripts\activate      # Windows

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar parser
python3 plan_parser.py
```

**Resultado**: `plan_estudios.json` con estructura JSON lista.

### Paso 2: Iniciar el Backend (Desarrollo)

```bash
cd backend

# Compilar
mvn clean install

# Ejecutar (H2 automático)
mvn spring-boot:run
```

Backend disponible en: `http://localhost:8080`

### Paso 3: Ingestar el Plan

```bash
# Desde la raíz del monorepo
curl -X POST http://localhost:8080/api/materias/ingestar \
  -H "Content-Type: application/json" \
  -d @scraper/plan_estudios.json
```

**Respuesta esperada:**

```json
{
  "exito": true,
  "mensaje": "Ingesta completada exitosamente",
  "materiasGuardadas": 65,
  "error": null
}
```

### Paso 4: Verificar Ingesta

```bash
# Obtener todas las materias
curl http://localhost:8080/api/materias | jq '.length'

# Obtener estadísticas
curl http://localhost:8080/api/materias/estadisticas | jq .
```

---

## 📍 Opción 2: Script Automatizado

Si prefieres automatizar todo:

```bash
# Desde la raíz
chmod +x run-pipeline.sh
./run-pipeline.sh
```

El script:
1. ✅ Ejecuta el scraper
2. ✅ Verifica que el backend esté corriendo
3. ✅ Limpia ingesta anterior
4. ✅ Ingesta el nuevo plan
5. ✅ Muestra estadísticas

---

## 📍 Opción 3: Con Docker Compose (Producción)

Para un entorno con PostgreSQL y backend containerizado:

```bash
# Desde la raíz
docker-compose up -d

# Esperar a que PostgreSQL esté listo (~10s)
sleep 10

# Ingestar plan
curl -X POST http://localhost:8080/api/materias/ingestar \
  -H "Content-Type: application/json" \
  -d @scraper/plan_estudios.json
```

**Ventajas:**
- ✅ PostgreSQL aislado en contenedor
- ✅ Backend aislado en contenedor
- ✅ Fácil de deployar/resetear
- ✅ Compatible con producción

**Para detener:**
```bash
docker-compose down
```

---

## 🧪 Pruebas Rápidas

### Test de Endpoints (Desarrollo)

```bash
# 1. Obtener todas las materias
curl http://localhost:8080/api/materias | jq . | head -20

# 2. Obtener una materia específica
curl http://localhost:8080/api/materias/3621 | jq .

# 3. Filtrar obligatorias
curl http://localhost:8080/api/materias/filter/obligatorias | jq length

# 4. Filtrar optativas
curl http://localhost:8080/api/materias/filter/optativas | jq length

# 5. Obtener opciones de Electiva
curl http://localhost:8080/api/materias/3672/hijas | jq .

# 6. Estadísticas
curl http://localhost:8080/api/materias/estadisticas | jq .
```

### Test con Postman

1. Abre Postman
2. **Método**: POST
3. **URL**: `http://localhost:8080/api/materias/ingestar`
4. **Headers**: `Content-Type: application/json`
5. **Body** (raw): pega el contenido de `scraper/plan_estudios.json`
6. Click "Send"

---

## 📊 Estructura de Datos Esperada

### JSON del Scraper

```json
[
  {
    "id": "3621",
    "nombre": "Matemática Discreta",
    "correlativas": [],
    "horas": 4
  },
  {
    "id": "3628",
    "nombre": "Física I",
    "correlativas": ["3622"],
    "horas": 4
  }
]
```

### Transformación en el Backend

Se transforma automáticamente a:

```json
{
  "id": "3621",
  "nombre": "Matemática Discreta",
  "horas": 4,
  "esObligatoria": true,        // default
  "padreId": null,              // opcional
  "correlativas": []
}
```

---

## 🔍 Troubleshooting

### "Backend not available"

```bash
# Verifica que esté corriendo
curl http://localhost:8080/api/materias

# Si no funciona, verifica logs
# En otra terminal:
cd backend
mvn spring-boot:run
```

### "Maven not found"

```bash
# Instala Maven
brew install maven          # macOS
apt install maven           # Ubuntu/Debian
```

### "Python modules not found"

```bash
# Reactiva el venv
cd scraper
source .venv/bin/activate
pip install -r requirements.txt
```

### "H2 console no abre"

```
http://localhost:8080/h2-console
Credenciales: sa / (sin password)
URL: jdbc:h2:mem:carreerpathdb
```

### "PostgreSQL connection error"

```bash
# Verifica que PostgreSQL esté corriendo (si usas docker-compose)
docker-compose ps

# O localmente
psql -U postgres -d carreerpathdb
```

---

## 📚 Documentación Detallada

- **Scraper**: [scraper/README.md](scraper/README.md)
- **Backend**: [backend/README.md](backend/README.md)
- **Arquitectura**: [README.md](README.md)

---

## 🎯 Próximos Pasos

1. ✅ **Carga tu primer plan**: Sigue Opción 1 o 2 arriba
2. 🔄 **Prueba los endpoints**: Usa curl o Postman
3. 📈 **Analiza las estadísticas**: `GET /api/materias/estadisticas`
4. 🚀 **Deploy a producción**: Usa Docker Compose (Opción 3)
5. ⚛️ **Frontend**: Próximamente (React/Next.js)

---

## ⚡ Resumen: Desde Cero en 10 Minutos

```bash
# 1. Scraper (5 min)
cd scraper
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && python3 plan_parser.py

# 2. Backend (3 min)
cd ../backend
mvn clean install && mvn spring-boot:run &

# 3. Ingestar (2 min)
cd ..
curl -X POST http://localhost:8080/api/materias/ingestar \
  -H "Content-Type: application/json" \
  -d @scraper/plan_estudios.json

# 4. Verificar
curl http://localhost:8080/api/materias/estadisticas | jq .
```

✅ **¡Listo!** Tu plan está en la BD.

---

## 💡 Tips

- **Desarrollo rápido**: H2 en memoria es suficiente para pruebas
- **Reingestar**: `DELETE /api/materias` limpia todo, luego POST nuevamente
- **Múltiples planes**: El mismo backend soporta varios planes simultáneamente (próximo paso)
- **Logs detallados**: Mira `application.yml` para ajustar nivel de log

---

## 🤝 ¿Necesitas Ayuda?

Consulta la documentación principal o revisa los logs del backend:
```bash
# Terminal donde corre mvn spring-boot:run
# Busca mensajes con "ERROR" o "WARN"
```

¡Buena suerte! 🚀
