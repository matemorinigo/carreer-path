# 📁 Estructura Completa del Proyecto

```
carreer-path/                              ← Raíz del monorepo
│
├── 📄 README.md                           ← Descripción general del proyecto
├── 📄 GETTING_STARTED.md                  ← Guía rápida de inicio (recomendado)
├── 📄 ARCHITECTURE.md                     ← Diagramas y arquitectura del sistema
├── 📄 .gitignore                          ← Ignorar archivos en Git
│
├── 📜 run-pipeline.sh                     ← Script: Scraper → Backend automático
├── 📜 docker-compose.yml                  ← Orquestación: PostgreSQL + Backend
│
│
├── 📁 scraper/                            ← FASE 1: Extractor HTML (Python)
│   │
│   ├── 📄 README.md                       ← Docs del scraper
│   ├── 📄 plan_parser.py                  ← Script principal Python
│   ├── 📄 plan_estudios.html              ← Ejemplo HTML de entrada
│   ├── 📄 plan_estudios.json              ← Salida JSON generada
│   ├── 📄 requirements.txt                ← Dependencias Python
│   ├── 📄 .gitignore                      ← Para scraper
│   └── 📁 .venv/                          ← Entorno virtual (local, no commitear)
│
│
├── 📁 backend/                            ← FASE 2: Motor de Ingesta (Spring Boot)
│   │
│   ├── 📄 pom.xml                         ← Proyecto Maven + dependencias
│   ├── 📄 README.md                       ← Docs completas del backend
│   ├── 📄 Dockerfile                      ← Containerizar para producción
│   ├── 📄 .gitignore                      ← Para backend
│   │
│   ├── 📜 test-api.sh                     ← Script: Prueba endpoints API
│   ├── 📄 ejemplo-ingesta.json            ← JSON de ejemplo para POST
│   │
│   └── 📁 src/
│       │
│       └── 📁 main/
│           │
│           ├── 📁 java/com/carreerpath/
│           │   │
│           │   ├── 📄 CarreerPathBackendApplication.java
│           │   │                         ← Punto de entrada Spring Boot
│           │   │
│           │   ├── 📁 domain/
│           │   │   └── 📄 Materia.java   ← Entidad JPA principal
│           │   │
│           │   ├── 📁 dto/
│           │   │   ├── 📄 MateriaDTO.java       ← Response API (sin ciclos)
│           │   │   └── 📄 MateriaIngestionDTO.java ← Input JSON flexible
│           │   │
│           │   ├── 📁 repository/
│           │   │   └── 📄 MateriaRepository.java ← JPA Queries
│           │   │
│           │   ├── 📁 service/
│           │   │   ├── 📄 DataIngestionService.java  ← Ingesta 3 fases
│           │   │   └── 📄 MateriaService.java        ← CRUD y queries
│           │   │
│           │   └── 📁 controller/
│           │       └── 📄 MateriaController.java ← REST Endpoints
│           │
│           └── 📁 resources/
│               ├── 📄 application.yml           ← Config dev (H2)
│               └── 📄 application-prod.yml      ← Config prod (PostgreSQL)
│
│
├── 📁 frontend/                           ← FASE 3: UI (React/Next.js - TODO)
│   ├── 📄 README.md
│   └── [estructura React a definir]
│
│
└── .git/                                  ← Control de versiones (local)
```

---

## 📋 Resumen de Archivos Creados

### Raíz (Monorepo)
| Archivo | Propósito |
|---------|-----------|
| `README.md` | Descripción general del proyecto |
| `GETTING_STARTED.md` | Guía de inicio rápido (⭐ LEER PRIMERO) |
| `ARCHITECTURE.md` | Diagramas de arquitectura |
| `run-pipeline.sh` | Script automatizado: Scraper → Backend |
| `docker-compose.yml` | Orquestación Docker (PostgreSQL + Backend) |
| `.gitignore` | Excluir archivos del versionado |

### Scraper (`scraper/`)
| Archivo | Propósito |
|---------|-----------|
| `plan_parser.py` | Parser HTML con BeautifulSoup |
| `plan_estudios.html` | Ejemplo HTML de entrada |
| `plan_estudios.json` | Output JSON (generado por parser) |
| `requirements.txt` | Dependencias Python (beautifulsoup4) |
| `README.md` | Documentación del scraper |
| `.gitignore` | .venv/, *.pyc, etc. |

### Backend (`backend/`)

#### Configuración
| Archivo | Propósito |
|---------|-----------|
| `pom.xml` | Maven: dependencies, build, plugins |
| `Dockerfile` | Multi-stage build para producción |
| `.gitignore` | target/, *.jar, .idea/, etc. |

#### Código Java
| Archivo | Propósito |
|---------|-----------|
| `CarreerPathBackendApplication.java` | @SpringBootApplication main() |
| `domain/Materia.java` | Entidad JPA: id, nombre, correlativas, padres |
| `dto/MateriaDTO.java` | Response API: sin ciclos (IDs strings) |
| `dto/MateriaIngestionDTO.java` | Input: flexible, campos opcionales |
| `repository/MateriaRepository.java` | JPA Queries: find*, findWhere*, etc. |
| `service/DataIngestionService.java` | **Ingesta en 3 fases** (núcleo del sistema) |
| `service/MateriaService.java` | CRUD, filtros, estadísticas |
| `controller/MateriaController.java` | **REST API** (8 endpoints) |

