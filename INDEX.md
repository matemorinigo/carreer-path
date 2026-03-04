# 📖 Índice de Documentación - Carreer Path

Guía de navegación por todos los documentos del proyecto.

---

## 🚀 Comienza Aquí

### Para Usuarios Nuevos
1. **[GETTING_STARTED.md](GETTING_STARTED.md)** ⭐ **LEER PRIMERO**
   - Qué necesitas antes de empezar
   - 3 formas de ejecutar el sistema
   - Troubleshooting rápido
   - Tests con curl/Postman

### Para Entender la Arquitectura
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Diagramas visuales
   - Vista general del sistema
   - Componentes de cada capa
   - Flujo de datos
   - Base de datos y relaciones
   - DTOs y mapeos

### Para Revisar Estructura
3. **[FILE_STRUCTURE.md](FILE_STRUCTURE.md)** - Árbol de archivos
   - Qué archivo es qué
   - Dónde encontrar código
   - Estadísticas del proyecto

---

## 📁 Por Componente

### Scraper (Python)
- **[scraper/README.md](scraper/README.md)**
  - Cómo funciona el parser HTML
  - Estructura esperada del HTML
  - Ejecución paso a paso
  - Output JSON

> **Ubicación**: `/scraper/plan_parser.py`

### Backend (Spring Boot)
- **[backend/README.md](backend/README.md)** - Documentación completa
  - Instalación y configuración
  - Todos los endpoints REST (8 total)
  - Ejemplos JSON
  - Perfiles de BD (H2 vs PostgreSQL)
  - Troubleshooting específico

> **Ubicación**: `/backend/`

### Frontend (React - TODO)
- Próximo componente a desarrollar

---

## 🎯 Guías Rápidas

### Ejecutar en Desarrollo (5 min)
```bash
# 1. Scraper
cd scraper && python3 plan_parser.py

# 2. Backend
cd backend && mvn spring-boot:run

# 3. Ingestar
curl -X POST http://localhost:8080/api/materias/ingestar \
  -d @../scraper/plan_estudios.json
```
→ Ver **[GETTING_STARTED.md](GETTING_STARTED.md)**

### Deployar con Docker (10 min)
```bash
docker-compose up -d
# El backend y PostgreSQL corren automáticamente
```
→ Ver **[GETTING_STARTED.md](GETTING_STARTED.md) - Opción 3**

### Entender Flujo de Ingesta
→ Ver **[ARCHITECTURE.md](ARCHITECTURE.md) - Sección 3.2**

### Probar Endpoints
```bash
chmod +x backend/test-api.sh
./backend/test-api.sh
```
→ Ver **[backend/README.md](backend/README.md) - API REST**

---

## 📚 Documentación Detallada

| Archivo | Tema | Público |
|---------|------|---------|
| [README.md](README.md) | Visión general | Todos |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Guía de inicio | Nuevos usuarios |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura con diagramas | Desarrolladores |
| [FILE_STRUCTURE.md](FILE_STRUCTURE.md) | Estructura de carpetas | Desarrolladores |
| [scraper/README.md](scraper/README.md) | Componente scraper | Usuarios del scraper |
| [backend/README.md](backend/README.md) | API y base de datos | Usuarios de la API |

---

## 🔍 Buscar por Tema

