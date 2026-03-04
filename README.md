# 📚 Carreer Path - Monorepo de Ingesta de Planes de Estudio

Un sistema modular y escalable para extraer, procesar e integrar planes de estudio universitarios de múltiples universidades. Agnóstico a la institución, flexible y extensible.

## 🏗️ Arquitectura del Monorepo

```
carreer-path/
├── scraper/           # 🐍 Python - Extractor de HTML
│   ├── plan_parser.py      # Script principal
│   ├── plan_estudios.html  # HTML de entrada
│   ├── plan_estudios.json  # JSON generado
│   └── requirements.txt
│
├── backend/           # 🚀 Spring Boot 3.2 / Java 21 (En progreso)
│   ├── pom.xml            # Dependencies
│   ├── src/main/java/com/carreerpath/
│   │   ├── domain/         # Entidades JPA
│   │   ├── dto/            # DTOs
│   │   ├── service/        # Lógica de negocio
│   │   ├── repository/     # Acceso a datos
│   │   └── controller/     # REST API
│   ├── src/main/resources/ # Configuración perfiles
│   ├── README.md           # Documentación
│   └── .gitignore
│
└── frontend/          # ⚛️ React / Next.js (TODO)
    ├── components/
    ├── pages/
    └── public/

```

## 🚀 Flujo de Datos

```
Universidad HTML
    ↓
[SCRAPER] Python + BeautifulSoup
    ↓
plan_estudios.json
    ↓
[BACKEND] Spring Boot - DataIngestionService
    ↓
PostgreSQL / H2
    ↓
[FRONTEND] React / Next.js
    ↓
Visualización interactiva
```

---

## 📍 Fase 1: Scraper (✅ COMPLETADO)

Extrae información de fragmentos HTML de planes de estudio y genera JSON estructurado.

**Ubicación**: `/scraper`

### Características
- ✅ Usa BeautifulSoup para parsing de HTML
- ✅ Separa correlatividades por delimitador ` / `
- ✅ Manejo de errores robusto
- ✅ Salida JSON validada

### Uso Rápido
```bash
cd scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 plan_parser.py
```

**Output**: `plan_estudios.json`

---

## 📍 Fase 2: Backend (✅ COMPLETADO)

Motor agnóstico de ingesta en Spring Boot 3.2 con arquitectura limpia y escalable.

**Ubicación**: `/backend`

### Características
- ✅ Modelo de dominio desacoplado (Materia con relaciones M-to-M y M-to-1)
- ✅ Servicio de ingesta en 3 fases (nodos → correlativas → padres)
- ✅ DTOs sin ciclos infinitos de serialización
- ✅ BD configurable: H2 (dev) / PostgreSQL (prod)
- ✅ API REST completa
- ✅ Agnóstico a la universidad (mismo código para cualquier plan)

### Endpoints
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/materias/ingestar` | Ingestar plan completo |
| GET | `/api/materias` | Obtener todas las materias |
| GET | `/api/materias/{id}` | Obtener una materia |
| GET | `/api/materias/filter/obligatorias` | Filtrar obligatorias |
| GET | `/api/materias/filter/optativas` | Filtrar optativas |
| GET | `/api/materias/{padreId}/hijas` | Obtener opciones de Electivas |
| GET | `/api/materias/estadisticas` | Estadísticas |
| DELETE | `/api/materias` | Limpiar todas las materias |

### Ejecución Rápida
```bash
cd backend
mvn clean install
mvn spring-boot:run          # H2 automático
# O con PostgreSQL:
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"
```

**API en**: `http://localhost:8080`

---

## 📍 Fase 3: Frontend (🚧 TODO)

Interfaz visual interactiva con React/Next.js.

### Componentes Planeados
- [ ] Página de carga de planes
- [ ] Vista de árbol de correlatividades
- [ ] Filtros: obligatorias/optativas/por semestre
- [ ] Visualización de camino crítico (prerrequisitos)
- [ ] Dashboard de estadísticas
- [ ] Comparador de planes entre carreras

