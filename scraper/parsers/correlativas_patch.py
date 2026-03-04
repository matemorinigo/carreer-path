"""Parser de cambios de correlativas desde CSV.

Formato CSV: materia,quitar,agregar
- Múltiples valores separados por /
- "TODAS LAS ACTUALES" en quitar = reemplazar todas las correlativas
- Múltiples materias en la primera columna separadas por / aplican el mismo cambio
"""

import csv
from io import StringIO


ELECTIVA_SLOTS = ["3672", "3673", "3674"]


def parse_correlativas_patch(csv_content: str) -> list[dict]:
    patches = []
    reader = csv.DictReader(StringIO(csv_content.strip()))

    for row in reader:
        materias = [c.strip() for c in row["materia"].split("/") if c.strip()]
        quitar_raw = row.get("quitar", "").strip()
        agregar_raw = row.get("agregar", "").strip()

        reemplazar_todas = quitar_raw.upper() == "TODAS LAS ACTUALES"
        quitar = [] if reemplazar_todas else _split_ids(quitar_raw)
        agregar = _split_ids(agregar_raw)

        for materia_id in materias:
            patches.append({
                "materia": materia_id,
                "quitar": quitar,
                "agregar": agregar,
                "reemplazarTodas": reemplazar_todas,
            })

        if reemplazar_todas:
            for slot_id in ELECTIVA_SLOTS:
                patches.append({
                    "materia": slot_id,
                    "quitar": [],
                    "agregar": [],
                    "reemplazarTodas": True,
                })

    return patches


def apply_patches(plan: list[dict], patches: list[dict]) -> int:
    """Aplica los parches sobre la lista de materias del plan. Retorna cantidad de cambios."""
    plan_by_id = {m["id"]: m for m in plan}
    cambios = 0

    for patch in patches:
        materia = plan_by_id.get(patch["materia"])
        if materia is None:
            continue

        corr = set(materia.get("correlativas", []))
        original = set(corr)

        if patch["reemplazarTodas"]:
            corr = set(patch["agregar"])
        else:
            corr -= set(patch["quitar"])
            corr |= set(patch["agregar"])

        materia["correlativas"] = sorted(corr)
        if corr != original:
            cambios += 1

    return cambios


def _split_ids(raw: str) -> list[str]:
    if not raw:
        return []
    return [c.strip() for c in raw.split("/") if c.strip()]
