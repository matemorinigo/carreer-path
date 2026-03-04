"""Parser de historia académica desde HTML con divs Bootstrap.

Cada div.historia-item contiene una materia aprobada con:
código, nombre, origen, acta/resolución, fecha, nota.
"""

from bs4 import BeautifulSoup


def parse_historia(html_content: str) -> list[dict]:
    soup = BeautifulSoup(html_content, "html.parser")
    items = soup.find_all("div", class_="historia-item")

    materias = []

    for item in items:
        codigo_div = item.find("div", class_="fw-bold")
        nombre_div = item.find("div", class_="fw-medium")
        nota_div = item.find("div", class_="nota-destacada")

        if not codigo_div or not nombre_div:
            continue

        codigo = codigo_div.get_text(strip=True)
        nombre = nombre_div.get_text(strip=True)

        nota_raw = nota_div.get_text(strip=True) if nota_div else None
        try:
            nota = int(nota_raw)
        except (ValueError, TypeError):
            nota = None

        cols = item.find_all("div", recursive=False)
        row = cols[0] if cols else item
        celdas = row.find_all("div", class_=lambda c: c and "col-lg-" in c)

        origen = None
        acta = None
        fecha = None

        if len(celdas) >= 6:
            origen_container = celdas[2]
            divs = origen_container.find_all("div", recursive=False)
            inner = divs[0] if divs else origen_container
            for d in inner.find_all("div"):
                classes = d.get("class", [])
                if "text-muted" not in " ".join(classes):
                    origen = d.get_text(strip=True)
                    break

            acta_div = celdas[3].find("div", class_="small")
            if acta_div:
                acta = acta_div.get_text(strip=True)

            fecha_div = celdas[4].find("div", class_="small")
            if fecha_div:
                fecha = fecha_div.get_text(strip=True)

        materias.append({
            "codigo": codigo,
            "nombre": nombre,
            "origen": origen,
            "acta_resolucion": acta,
            "fecha": fecha,
            "nota": nota,
        })

    print(f"  Materias aprobadas: {len(materias)}")
    return materias