---

## 🔗 Integración Entre Capas

### Scraper → Backend
El JSON del scraper se transforma a `MateriaIngestionDTO` del backend:

```python
# plan_estudios.json (scraper)
[
  {
    "id": "3621",
    "nombre": "Matemática Discreta",
    "correlativas": [],
    "horas": 4
  }
]
```

↓ Se transforma a:

```json
[
  {
    "id": "3621",
    "nombre": "Matemática Discreta",
    "horas": 4,
    "esObligatoria": true,
    "correlativas": []
  }
]
```

↓ Se envía a:

```bash
POST /api/materias/ingestar
```

### Backend → Frontend
El frontend consume la API REST:

```javascript
fetch('http://localhost:8080/api/materias')
  .then(r => r.json())
  .then(materias => {
    // Renderizar componentes
  })
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Scraper** | Python | 3.8+ |
| | BeautifulSoup | 4.x |
| **Backend** | Java | 21 LTS |
| | Spring Boot | 3.2.1 |
| | JPA/Hibernate | - |
| | Lombok | - |
| | Maven | 3.6+ |
| **Database (Dev)** | H2 | - |
| **Database (Prod)** | PostgreSQL | 12+ |
| **Frontend** | React/Next.js | 18+ |
| **Build** | npm/yarn | - |

---

## 📋 Checklist del Proyecto

### Scraper
- [x] Parser HTML con BeautifulSoup
- [x] Separación de correlatividades por ` / `
- [x] Manejo de `---` como lista vacía
- [x] Generación JSON `plan_estudios.json`
- [x] Error handling robusto

### Backend
- [x] Entidad `Materia` con relaciones
- [x] Servicio `DataIngestionService` en 3 fases
- [x] DTOs para evitar ciclos
- [x] Repositorio JPA
- [x] Controlador REST API
- [x] Configuración H2 (dev)
- [x] Configuración PostgreSQL (prod)
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Validación con Bean Validation
- [ ] Paginación en listados
- [ ] Filtros avanzados

### Frontend
- [ ] Proyecto Next.js base
- [ ] Componentes de visualización
- [ ] Consumo de API
- [ ] Filtros interactivos
- [ ] Dashboard de estadísticas

---

## 🚀 Quick Start

### 1. Scraper
```bash
cd scraper
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 plan_parser.py
cat plan_estudios.json
```

### 2. Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
# API lista en http://localhost:8080/api/materias
```

### 3. Probar ingesta
```bash
curl -X POST http://localhost:8080/api/materias/ingestar \
  -H "Content-Type: application/json" \
  -d @/path/to/plan_estudios.json
```

---

## 📖 Documentación

- [Scraper README](scraper/README.md) - Guía completa del parser
- [Backend README](backend/README.md) - API y arquitectura
- [Frontend README](frontend/README.md) *(próximamente)*

---

## 🎯 Principios de Diseño

### Agnóstico a la Universidad
El mismo código funciona para cualquier plan de estudios. No hay hardcoding de nombres, reglas específicas, o estructuras rígidas.

### Desacoplamiento
Cada capa es independiente:
- El scraper genera JSON estándar
- El backend no asume nada del scraper
- El frontend consume la API, sin conocer detalles del backend

### Escalabilidad
- Soporta múltiples universidades/planes simultáneamente
- Ingesta en 3 fases átomicas
- BD configurable para crecer con el sistema

---

## 🔮 Visión Futura

- [ ] Soporte para múltiples planes en la misma BD
- [ ] API de validación de camino crítico
- [ ] Exportación a Excel/PDF
- [ ] Integración con sistemas de inscripción universitarios
- [ ] Análisis de correlatividades circulares
- [ ] Recomendaciones de orden de cursada
- [ ] Comparador de planes entre universidades

---

## 📝 Licencia

MIT

---

**Está siendo desarrollado como solución escalable para gestionar planes de estudio universitarios de múltiples carreras e instituciones.**