### Instalación
- [GETTING_STARTED.md - Prerequisitos](GETTING_STARTED.md#prerequisitos)
- [GETTING_STARTED.md - Paso 1: Scraper](GETTING_STARTED.md#paso-1-ejecutar-el-scraper)
- [GETTING_STARTED.md - Paso 2: Backend](GETTING_STARTED.md#paso-2-iniciar-el-backend-desarrollo)

### Base de Datos
- [ARCHITECTURE.md - Sección 5](ARCHITECTURE.md#5-configuración-base-de-datos)
- [backend/README.md - Tabla materias](backend/README.md#tabla-materias)
- [backend/README.md - Tabla materia_correlativas](backend/README.md#tabla-materia_correlativas)

### API REST
- [backend/README.md - Endpoints](backend/README.md#api-rest)
- [ARCHITECTURE.md - Sección 6](ARCHITECTURE.md#6-api-rest-endpoints)

### Ingesta de Datos
- [ARCHITECTURE.md - Flujo 3 Fases](ARCHITECTURE.md#32-flujo-de-ingesta-3-fases)
- [backend/README.md - Servicio de Ingesta](backend/README.md#tarea-2-servicio-de-ingesta-basado-en-datos)

### HTML/Web Scraping
- [scraper/README.md](scraper/README.md)
- [scraper/plan_parser.py](scraper/plan_parser.py)

### Modelo de Datos
- [ARCHITECTURE.md - Sección 3.3](ARCHITECTURE.md#33-modelo-de-datos)
- [backend/src/main/java/com/carreerpath/domain/Materia.java](backend/src/main/java/com/carreerpath/domain/Materia.java)

### Docker/Deployment
- [GETTING_STARTED.md - Opción 3](GETTING_STARTED.md#opción-3-con-docker-compose-producción)
- [docker-compose.yml](docker-compose.yml)
- [backend/Dockerfile](backend/Dockerfile)

### Testing/Debuggeo
- [GETTING_STARTED.md - Pruebas Rápidas](GETTING_STARTED.md#test-de-endpoints-desarrollo)
- [backend/test-api.sh](backend/test-api.sh)
- [GETTING_STARTED.md - Troubleshooting](GETTING_STARTED.md#troubleshooting)

---

## 🛠️ Para Desarrolladores

### Entender el Código
1. Comienza en [ARCHITECTURE.md](ARCHITECTURE.md)
2. Luego revisa [backend/README.md](backend/README.md)
3. Finalmente, lee el código fuente en:
   - `backend/src/main/java/com/carreerpath/service/DataIngestionService.java` ← **Núcleo**
   - `backend/src/main/java/com/carreerpath/controller/MateriaController.java` ← **API**

### Extender el Sistema
- Ver [backend/README.md - Próximos Pasos](backend/README.md#próximos-pasos)
- Nueva funcionalidad → Nueva rama Git
- Sigue la arquitectura clean en capas (controller → service → repository)

### Agregar Tests
- TDD recomendado
- Usar JUnit 5 (incluido en Spring Boot 3.2)
- Ver [backend/README.md - Próximos Pasos](backend/README.md#próximos-pasos)

---

## 📋 Checklists

### ✅ Antes de la Primera Ejecución
- [ ] Leo [GETTING_STARTED.md](GETTING_STARTED.md)
- [ ] Tengo Python 3.8+ instalado
- [ ] Tengo Java 21 instalado
- [ ] Tengo Maven 3.6+ instalado
- [ ] Clonic/descargué el proyecto

### ✅ Para Ejecutar en Desarrollo
- [ ] Entiendo [ARCHITECTURE.md](ARCHITECTURE.md)
- [ ] Ejecuté el scraper (plan_parser.py)
- [ ] Conozco los endpoints de [backend/README.md](backend/README.md)
- [ ] Testé al menos 3 endpoints con curl

### ✅ Para Deployar a Producción
- [ ] Tengo PostgreSQL 12+ instalado (o Docker)
- [ ] Configuré variables de entorno (DB_HOST, DB_USER, etc.)
- [ ] Buildeé el JAR con Maven
- [ ] Probé con docker-compose.yml
- [ ] Testé endpoints en localhost:8080

---

## 🎓 Curva de Aprendizaje Sugerida

```
Novato (1 hora)
  ↓
[README.md] - Visión general
[GETTING_STARTED.md] - Prueba el sistema
  ↓
Desarrollador Junior (2 horas más)
  ↓
[ARCHITECTURE.md] - Entiende las capas
[scraper/README.md] - Usa el parser
[backend/README.md] - Usa la API
  ↓
Arquitecto (8 horas más)
  ↓
[FILE_STRUCTURE.md] - Revisa organización
Código fuente (.java, .py)
Tests y extensiones
```

---

## 📞 Referencias Rápidas

### Comandos Frecuentes

```bash
# Scraper
cd scraper && python3 plan_parser.py

# Backend (desarrollo)
cd backend && mvn spring-boot:run

# Pruebas API
./backend/test-api.sh

# Docker
docker-compose up -d

# Ingestar plan
curl -X POST http://localhost:8080/api/materias/ingestar \
  -H "Content-Type: application/json" \
  -d @scraper/plan_estudios.json
```

### Puertos Importantes

- **8080** - Backend Spring Boot
- **5432** - PostgreSQL (si Docker)
- **5432** - H2 Console en http://localhost:8080/h2-console (dev)

### URLs Importantes

- API: `http://localhost:8080/api/materias`
- H2 Console: `http://localhost:8080/h2-console`
- JSON: `/scraper/plan_estudios.json`

---

## 🎁 Información Adicional

### Tecnologías Usadas
Ver [ARCHITECTURE.md - Sección 9](ARCHITECTURE.md#9-tecnologías-por-capa)

### Licencia
MIT (ver archivos individuales)

### Autor
GitHub Copilot | Claude Haiku 4.5

### Última Actualización
Marzo 2026

---

## Navigation Tree

```
📖 Este archivo (ÍNDICE)
│
├─ 🚀 Guías de Inicio
│  ├─ GETTING_STARTED.md ⭐
│  └─ README.md
│
├─ 📐 Arquitectura
│  ├─ ARCHITECTURE.md
│  └─ FILE_STRUCTURE.md
│
├─ 🐍 Scraper
│  ├─ scraper/README.md
│  └─ scraper/plan_parser.py
│
└─ 🚀 Backend
   ├─ backend/README.md
   ├─ backend/src/main/java/...
   └─ docker-compose.yml
```

---

**👉 Siguiente paso recomendado:**
1. Si es tu primer día: [GETTING_STARTED.md](GETTING_STARTED.md)
2. Si quieres entender todo: [ARCHITECTURE.md](ARCHITECTURE.md)
3. Si quieres usar la API: [backend/README.md](backend/README.md)

¡Bienvenido! 🎉
