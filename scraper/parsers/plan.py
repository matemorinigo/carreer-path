"""Parser del plan de estudios desde una tabla HTML.

Extrae de cada fila <tr>:
- id, nombre, correlativas, horas
- padreId: si la materia es opción de una electiva
- esObligatoria: false si el nombre termina en * (optativa)
- anual: true si el nombre termina en ** (materia anual, solo 1er cuatrimestre)
- esTransversal: true si pertenece a "Conocimientos comunes requeridos por HCS"

Convenciones de nombre en el HTML del plan:
  "Taller de Integración*"     → optativa (no obligatoria)
  "Proyecto Final de Carrera**" → anual (2 cuatrimestres, inicia en el 1ro)
"""

import re
from bs4 import BeautifulSoup


def parse_plan(html_content: str) -> list[dict]:
    soup = BeautifulSoup(html_content, "html.parser")
    materias = []

    for table in soup.find_all("table"):
        electiva_section = _detect_electiva_section(table)
        es_transversal = _is_transversal_section(table)

        for tr in table.find_all("tr"):
            try:
                code_cell = tr.find("th", class_="sub")
                if not code_cell:
                    continue

                materia_id = code_cell.get_text(strip=True)

                tds = tr.find_all("td")
                if len(tds) < 3:
                    continue

                nombre_a = tds[0].find("a")
                if nombre_a:
                    nombre = nombre_a.get_text(strip=True)
                else:
                    nombre = tds[0].get_text(strip=True)
                    if not nombre:
                        continue

                nombre, es_obligatoria, anual = _parse_nombre_flags(nombre)

                corr_text = tds[1].get_text(strip=True)
                if corr_text == "---" or not corr_text:
                    correlativas = []
                else:
                    correlativas = [c.strip() for c in corr_text.split("/") if c.strip()]

                horas_text = tds[2].get_text(strip=True)
                try:
                    horas = int(horas_text)
                except ValueError:
                    horas = None

                materia = {
                    "id": materia_id,
                    "nombre": nombre,
                    "correlativas": correlativas,
                    "horas": horas,
                    "esObligatoria": es_obligatoria,
                }

                if anual:
                    materia["anual"] = True

                if es_transversal:
                    materia["esTransversal"] = True

                if electiva_section:
                    materia["_electiva_group"] = electiva_section

                materias.append(materia)

            except Exception:
                continue

    _resolve_electiva_parents(materias)
    return materias


def _parse_nombre_flags(nombre: str) -> tuple[str, bool, bool]:
    """Detecta sufijos * y ** en el nombre y devuelve (nombre_limpio, esObligatoria, anual)."""
    if nombre.endswith("**"):
        return nombre[:-2].strip(), True, True
    if nombre.endswith("*"):
        return nombre[:-1].strip(), False, False
    return nombre, True, False


def _detect_electiva_section(table) -> str | None:
    """Detecta si una tabla es una sección 'Electivas X YYYY' y devuelve el numeral romano."""
    header_th = table.find("th", attrs={"colspan": "5"})
    if not header_th:
        return None
    header_text = header_th.get_text(strip=True)
    match = re.match(r"Electivas\s+(I{1,3}V?)\s+\d{4}", header_text)
    return match.group(1) if match else None


def _is_transversal_section(table) -> bool:
    """Detecta si una tabla es la sección de conocimientos comunes/transversales."""
    header_th = table.find("th", attrs={"colspan": "5"})
    if not header_th:
        return False
    header_text = header_th.get_text(strip=True)
    return "Conocimientos comunes" in header_text


def _resolve_electiva_parents(materias: list[dict]) -> None:
    """Vincula opciones de electiva con su slot padre via padreId."""
    slot_map = {}
    for m in materias:
        match = re.match(r"^Electiva\s+(I{1,3}V?)$", m["nombre"])
        if match:
            slot_map[match.group(1)] = m["id"]

    for m in materias:
        group = m.pop("_electiva_group", None)
        if group and group in slot_map:
            m["padreId"] = slot_map[group]
