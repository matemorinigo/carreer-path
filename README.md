# Syllabus — Planificador de carrera

Planificador de cursada para la carrera de la UNLaM: subís tu historia académica (PDF, HTML o JSON del SIU) y arma el recorrido cuatrimestre por cuatrimestre respetando correlativas, horarios de las comisiones y los turnos que elijas.

La app es 100% frontend (React + Vite) y se publica en GitHub Pages. No hay backend: el planificador corre en el navegador.

## Estructura

```
carreer-path/
├── frontend/                  # React + Vite + Tailwind
│   └── src/
│       ├── planner/
│       │   ├── planificador.js    # algoritmo que arma el plan
│       │   └── moverMateria.js    # validación del drag & drop (correlativas + horarios)
│       ├── data/
│       │   ├── planEstudios.json      # plan de estudios (materias, correlativas, electivas)
│       │   └── ofertaComisiones.json  # oferta de comisiones del cuatrimestre
│       ├── components/            # PlanView, timeline editable, red de materias, Cazador...
│       └── utils/                 # parsers de historia (PDF/HTML) y oferta
└── scraper/                   # Python: HTML del SIU → JSON
    ├── input/                 # HTMLs fuente
    ├── output/                # JSONs generados
    └── run.py
```

## Desarrollo

```bash
cd frontend
npm install
npm run dev
```

El deploy a GitHub Pages lo hace `.github/workflows/frontend.yml` en cada push a `main` que toque `frontend/`.

## Actualizar plan u oferta

```bash
cd scraper
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py plan oferta

cp output/plan_estudios.json ../frontend/src/data/planEstudios.json
cp output/oferta_comisiones.json ../frontend/src/data/ofertaComisiones.json
```

La oferta también se puede actualizar sin tocar el repo desde la app ("Actualizar oferta de materias"), subiendo el HTML de la Oferta de Materias de Intraconsulta.

## Cómo arma el plan

- Ordena las materias cursables por cuántas otras dependen de ellas (transitivamente), así las que destraban más van primero.
- Asigna comisiones sin choques de horario y dentro de los turnos elegidos; las electivas (pool compartido Electiva I/II/III) se resuelven al final para acomodarse en lo que quede libre.
- Mecha una transversal por cuatrimestre (o la suma como bonus si es asincrónica).
- Proyecto Final es anual: arranca en un 1er cuatrimestre y ocupa los dos.
- Si dos materias chocan pero ninguna bloquea nada a futuro, quedan marcadas como intercambiables.

Sobre el plan generado se pueden arrastrar materias entre cuatrimestres: sólo deja soltar donde se cumplen las correlativas y hay una comisión que entra en los horarios libres.