#### Configuración Spring
| Archivo | Propósito |
|---------|-----------|
| `application.yml` | Desarrollo con H2 en memoria |
| `application-prod.yml` | Producción con PostgreSQL |

#### Scripts y Ejemplos
| Archivo | Propósito |
|---------|-----------|
| `test-api.sh` | Pruebas de todos los endpoints |
| `ejemplo-ingesta.json` | JSON de ejemplo para ingestar |
| `README.md` | Docs: endpoints, instalación, troubleshooting |

---

## 🎯 Archivos Clave

### ⭐ Para Empezar
1. **`GETTING_STARTED.md`** - Lee esto primero
2. **`ARCHITECTURE.md`** - Entiende la arquitectura
3. **`scraper/README.md`** - Usa el scraper
4. **`backend/README.md`** - Entiende la API

### 🔧 Para Desarrollar
1. **`backend/src/main/java/com/carreerpath/service/DataIngestionService.java`** - Lógica principal
2. **`backend/src/main/java/com/carreerpath/controller/MateriaController.java`** - Endpoints
3. **`backend/pom.xml`** - Dependencias

### 🚀 Para Deployar
1. **`docker-compose.yml`** - Local + PostgreSQL
2. **`backend/Dockerfile`** - Build multi-stage
3. **`run-pipeline.sh`** - Automatizar carga

---

## 📊 Estadísticas del Proyecto

| Categoría | Cantidad | Detalles |
|-----------|----------|---------|
| **Archivos Java** | 7 | domain, dto, repository, service, controller |
| **Archivos de Config** | 3 | application.yml, application-prod.yml, pom.xml |
| **Archivos Markdown** | 5 | README's + GETTING_STARTED + ARCHITECTURE |
| **Scripts Shell** | 2 | run-pipeline.sh, test-api.sh |
| **Archivos Python** | 1 | plan_parser.py |
| **Dependencias Maven** | 8+ | Spring Boot 3.2, JPA, Lombok, H2, PostgreSQL, etc. |

---

## 🔄 Flujo de Desarrollo

### 1. Preparar Datos
```bash
cd scraper
python3 plan_parser.py
# → genera plan_estudios.json
```

### 2. Inicializar Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 3. Ingestar Plan
```bash
curl -X POST http://localhost:8080/api/materias/ingestar \
  -d @../scraper/plan_estudios.json
```

### 4. Consultar / Extender
```bash
curl http://localhost:8080/api/materias
curl http://localhost:8080/api/materias/estadisticas
```

---

## ✅ Checklist de Archivos Generados

✅ Monorepo raíz
  - `README.md` - General
  - `GETTING_STARTED.md` - Guía rápida
  - `ARCHITECTURE.md` - Diagramas
  - `run-pipeline.sh` - Automatizar
  - `docker-compose.yml` - Orquestación
  - `.gitignore` - Git

✅ Scraper Python
  - `plan_parser.py` - Parser
  - `requirements.txt` - Deps
  - `README.md` - Docs
  - `.gitignore` - Git
  - (ejemplo: HTML + JSON)

✅ Backend Spring Boot
  - `pom.xml` - Maven
  - `Dockerfile` - Docker
  - 7 archivos `.java` (domain, dto x2, repository, service x2, controller)
  - 2 archivos `.yml` (dev + prod)
  - `test-api.sh` - Tests
  - `ejemplo-ingesta.json` - Ejemplo
  - `README.md` - Docs
  - `.gitignore` - Git

---

## 🎁 Bonus: Archivos Preparados para Extensión

- `Dockerfile` ready para builds multi-stage
- `docker-compose.yml` ready para prod
- `application-prod.yml` ready variables de entorno
- Estructura de carpetas lists para agregar más servicios
- `MateriaRepository` preparado para queries complejas
- `DataIngestionService` extensible para nuevas fases

---

## 📚 Próximos Archivos (TODO)

### Frontend
- `frontend/package.json`
- `frontend/src/components/MateriaList.jsx`
- `frontend/src/pages/index.jsx`
- `frontend/tailwind.config.js`

### Testing
- `backend/src/test/java/com/carreerpath/service/DataIngestionServiceTest.java`
- `backend/src/test/java/com/carreerpath/controller/MateriaControllerTest.java`

### CI/CD
- `.github/workflows/build.yml`
- `.github/workflows/deploy.yml`

---

## 🎯 Cómo Navegar el Proyecto

```
Nuevo en el proyecto?
  └─→ Lee: GETTING_STARTED.md

Quiero entender la arquitectura?
  └─→ Lee: ARCHITECTURE.md

Quiero usar el scraper?
  └─→ Lee: scraper/README.md

Quiero usar la API?
  └─→ Lee: backend/README.md

Quiero deployar?
  └─→ Usa: docker-compose.yml

Quiero testear rápido?
  └─→ Ejecuta: ./test-api.sh
```

---

Todos los archivos están listos. ¡Siguiente paso: ejecutar `GETTING_STARTED.md`! 🚀
