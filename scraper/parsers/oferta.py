"""Parser de oferta de comisiones desde una tabla HTML.

Maneja forward-fill para filas donde código/nombre están vacíos (&nbsp;).
Normaliza horarios como 'MaVi12a14' en objetos estructurados.
"""

import re

from bs4 import BeautifulSoup

DIAS_ABREV = {
    "Lu": "LU",
    "Ma": "MA",
    "Mi": "MI",
    "Ju": "JU",
    "Vi": "VI",
    "Sa": "SA",
}

HORARIO_RE = re.compile(r"((?:Lu|Ma|Mi|Ju|Vi|Sa)+)(\d{2})a(\d{2})")


def _limpiar(texto: str) -> str:
    return texto.replace("\xa0", "").strip()


def _parsear_horario(raw: str) -> list[dict]:
    raw = _limpiar(raw)
    if not raw:
        return []

    match = HORARIO_RE.search(raw)
    if not match:
        return [{"dia": raw, "inicio": None, "fin": None}]

    dias_str = match.group(1)
    inicio = f"{match.group(2)}:00"
    fin = f"{match.group(3)}:00"

    dias = re.findall(r"Lu|Ma|Mi|Ju|Vi|Sa", dias_str)

    return [
        {"dia": DIAS_ABREV[d], "inicio": inicio, "fin": fin}
        for d in dias
    ]


def parse_oferta(html_content: str) -> list[dict]:
    soup = BeautifulSoup(html_content, "html.parser")
    table = soup.find("table")
    if not table:
        raise ValueError("No se encontró ninguna <table> en el HTML de oferta.")

    tbody = table.find("tbody")
    rows = tbody.find_all("tr") if tbody else table.find_all("tr")

    materias: dict[str, dict] = {}
    codigo_actual = None
    nombre_actual = None
    total_comisiones = 0

    for tr in rows:
        tds = tr.find_all("td")
        if len(tds) < 7:
            continue

        codigo_raw = _limpiar(tds[0].get_text())
        nombre_raw = _limpiar(tds[1].get_text())

        if codigo_raw and nombre_raw:
            codigo_actual = codigo_raw
            nombre_actual = nombre_raw

        if codigo_actual is None:
            continue

        comision_id = _limpiar(tds[2].get_text())
        horario_raw = tds[4].get_text()
        modalidad_tag = tds[5].find("a")
        modalidad = _limpiar(modalidad_tag.get_text()) if modalidad_tag else _limpiar(tds[5].get_text())
        sede = _limpiar(tds[6].get_text())

        comision = {
            "id": comision_id,
            "horarios": _parsear_horario(horario_raw),
            "sede": sede,
            "modalidad": modalidad,
        }

        if codigo_actual not in materias:
            materias[codigo_actual] = {
                "codigo_materia": codigo_actual,
                "nombre": nombre_actual,
                "comisiones": [],
            }

        materias[codigo_actual]["comisiones"].append(comision)
        total_comisiones += 1

    resultado = list(materias.values())
    print(f"  Materias: {len(resultado)} | Comisiones: {total_comisiones}")
    return resultado
