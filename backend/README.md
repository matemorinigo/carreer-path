# Carreer Path Backend

Motor genérico e agnóstico de ingesta de planes de estudio universitarios en Spring Boot 3.2 con Java 21.

## Características

✅ **Modelo de Dominio Desacoplado**
- Entidad `Materia` sin reglas de negocio por nombre
- Relación Many-to-Many para correlatividades
- Relación Many-to-One opcional para `materiaPadre` (ej: Electivas slot)

✅ **Servicio de Ingesta en 3 Fases**
1. Guardar todas las materias como nodos básicos
2. Establecer vínculos de correlatividad
3. Establecer vínculos de `materiaPadre`

✅ **Agnóstico a la Universidad**
- El mismo código funciona para cualquier plan de estudios
- Campos opcionales: `esObligatoria`, `padreId`, `correlativas`

✅ **DTOs sin Ciclos Infinitos**
- `MateriaDTO`: devuelve IDs en lugar de entidades completas
- `MateriaIngestionDTO`: entrada flexible para JSON

✅ **Base de Datos Configurable**
- **Desarrollo**: H2 en memoria (automático)
- **Producción**: PostgreSQL con variables de entorno

## Estructura del Proyecto

```
backend/
├── pom.xml
├── src/main/
│   ├── java/com/carreerpath/
│   │   ├── CarreerPathBackendApplication.java (Spring Boot main)
│   │   ├── domain/
│   │   │   └── Materia.java (Entidad JPA)
│   │   ├── dto/
│   │   │   ├── MateriaDTO.java (Respuesta API)
│   │   │   └── MateriaIngestionDTO.java (Entrada JSON)
│   │   ├── repository/
│   │   │   └── MateriaRepository.java (JPA Repository)
│   │   ├── service/
│   │   │   ├── DataIngestionService.java (Ingesta en 3 fases)
│   │   │   └── MateriaService.java (CRUD y consultas)
│   │   └── controller/
│   │       └── MateriaController.java (REST API)
│   └── resources/
│       ├── application.yml (Perfil dev - H2)
│       └── application-prod.yml (Perfil prod - PostgreSQL)
└── README.md
```

## Instalación y Ejecución

### Desarrollo (H2 en memoria)

```bash
# Compilar
mvn clean install

# Ejecutar (automáticamente usa H2)
mvn spring-boot:run

# La API estará en http://localhost:8080
# Consola H2 en http://localhost:8080/h2-console
```

### Producción (PostgreSQL)

```bash
# Variables de entorno (opcional, tienen defaults)
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=carreerpathdb
export DB_USER=postgres
export DB_PASSWORD=postgres

# Ejecutar con perfil prod
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"

# O en JAR compilado:
java -jar target/backend-1.0.0.jar --spring.profiles.active=prod
```

## API REST

### 1. Ingestar un Plan de Estudios

**POST** `/api/materias/ingestar`

**Body** (JSON):
```json
[
  {
    "id": "3621",
    "nombre": "Matemática Discreta",
    "horas": 4,
    "esObligatoria": true
  },
  {
    "id": "3622",
    "nombre": "Análisis Matemático I",
    "horas": 4,
    "esObligatoria": true
  },
  {
    "id": "3628",
    "nombre": "Física I",
    "horas": 4,
    "correlativas": ["3622"]
  },
  {
    "id": "3672",
    "nombre": "Electiva I",
    "horas": 4,
    "esObligatoria": false,
    "correlativas": ["3658", "3661", "3663"]
  },
  {
    "id": "3673",
    "nombre": "Opción A - Electiva I",
    "horas": 4,
    "padreId": "3672"
  }
]
```

**Respuesta** (201 Created):
```json
{
  "exito": true,
  "mensaje": "Ingesta completada exitosamente",
  "materiasGuardadas": 5,
  "error": null
}
```

### 2. Obtener todas las materias

**GET** `/api/materias`

**Respuesta** (200 OK):
```json
[
  {
    "id": "3621",
    "nombre": "Matemática Discreta",
    "esObligatoria": true,
    "horas": 4,
    "materiaPadreId": null,
    "correlativasIds": []
  },
  {
    "id": "3628",
    "nombre": "Física I",
    "esObligatoria": true,
    "horas": 4,
    "materiaPadreId": null,
    "correlativasIds": ["3622"]
  }
]
```

### 3. Obtener una materia específica

**GET** `/api/materias/{id}`

```bash
curl http://localhost:8080/api/materias/3621
```

### 4. Obtener materias obligatorias

**GET** `/api/materias/filter/obligatorias`

### 5. Obtener materias optativas

**GET** `/api/materias/filter/optativas`

### 6. Obtener opciones de una Electiva (hijas)

**GET** `/api/materias/{padreId}/hijas`

```bash
# Obtiene todas las opciones de la Electiva I
curl http://localhost:8080/api/materias/3672/hijas
```

### 7. Obtener estadísticas

**GET** `/api/materias/estadisticas`

**Respuesta**:
```json
{
  "total": 65,
  "obligatorias": 55,
  "optativas": 10,
  "horasTotal": 260
}
```

### 8. Limpiar e reingestar

**DELETE** `/api/materias` (elimina todas)

```bash
curl -X DELETE http://localhost:8080/api/materias
```

Luego **POST** `/api/materias/ingestar` con el nuevo plan.

## Modelo de Datos

### Tabla `materias`

| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | VARCHAR(50) | PRIMARY KEY |
| nombre | VARCHAR(255) | NOT NULL |
| es_obligatoria | BOOLEAN | NOT NULL |
| horas | INTEGER | NOT NULL |
| materia_padre_id | VARCHAR(50) | FK (nullable) |

### Tabla `materia_correlativas` (Join Many-to-Many)

| Columna | Tipo | Constraints |
|---------|------|-------------|
| materia_id | VARCHAR(50) | FK (PK) |
| correlativa_id | VARCHAR(50) | FK (PK) |

## Flujo de Ingesta

```
JSON Input
    ↓
Fase 1: Guardar nodos básicos (sin relaciones)
    ↓
Fase 2: Establecer correlatividades (Many-to-Many)
    ↓
Fase 3: Establecer materias padre (Many-to-One)
    ↓
IngestionResult (exito | error)
```

Si falla alguna materia individual, se salta y otras continúan. El servicio es robusto contra datos malformados.

## Agnóstica = Escalable

Mañana si cargas un plan de otra carrera (ej: Ingeniería Comercial), solo necesitas:

1. Exportar el plan como JSON (con el mismo formato)
2. **POST** `/api/materias/ingestar`

Sin tocar **una sola línea** de código Java. El motor de ingesta es completamente genérico.

## Tecnologías

- **Spring Boot 3.2.1** - Framework
- **Java 21** - Lenguaje
- **JPA / Hibernate** - ORM
- **Lombok** - Reducción de boilerplate
- **H2** - BD de desarrollo
- **PostgreSQL** - BD de producción
- **Maven** - Build

## Próximos Pasos

- [ ] Tests unitarios para DataIngestionService
- [ ] Tests de integración para MateriaController
- [ ] Validación con Bean Validation (@Valid)
- [ ] Paginación en endpoints de listado
- [ ] Filtros avanzados por hora, correlatividad, etc.
- [ ] Integración con el frontend React/Vue
- [ ] Autenticación y autorización (JWT)
- [ ] Soporte para múltiples planes simultáneamente

## Autor

GitHub Copilot | Claude Haiku 4.5

## Licencia

MIT
