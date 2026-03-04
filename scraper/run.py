#!/usr/bin/env python3
"""Entrypoint para parsear HTMLs de input y generar JSONs de output.

Uso:
    python run.py                  # parsea todo
    python run.py historia         # solo historia académica
    python run.py plan oferta      # plan + oferta

Claves válidas: plan, oferta, historia
"""

import json
import sys
from pathlib import Path

from parsers import parse_plan, parse_oferta, parse_historia
from parsers.correlativas_patch import parse_correlativas_patch, apply_patches

BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"

PIPELINES = {
    "plan": {
        "nombre": "Plan de estudios",
        "input": "plan_estudios.html",
        "output": "plan_estudios.json",
        "parser": parse_plan,
    },
    "oferta": {
        "nombre": "Oferta de comisiones",
        "input": "oferta_comisiones.html",
        "output": "oferta_comisiones.json",
        "parser": parse_oferta,
    },
    "historia": {
        "nombre": "Historia académica",
        "input": "historia_academica.html",
        "output": "historia_academica.json",
        "parser": parse_historia,
    },
}


def run():
    args = sys.argv[1:]

    if args:
        claves_invalidas = [a for a in args if a not in PIPELINES]
        if claves_invalidas:
            print(f"Error: claves no reconocidas: {', '.join(claves_invalidas)}")
            print(f"Válidas: {', '.join(PIPELINES.keys())}")
            sys.exit(1)
        seleccion = args
    else:
        seleccion = list(PIPELINES.keys())

    OUTPUT_DIR.mkdir(exist_ok=True)

    exitosos = 0
    omitidos = 0

    for clave in seleccion:
        pipe = PIPELINES[clave]
        input_path = INPUT_DIR / pipe["input"]
        output_path = OUTPUT_DIR / pipe["output"]

        print(f"\n[{pipe['nombre']}]")

        if not input_path.exists():
            print(f"  OMITIDO: {input_path.name} no encontrado en input/")
            omitidos += 1
            continue

        html = input_path.read_text(encoding="utf-8")
        data = pipe["parser"](html)

        if clave == "plan":
            data = _aplicar_parches_correlativas(data)

        output_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"  -> {output_path.relative_to(BASE_DIR)}")
        exitosos += 1

    print(f"\nResultado: {exitosos} procesados, {omitidos} omitidos")

    if exitosos == 0:
        print("No se procesó nada. Revisá la carpeta input/.")
        sys.exit(1)


PATCH_FILE = INPUT_DIR / "cambios.csv"


def _aplicar_parches_correlativas(plan: list[dict]) -> list[dict]:
    if not PATCH_FILE.exists():
        return plan

    csv_content = PATCH_FILE.read_text(encoding="utf-8")
    patches = parse_correlativas_patch(csv_content)
    cambios = apply_patches(plan, patches)
    print(f"  Parches de correlativas aplicados: {cambios} materias modificadas")
    return plan


if __name__ == "__main__":
    run()
