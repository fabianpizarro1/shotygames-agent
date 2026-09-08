# -*- coding: utf-8 -*-
"""Sistema de Administracion CandyShots - generador del workbook."""
import openpyxl
import datetime
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule

OUT = "/Users/user/Projects/KEPLER/projects/abrir-candyshots/administracion/CandyShots-Administracion.xlsx"

# ---------- estilos ----------
F = "Arial"
BLUE = "0000FF"      # input duro
BLACK = "000000"     # formula
GREEN = "008000"     # link a otra hoja
HDR_FILL = PatternFill("solid", fgColor="1F3864")
HDR_FONT = Font(name=F, size=10, bold=True, color="FFFFFF")
TITLE_FONT = Font(name=F, size=16, bold=True, color="1F3864")
SUB_FONT = Font(name=F, size=9, italic=True, color="595959")
YELLOW = PatternFill("solid", fgColor="FFF2CC")
GREY = PatternFill("solid", fgColor="F2F2F2")
SECT_FILL = PatternFill("solid", fgColor="D9E2F3")
thin = Side(style="thin", color="BFBFBF")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)

MON = '"$"#,##0.00;("$"#,##0.00);-'
MON4 = '"$"#,##0.0000;("$"#,##0.0000);-'
PCT = '0.0%;(0.0%);-'
NUM = '#,##0.00;(#,##0.00);-'
INT = '#,##0;(#,##0);-'
DATE = 'yyyy-mm-dd'

def title(ws, t, sub, ncols):
    ws["A1"] = t; ws["A1"].font = TITLE_FONT
    ws["A2"] = sub; ws["A2"].font = SUB_FONT
    ws.row_dimensions[1].height = 24

def headers(ws, row, cols, widths):
    for i, (h, w) in enumerate(zip(cols, widths), start=1):
        c = ws.cell(row=row, column=i, value=h)
        c.font = HDR_FONT; c.fill = HDR_FILL
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BOX
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 30
    ws.freeze_panes = ws.cell(row=row + 1, column=1)

def style_range(ws, r1, r2, c1, c2, fmt=None, color=BLACK, fill=None, align=None):
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            cell = ws.cell(row=r, column=c)
            cell.font = Font(name=F, size=10, color=color)
            if fmt: cell.number_format = fmt
            if fill: cell.fill = fill
            if align: cell.alignment = Alignment(horizontal=align)
            cell.border = BOX

# ---------- rangos globales (definidos arriba para poder referenciarlos en cualquier hoja) ----------
IN_R1, IN_R2 = 5, 84
RE_R1, RE_R2 = 5, 254
CO_R1, CO_R2 = 5, 24
PR_R1, PR_R2 = 5, 44
VE_R1, VE_R2 = 5, 504
GA_R1, GA_R2 = 5, 304
CA_R1, CA_R2 = 5, 204
GF_R1, GF_R2 = 5, 24
IV_R1, IV_R2 = 5, 84

INSUMO_RANGE = f"INSUMOS!$B${IN_R1}:$B${IN_R2}"
INSUMO_COST  = f"INSUMOS!$I${IN_R1}:$I${IN_R2}"
INSUMO_UNIT  = f"INSUMOS!$G${IN_R1}:$G${IN_R2}"
RE_PROD = f"RECETAS!$B${RE_R1}:$B${RE_R2}"
RE_INS  = f"RECETAS!$C${RE_R1}:$C${RE_R2}"
RE_CANT = f"RECETAS!$D${RE_R1}:$D${RE_R2}"
RE_COST = f"RECETAS!$G${RE_R1}:$G${RE_R2}"
RE_CONS = f"RECETAS!$J${RE_R1}:$J${RE_R2}"
CO_NAME = f"COMBOS!$B${CO_R1}:$B${CO_R2}"
CO_COST = f"COMBOS!$K${CO_R1}:$K${CO_R2}"
PROD_NAME = f"PRODUCTOS!$B${PR_R1}:$B${PR_R2}"
PROD_PVP  = f"PRODUCTOS!$E${PR_R1}:$E${PR_R2}"
PROD_COST = f"PRODUCTOS!$D${PR_R1}:$D${PR_R2}"
VE_FEC  = f"VENTAS!$A${VE_R1}:$A${VE_R2}"
VE_MES  = f"VENTAS!$B${VE_R1}:$B${VE_R2}"
VE_PROD = f"VENTAS!$C${VE_R1}:$C${VE_R2}"
VE_CANT = f"VENTAS!$D${VE_R1}:$D${VE_R2}"
VE_TOT  = f"VENTAS!$F${VE_R1}:$F${VE_R2}"
VE_IVA  = f"VENTAS!$G${VE_R1}:$G${VE_R2}"
VE_NETO = f"VENTAS!$H${VE_R1}:$H${VE_R2}"
VE_COSTO= f"VENTAS!$I${VE_R1}:$I${VE_R2}"
VE_UTIL = f"VENTAS!$J${VE_R1}:$J${VE_R2}"
VE_PAGO = f"VENTAS!$K${VE_R1}:$K${VE_R2}"
GA_FEC  = f"GASTOS!$A${GA_R1}:$A${GA_R2}"
GA_MES  = f"GASTOS!$B${GA_R1}:$B${GA_R2}"
GA_CAT  = f"GASTOS!$C${GA_R1}:$C${GA_R2}"
GA_MON  = f"GASTOS!$E${GA_R1}:$E${GA_R2}"
GA_TIPO = f"GASTOS!$F${GA_R1}:$F${GA_R2}"
GA_PAGO = f"GASTOS!$G${GA_R1}:$G${GA_R2}"
GA_CAJA = f"GASTOS!$H${GA_R1}:$H${GA_R2}"
P_IVA  = "INICIO!$C$5"
P_REC  = "INICIO!$C$6"
P_DIAS = "INICIO!$C$7"
P_MES  = "INICIO!$C$8"
P_MARG = "INICIO!$C$9"

wb = openpyxl.Workbook()

# =====================================================================
# 1. INICIO
# =====================================================================
ws = wb.active; ws.title = "INICIO"
title(ws, "CANDYSHOTS — SISTEMA DE ADMINISTRACION",
      "Machala, Ecuador · v1.0 · Todos los valores en USD", 6)
ws.column_dimensions["A"].width = 4
ws.column_dimensions["B"].width = 42
ws.column_dimensions["C"].width = 16
ws.column_dimensions["D"].width = 70

rows = [
    ("S", "PARAMETROS GLOBALES", "", "Cambia estos valores y TODO el sistema se recalcula."),
    ("P", "IVA de venta (Ecuador 2026)", 0.15, "Tarifa vigente. Tus precios de carta se asumen CON IVA incluido."),
    ("P", "¿Recuperas el IVA de tus compras? (SI/NO)", "SI",
     "CONFIRMADO 2026-09-07: SI. Regimen general con RUC, credito tributario. Si eso cambia, ponlo en NO."),
    ("P", "Dias de operacion al mes", 26, "Se usa para punto de equilibrio y proyecciones."),
    ("P", "Mes que analiza el DASHBOARD (AAAA-MM)", "2026-09", "Escribe el mes que quieres ver. Ej: 2026-10"),
    ("P", "Margen objetivo por defecto", 0.70, "Se usa para calcular el PVP sugerido de productos nuevos."),
    ("", "", "", ""),
    ("S", "COMO USAR ESTE ARCHIVO", "", ""),
    ("T", "Colores", "", "AZUL = escribes tu.  NEGRO = formula, no tocar.  VERDE = viene de otra hoja.  FONDO AMARILLO = celda para llenar."),
    ("", "", "", ""),
    ("S", "ORDEN DE LLENADO (primera vez)", "", ""),
    ("T", "1. INSUMOS", "", "Cada cosa que compras: precio y cuanto rinde. Es la base de todo."),
    ("T", "2. RECETAS", "", "Que insumos y cuanta cantidad lleva cada producto."),
    ("T", "3. PRODUCTOS", "", "Precio de venta al publico. Te dice utilidad, margen y si el precio esta bien."),
    ("T", "4. COMBOS", "", "Arma combos y ve cuanto margen sacrificas antes de lanzarlos."),
    ("T", "5. GASTOS_FIJOS", "", "Arriendo, luz, sueldos. Alimenta el punto de equilibrio."),
    ("", "", "", ""),
    ("S", "USO DIARIO", "", ""),
    ("T", "VENTAS", "", "Una fila por venta. Elige producto del desplegable y pon la cantidad. El resto se calcula solo."),
    ("T", "GASTOS", "", "Cada compra o pago que sale del negocio."),
    ("T", "CAJA", "", "Al cerrar el dia: cuanto habia, cuanto contaste. Te muestra el descuadre."),
    ("", "", "", ""),
    ("S", "SOLO LECTURA (no escribes nada)", "", ""),
    ("T", "DASHBOARD", "", "Resumen del mes: venta, utilidad, top productos, alertas."),
    ("T", "EQUILIBRIO", "", "Cuantos vasos al dia necesitas para no perder plata. El numero mas importante."),
    ("T", "PYG", "", "Estado de resultados mes a mes con datos reales."),
    ("T", "PROYECCIONES", "", "3 escenarios a 12 meses."),
    ("T", "INVENTARIO", "", "Stock y alertas de compra."),
    ("", "", "", ""),
    ("S", "REGLA DE ORO", "", ""),
    ("T", "", "", "Si no registras las ventas todos los dias, este archivo no sirve para nada. 2 minutos al cierre."),
    ("", "", "", ""),
    ("S", "COMO ESTA CONECTADO TODO", "", "Cambias UN dato y se recalcula toda la cadena. Nunca escribas dos veces lo mismo."),
    ("T", "INSUMOS  ->  RECETAS", "", "Eliges el insumo de una LISTA. Trae solo su costo por ml/g/unidad."),
    ("T", "RECETAS  ->  PRODUCTOS", "", "Suma todas las lineas de la receta = costo del producto."),
    ("T", "PRODUCTOS  ->  COMBOS", "", "Eliges los items del combo de una LISTA. Trae precio y costo de cada uno."),
    ("T", "COMBOS  ->  PRODUCTOS", "", "El combo vuelve como un producto mas, para poder venderlo en VENTAS."),
    ("T", "PRODUCTOS  ->  VENTAS", "", "Eliges el producto de una LISTA. Trae precio Y costo. Tu solo pones la cantidad."),
    ("T", "VENTAS  ->  CAJA / DASHBOARD / PYG / EQUILIBRIO", "", "Todo el analisis sale de aqui. Por eso registrar ventas no es opcional."),
    ("T", "VENTAS + RECETAS  ->  INVENTARIO", "", "Calcula solo cuanto insumo consumiste segun lo que vendiste."),
    ("T", "GASTOS  ->  CAJA / DASHBOARD / PYG", "", "Los gastos reales bajan tu utilidad en todos los reportes."),
    ("T", "GASTOS_FIJOS  ->  EQUILIBRIO / PROYECCIONES", "", "Tu plan de fijos. Define cuantos vasos al dia necesitas vender."),
    ("T", "INSUMOS  ->  FICHAS_TECNICAS", "", "El costo impreso en la ficha se actualiza solo si sube un precio."),
    ("", "", "", ""),
    ("S", "SI ALGO NO TE APARECE EN UN DESPLEGABLE", "", ""),
    ("T", "Producto que no sale en VENTAS", "", "Agregalo primero en PRODUCTOS (columna B). Aparece al instante en la lista."),
    ("T", "Insumo que no sale en RECETAS", "", "Agregalo primero en INSUMOS (columna B)."),
    ("T", "Regla general", "", "Las listas se alimentan solas. Si falta algo, es porque no lo creaste en su hoja maestra."),
]
r = 4
param_rows = {}
for kind, b, c, d in rows:
    if kind == "S":
        ws.cell(row=r, column=2, value=b).font = Font(name=F, size=11, bold=True, color="1F3864")
        for cc in range(2, 5):
            ws.cell(row=r, column=cc).fill = SECT_FILL
        ws.cell(row=r, column=4, value=d).font = Font(name=F, size=9, italic=True, color="1F3864")
    elif kind == "P":
        ws.cell(row=r, column=2, value=b).font = Font(name=F, size=10)
        cell = ws.cell(row=r, column=3, value=c)
        cell.font = Font(name=F, size=10, bold=True, color=BLUE)
        cell.fill = YELLOW; cell.border = BOX
        cell.alignment = Alignment(horizontal="center")
        if isinstance(c, float): cell.number_format = PCT
        param_rows[b] = r
        ws.cell(row=r, column=4, value=d).font = Font(name=F, size=9, color="595959")
    elif kind == "T":
        ws.cell(row=r, column=2, value=b).font = Font(name=F, size=10, bold=True)
        ws.cell(row=r, column=4, value=d).font = Font(name=F, size=10)
    r += 1

dv = DataValidation(type="list", formula1='"SI,NO"', allow_blank=False)
ws.add_data_validation(dv); dv.add("C6")
dvm = DataValidation(type="list", formula1="=PYG!$A$5:$A$16", allow_blank=False)
dvm.error = "Elige un mes de la lista (los mismos que tiene la hoja PYG)."
dvm.errorTitle = "Mes no valido"
ws.add_data_validation(dvm); dvm.add("C8")

# =====================================================================
# 2. INSUMOS
# =====================================================================
ws = wb.create_sheet("INSUMOS")
title(ws, "INSUMOS", "Todo lo que compras. Cambia un precio aqui y se recalculan TODOS los costos, margenes y precios sugeridos.", 11)
headers(ws, 4,
    ["ID", "Insumo", "Categoria", "Unidad de compra", "Precio de compra",
     "Contenido (en unidad base)", "Unidad base", "IVA compra %", "COSTO POR UNIDAD BASE",
     "Proveedor", "Notas"],
    [6, 30, 16, 20, 14, 16, 12, 11, 17, 18, 34])

insumos = [
    ("Jarabe Coco", "Jarabe", "Galon", 10.00, 3785, "ml", 0.15, "Proveedor local", "Dilucion 1:3 · rinde ~60 vasos"),
    ("Jarabe Frutos Rojos", "Jarabe", "Galon", 10.00, 3785, "ml", 0.15, "Proveedor local", "Dilucion 1:3"),
    ("Jarabe Maracuya", "Jarabe", "Galon", 10.00, 3785, "ml", 0.15, "Proveedor local", "Dilucion 1:3"),
    ("Jarabe Naranja", "Jarabe", "Galon", 10.00, 3785, "ml", 0.15, "Proveedor local", "Dilucion 1:3"),
    ("Agua purificada", "Base", "Botellon 20L", 2.00, 20000, "ml", 0.00, "", "Para dilucion de jarabes"),
    ("Energia maquina granizadora", "Base", "Por vaso", 0.02, 1, "vaso", 0.00, "", "ESTIMADO. Ajustar con planilla de luz real"),
    ("Hielo en cubos", "Base", "Bolsa 5 lb", 0.75, 2268, "g", 0.00, "", "PENDIENTE confirmar proveedor en Machala"),
    ("Leche entera", "Lacteos", "Litro", 1.10, 1000, "ml", 0.00, "", ""),
    ("Leche condensada", "Lacteos", "Lata 395g", 1.60, 395, "ml", 0.15, "", ""),
    ("Crema de leche", "Lacteos", "Tetra 250ml", 1.40, 250, "ml", 0.15, "", "Opcional en Oreo"),
    ("Galleta Oreo", "Insumo especial", "Paquete 36 u", 3.20, 36, "unidad", 0.15, "", ""),
    ("Nutella", "Insumo especial", "Frasco 350g", 5.60, 350, "g", 0.15, "", "PENDIENTE precio al por mayor"),
    ("Cafe soluble", "Insumo especial", "Frasco 170g", 4.50, 170, "g", 0.15, "", ""),
    ("Azucar", "Insumo especial", "Funda 2 kg", 2.20, 2000, "g", 0.00, "", ""),
    ("Vodka / Aguardiente", "Alcohol", "Botella 750ml", 8.00, 750, "ml", 0.15, "", "Porcion estandar 30ml"),
    ("Papa", "Comida", "Quintal / 10 lb", 5.00, 4536, "g", 0.00, "", "~200g por cono"),
    ("Aceite de freir", "Comida", "Botella 1 L", 2.20, 1000, "ml", 0.15, "", "Absorcion estimada por cono"),
    ("Sal y condimentos", "Comida", "Funda 500g", 0.80, 500, "g", 0.00, "", ""),
    ("Salsa porcion (sachet)", "Comida", "Caja 100 u", 6.00, 100, "unidad", 0.15, "", ""),
    ("Vaso 12 oz", "Descartable", "Paquete 50 u", 3.50, 50, "unidad", 0.15, "", ""),
    ("Tapa domo 12 oz", "Descartable", "Paquete 50 u", 1.50, 50, "unidad", 0.15, "", ""),
    ("Pitillo", "Descartable", "Paquete 100 u", 1.00, 100, "unidad", 0.15, "", ""),
    ("Servilleta", "Descartable", "Paquete 500 u", 1.50, 500, "unidad", 0.15, "", ""),
    ("Cono de papel", "Descartable", "Paquete 100 u", 4.00, 100, "unidad", 0.15, "", ""),
    ("Funda de despacho", "Descartable", "Paquete 100 u", 2.00, 100, "unidad", 0.15, "", ""),
]
for i, (nom, cat, uc, pc, cont, ub, iva, prov, nota) in enumerate(insumos):
    r = IN_R1 + i
    ws.cell(row=r, column=1, value=i + 1)
    ws.cell(row=r, column=2, value=nom)
    ws.cell(row=r, column=3, value=cat)
    ws.cell(row=r, column=4, value=uc)
    ws.cell(row=r, column=5, value=pc)
    ws.cell(row=r, column=6, value=cont)
    ws.cell(row=r, column=7, value=ub)
    ws.cell(row=r, column=8, value=iva)
    ws.cell(row=r, column=10, value=prov)
    ws.cell(row=r, column=11, value=nota)

for r in range(IN_R1, IN_R2 + 1):
    ws.cell(row=r, column=9,
        value=f'=IFERROR(IF($B{r}="","",IF({P_REC}="SI",$E{r}/(1+$H{r}),$E{r})/$F{r}),"")')

style_range(ws, IN_R1, IN_R2, 1, 8, color=BLUE, fill=YELLOW)
style_range(ws, IN_R1, IN_R2, 9, 9, fmt=MON4, color=BLACK, fill=GREY)
style_range(ws, IN_R1, IN_R2, 10, 11, color=BLUE, fill=YELLOW)
for r in range(IN_R1, IN_R2 + 1):
    ws.cell(row=r, column=1).number_format = INT
    ws.cell(row=r, column=5).number_format = MON
    ws.cell(row=r, column=6).number_format = NUM
    ws.cell(row=r, column=8).number_format = PCT
    ws.cell(row=r, column=9).font = Font(name=F, size=10, bold=True)

for col, opts in (("C", '"Jarabe,Base,Lacteos,Insumo especial,Alcohol,Comida,Descartable,Otro"'),
                  ("G", '"ml,g,unidad,vaso,porcion"')):
    d = DataValidation(type="list", formula1=opts, allow_blank=True)
    ws.add_data_validation(d); d.add(f"{col}{IN_R1}:{col}{IN_R2}")

ws.cell(row=IN_R2 + 2, column=2, value="NOTA: 'Contenido' = cuantas unidades base trae lo que compras. Ej: un galon de jarabe = 3785 ml.").font = SUB_FONT
ws.cell(row=IN_R2 + 3, column=2, value="Precios cargados desde finanzas/analisis-costos.md (2026-05-29). Los marcados PENDIENTE hay que confirmarlos en Machala.").font = SUB_FONT

INSUMO_RANGE = f"INSUMOS!$B${IN_R1}:$B${IN_R2}"
INSUMO_COST = f"INSUMOS!$I${IN_R1}:$I${IN_R2}"
INSUMO_UNIT = f"INSUMOS!$G${IN_R1}:$G${IN_R2}"

# =====================================================================
# 3. RECETAS
# =====================================================================
ws = wb.create_sheet("RECETAS")
title(ws, "RECETAS", "Una fila por cada ingrediente de cada producto. El costo se jala solo desde INSUMOS.", 8)
headers(ws, 4,
    ["#", "Producto", "Insumo", "Cantidad", "Unidad", "Costo unitario", "COSTO LINEA",
     "Notas de preparacion", "Uds. vendidas del producto (mes DASHBOARD)", "Consumo del insumo en el mes"],
    [6, 30, 30, 11, 10, 14, 14, 40, 16, 16])

recetas_base = {
    "Coco s/alcohol":        [("Jarabe Coco", 63, "63ml jarabe + 190ml agua"), ("Agua purificada", 190, ""), ("Energia maquina granizadora", 1, ""), ("Vaso 12 oz", 1, ""), ("Tapa domo 12 oz", 1, ""), ("Pitillo", 1, ""), ("Servilleta", 1, "")],
    "Frutos Rojos s/alcohol":[("Jarabe Frutos Rojos", 63, ""), ("Agua purificada", 190, ""), ("Energia maquina granizadora", 1, ""), ("Vaso 12 oz", 1, ""), ("Tapa domo 12 oz", 1, ""), ("Pitillo", 1, ""), ("Servilleta", 1, "")],
    "Maracuya s/alcohol":    [("Jarabe Maracuya", 63, ""), ("Agua purificada", 190, ""), ("Energia maquina granizadora", 1, ""), ("Vaso 12 oz", 1, ""), ("Tapa domo 12 oz", 1, ""), ("Pitillo", 1, ""), ("Servilleta", 1, "")],
    "Naranja s/alcohol":     [("Jarabe Naranja", 63, ""), ("Agua purificada", 190, ""), ("Energia maquina granizadora", 1, ""), ("Vaso 12 oz", 1, ""), ("Tapa domo 12 oz", 1, ""), ("Pitillo", 1, ""), ("Servilleta", 1, "")],
    "Oreo s/alcohol":        [("Galleta Oreo", 4, "3 licuadas + 1 para decorar"), ("Leche entera", 100, ""), ("Hielo en cubos", 150, "~10 cubos"), ("Crema de leche", 20, "opcional"), ("Vaso 12 oz", 1, ""), ("Tapa domo 12 oz", 1, ""), ("Pitillo", 1, ""), ("Servilleta", 1, "")],
    "Nutella s/alcohol":     [("Nutella", 30, "2 cucharadas soperas"), ("Leche entera", 120, ""), ("Hielo en cubos", 150, ""), ("Vaso 12 oz", 1, ""), ("Tapa domo 12 oz", 1, ""), ("Pitillo", 1, ""), ("Servilleta", 1, "")],
    "Cafe s/alcohol":        [("Cafe soluble", 4, "2 cucharaditas, disolver primero"), ("Leche condensada", 20, ""), ("Leche entera", 80, ""), ("Hielo en cubos", 160, ""), ("Vaso 12 oz", 1, ""), ("Tapa domo 12 oz", 1, ""), ("Pitillo", 1, ""), ("Servilleta", 1, "")],
    "Papas en cono natural": [("Papa", 200, ""), ("Aceite de freir", 35, "absorcion estimada"), ("Sal y condimentos", 2, ""), ("Cono de papel", 1, ""), ("Servilleta", 2, "")],
    "Papas en cono + salsa": [("Papa", 200, ""), ("Aceite de freir", 35, ""), ("Sal y condimentos", 2, ""), ("Cono de papel", 1, ""), ("Servilleta", 2, ""), ("Salsa porcion (sachet)", 1, "")],
}
maquina = ["Coco", "Frutos Rojos", "Maracuya", "Naranja"]
especiales = ["Oreo", "Nutella", "Cafe"]

filas = []
n = 0
for prod, items in recetas_base.items():
    for ins, cant, nota in items:
        n += 1
        filas.append((n, prod, ins, cant, nota))
# versiones con alcohol
for base in maquina + especiales:
    src = f"{base} s/alcohol"
    dst = f"{base} c/alcohol"
    for ins, cant, nota in recetas_base[src]:
        n += 1
        filas.append((n, dst, ins, cant, nota))
    n += 1
    filas.append((n, dst, "Vodka / Aguardiente", 30, "Porcion estandar 30ml"))

for idx, (num, prod, ins, cant, nota) in enumerate(filas):
    r = RE_R1 + idx
    ws.cell(row=r, column=1, value=num)
    ws.cell(row=r, column=2, value=prod)
    ws.cell(row=r, column=3, value=ins)
    ws.cell(row=r, column=4, value=cant)
    ws.cell(row=r, column=8, value=nota)

for r in range(RE_R1, RE_R2 + 1):
    ws.cell(row=r, column=5, value=f'=IFERROR(IF($C{r}="","",INDEX({INSUMO_UNIT},MATCH($C{r},{INSUMO_RANGE},0))),"")')
    ws.cell(row=r, column=6, value=f'=IFERROR(IF($C{r}="","",INDEX({INSUMO_COST},MATCH($C{r},{INSUMO_RANGE},0))),"")')
    ws.cell(row=r, column=7, value=f'=IFERROR(IF($C{r}="","",$D{r}*$F{r}),"")')
    ws.cell(row=r, column=9, value=f'=IF($B{r}="","",SUMIFS({VE_CANT},{VE_MES},{P_MES},{VE_PROD},$B{r}))')
    ws.cell(row=r, column=10, value=f'=IF($C{r}="","",$D{r}*$I{r})')

style_range(ws, RE_R1, RE_R2, 1, 4, color=BLUE, fill=YELLOW)
style_range(ws, RE_R1, RE_R2, 5, 6, color=GREEN, fill=GREY)
style_range(ws, RE_R1, RE_R2, 7, 7, fmt=MON, color=BLACK, fill=GREY)
style_range(ws, RE_R1, RE_R2, 8, 8, color=BLUE, fill=YELLOW)
style_range(ws, RE_R1, RE_R2, 9, 10, fmt=NUM, fill=GREY, align="center")
for r in range(RE_R1, RE_R2 + 1):
    ws.cell(row=r, column=1).number_format = INT
    ws.cell(row=r, column=4).number_format = NUM
    ws.cell(row=r, column=6).number_format = MON4
    ws.cell(row=r, column=7).font = Font(name=F, size=10, bold=True)

dv = DataValidation(type="list", formula1=f"={INSUMO_RANGE}", allow_blank=True)
dv.error = "Ese insumo no existe. Agregalo primero en la hoja INSUMOS."
dv.errorTitle = "Insumo no valido"
ws.add_data_validation(dv); dv.add(f"C{RE_R1}:C{RE_R2}")
dvp = DataValidation(type="list", formula1=f"={PROD_NAME}", allow_blank=True)
dvp.error = "Ese producto no existe. Creálo primero en la hoja PRODUCTOS."
dvp.errorTitle = "Producto no valido"
ws.add_data_validation(dvp); dvp.add(f"B{RE_R1}:B{RE_R2}")

RE_PROD = f"RECETAS!$B${RE_R1}:$B${RE_R2}"
RE_COST = f"RECETAS!$G${RE_R1}:$G${RE_R2}"
RE_INS = f"RECETAS!$C${RE_R1}:$C${RE_R2}"
RE_CANT = f"RECETAS!$D${RE_R1}:$D${RE_R2}"
RE_CONS = f"RECETAS!$J${RE_R1}:$J${RE_R2}"

# =====================================================================
# 4. COMBOS  (antes que PRODUCTOS por dependencia de lectura, pero se crea aqui)
# =====================================================================
ws = wb.create_sheet("COMBOS")
title(ws, "COMBOS", "Arma el combo, mira cuanto margen sacrificas ANTES de lanzarlo. Los combos aparecen tambien en PRODUCTOS para poder venderlos.", 13)
headers(ws, 4,
    ["ID", "Nombre del combo", "Item 1", "Cant 1", "Item 2", "Cant 2", "Item 3", "Cant 3",
     "Precio suelto (c/IVA)", "PVP combo (c/IVA)", "COSTO COMBO", "Descuento que das", "Margen combo"],
    [6, 26, 24, 8, 24, 8, 24, 8, 15, 15, 14, 14, 12])

combos = [
    ("Combo Pareja", "Coco c/alcohol", 2, "Papas en cono natural", 1, "", 0, 5.00),
    ("Combo Amigos (4 granizados)", "Coco s/alcohol", 4, "", 0, "", 0, 5.00),
    ("Combo Premium", "Oreo s/alcohol", 2, "Papas en cono + salsa", 1, "", 0, 7.50),
    ("Combo Solo", "Maracuya s/alcohol", 1, "Papas en cono natural", 1, "", 0, 2.50),
]
for i, (nom, i1, c1, i2, c2, i3, c3, pvp) in enumerate(combos):
    r = CO_R1 + i
    ws.cell(row=r, column=1, value=i + 1)
    ws.cell(row=r, column=2, value=nom)
    ws.cell(row=r, column=3, value=i1); ws.cell(row=r, column=4, value=c1)
    ws.cell(row=r, column=5, value=i2 or None); ws.cell(row=r, column=6, value=c2 or None)
    ws.cell(row=r, column=7, value=i3 or None); ws.cell(row=r, column=8, value=c3 or None)
    ws.cell(row=r, column=10, value=pvp)


for r in range(CO_R1, CO_R2 + 1):
    suelto = "+".join(
        f'IFERROR(INDEX({PROD_PVP},MATCH(${col}{r},{PROD_NAME},0))*N(${cant}{r}),0)'
        for col, cant in (("C", "D"), ("E", "F"), ("G", "H")))
    ws.cell(row=r, column=9, value=f'=IF($B{r}="","",{suelto})')
    costo = "+".join(
        f'IFERROR(SUMIFS({RE_COST},{RE_PROD},${col}{r})*N(${cant}{r}),0)'
        for col, cant in (("C", "D"), ("E", "F"), ("G", "H")))
    ws.cell(row=r, column=11, value=f'=IF($B{r}="","",{costo})')
    ws.cell(row=r, column=12, value=f'=IFERROR(IF($B{r}="","",($I{r}-$J{r})/$I{r}),"")')
    ws.cell(row=r, column=13, value=f'=IFERROR(IF($B{r}="","",($J{r}/(1+{P_IVA})-$K{r})/($J{r}/(1+{P_IVA}))),"")')

style_range(ws, CO_R1, CO_R2, 1, 8, color=BLUE, fill=YELLOW)
style_range(ws, CO_R1, CO_R2, 9, 9, fmt=MON, color=GREEN, fill=GREY)
style_range(ws, CO_R1, CO_R2, 10, 10, fmt=MON, color=BLUE, fill=YELLOW)
style_range(ws, CO_R1, CO_R2, 11, 11, fmt=MON, fill=GREY)
style_range(ws, CO_R1, CO_R2, 12, 13, fmt=PCT, fill=GREY)
for c in (4, 6, 8):
    for r in range(CO_R1, CO_R2 + 1):
        ws.cell(row=r, column=c).number_format = INT

for col in ("C", "E", "G"):
    d = DataValidation(type="list", formula1=f"={PROD_NAME}", allow_blank=True)
    ws.add_data_validation(d); d.add(f"{col}{CO_R1}:{col}{CO_R2}")

ws.conditional_formatting.add(f"M{CO_R1}:M{CO_R2}",
    CellIsRule(operator="lessThan", formula=["0.55"], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006")))
ws.conditional_formatting.add(f"M{CO_R1}:M{CO_R2}",
    CellIsRule(operator="greaterThanOrEqual", formula=["0.65"], fill=PatternFill("solid", fgColor="C6EFCE"), font=Font(color="006100")))

ws.cell(row=CO_R2 + 3, column=2, value="Regla: si el margen del combo baja de 55%, no lo lances. Estas regalando plata para vender lo mismo.").font = SUB_FONT

CO_NAME = f"COMBOS!$B${CO_R1}:$B${CO_R2}"
CO_COST = f"COMBOS!$K${CO_R1}:$K${CO_R2}"

# =====================================================================
# 5. PRODUCTOS
# =====================================================================
ws = wb.create_sheet("PRODUCTOS")
title(ws, "PRODUCTOS Y PRECIOS", "Precios de carta CON IVA incluido. El sistema descuenta el IVA para mostrarte tu utilidad REAL.", 12)
headers(ws, 4,
    ["ID", "Producto", "Categoria", "COSTO", "PVP c/IVA", "IVA %", "Ingreso neto (sin IVA)",
     "UTILIDAD", "MARGEN", "Margen objetivo", "PVP sugerido c/IVA", "ESTADO"],
    [6, 26, 20, 12, 12, 8, 14, 12, 10, 12, 15, 16])

productos = []
for s in maquina:
    productos.append((f"{s} s/alcohol", "Granizado maquina", 1.50))
for s in maquina:
    productos.append((f"{s} c/alcohol", "Granizado maquina", 2.00))
for s in especiales:
    productos.append((f"{s} s/alcohol", "Granizado especial", 3.00))
for s in especiales:
    productos.append((f"{s} c/alcohol", "Granizado especial", 3.50))
productos.append(("Papas en cono natural", "Comida", 1.50))
productos.append(("Papas en cono + salsa", "Comida", 2.00))
for nom, _, _, _, _, _, _, pvp in combos:
    productos.append((nom, "Combo", pvp))

for i, (nom, cat, pvp) in enumerate(productos):
    r = PR_R1 + i
    ws.cell(row=r, column=1, value=i + 1)
    ws.cell(row=r, column=2, value=nom)
    ws.cell(row=r, column=3, value=cat)
    ws.cell(row=r, column=5, value=pvp)

for r in range(PR_R1, PR_R2 + 1):
    ws.cell(row=r, column=4,
        value=f'=IF($B{r}="","",SUMIFS({RE_COST},{RE_PROD},$B{r})+IFERROR(INDEX({CO_COST},MATCH($B{r},{CO_NAME},0)),0))')
    ws.cell(row=r, column=6, value=f'=IF($B{r}="","",{P_IVA})')
    ws.cell(row=r, column=7, value=f'=IFERROR(IF($B{r}="","",$E{r}/(1+$F{r})),"")')
    ws.cell(row=r, column=8, value=f'=IFERROR(IF($B{r}="","",$G{r}-$D{r}),"")')
    ws.cell(row=r, column=9, value=f'=IFERROR(IF($B{r}="","",$H{r}/$G{r}),"")')
    ws.cell(row=r, column=10, value=f'=IF($B{r}="","",{P_MARG})')
    ws.cell(row=r, column=11, value=f'=IFERROR(IF($B{r}="","",$D{r}/(1-$J{r})*(1+$F{r})),"")')
    ws.cell(row=r, column=12,
        value=f'=IF($B{r}="","",IF($I{r}<0,"PIERDE PLATA",IF($I{r}<0.5,"MARGEN BAJO",IF($I{r}<0.65,"ACEPTABLE","EXCELENTE"))))')

style_range(ws, PR_R1, PR_R2, 1, 3, color=BLUE, fill=YELLOW)
style_range(ws, PR_R1, PR_R2, 4, 4, fmt=MON, fill=GREY)
style_range(ws, PR_R1, PR_R2, 5, 5, fmt=MON, color=BLUE, fill=YELLOW)
style_range(ws, PR_R1, PR_R2, 6, 6, fmt=PCT, color=GREEN, fill=GREY)
style_range(ws, PR_R1, PR_R2, 7, 8, fmt=MON, fill=GREY)
style_range(ws, PR_R1, PR_R2, 9, 9, fmt=PCT, fill=GREY)
style_range(ws, PR_R1, PR_R2, 10, 10, fmt=PCT, color=GREEN, fill=GREY)
style_range(ws, PR_R1, PR_R2, 11, 11, fmt=MON, fill=GREY)
style_range(ws, PR_R1, PR_R2, 12, 12, fill=GREY, align="center")
for r in range(PR_R1, PR_R2 + 1):
    ws.cell(row=r, column=1).number_format = INT
    for c in (8, 9, 12):
        ws.cell(row=r, column=c).font = Font(name=F, size=10, bold=True)

for txt, fillc, fontc in (("PIERDE PLATA", "FFC7CE", "9C0006"), ("MARGEN BAJO", "FFC7CE", "9C0006"),
                          ("ACEPTABLE", "FFEB9C", "9C6500"), ("EXCELENTE", "C6EFCE", "006100")):
    ws.conditional_formatting.add(f"L{PR_R1}:L{PR_R2}",
        FormulaRule(formula=[f'EXACT($L{PR_R1},"{txt}")'],
                    fill=PatternFill("solid", fgColor=fillc), font=Font(color=fontc, bold=True)))

dcat = DataValidation(type="list",
    formula1='"Granizado maquina,Granizado especial,Comida,Combo,Bebida,Otro"', allow_blank=True)
ws.add_data_validation(dcat); dcat.add(f"C{PR_R1}:C{PR_R2}")

ws.cell(row=PR_R2 + 2, column=2, value="OJO: con IVA 15%, un granizado de $1.50 te deja $1.30 de ingreso real. El PVP sugerido ya viene con IVA para que lo pongas tal cual en la carta.").font = SUB_FONT

PROD_COST = f"PRODUCTOS!$D${PR_R1}:$D${PR_R2}"

# =====================================================================
# 6. VENTAS
# =====================================================================
ws = wb.create_sheet("VENTAS")
title(ws, "VENTAS", "Una fila por venta. Solo llenas: Fecha · Producto · Cantidad · Forma de pago · Atendio. El resto se calcula solo.", 12)
headers(ws, 4,
    ["Fecha", "Mes", "Producto", "Cant.", "PVP unit c/IVA", "TOTAL c/IVA", "IVA cobrado",
     "Ingreso neto", "Costo", "UTILIDAD", "Forma de pago", "Atendio"],
    [12, 10, 26, 7, 13, 13, 12, 12, 11, 12, 16, 14])

for r in range(VE_R1, VE_R2 + 1):
    ws.cell(row=r, column=2, value=f'=IF($A{r}="","",TEXT($A{r},"YYYY-MM"))')
    ws.cell(row=r, column=5, value=f'=IFERROR(IF($C{r}="","",INDEX({PROD_PVP},MATCH($C{r},{PROD_NAME},0))),"")')
    ws.cell(row=r, column=6, value=f'=IFERROR(IF($C{r}="","",$D{r}*$E{r}),"")')
    ws.cell(row=r, column=7, value=f'=IFERROR(IF($C{r}="","",$F{r}-$H{r}),"")')
    ws.cell(row=r, column=8, value=f'=IFERROR(IF($C{r}="","",$F{r}/(1+{P_IVA})),"")')
    ws.cell(row=r, column=9, value=f'=IFERROR(IF($C{r}="","",$D{r}*INDEX({PROD_COST},MATCH($C{r},{PROD_NAME},0))),"")')
    ws.cell(row=r, column=10, value=f'=IFERROR(IF($C{r}="","",$H{r}-$I{r}),"")')

ws.cell(row=VE_R1, column=1, value=datetime.date(2026, 9, 15))
ws.cell(row=VE_R1, column=3, value="Coco s/alcohol")
ws.cell(row=VE_R1, column=4, value=2)
ws.cell(row=VE_R1, column=11, value="Efectivo")
ws.cell(row=VE_R1, column=12, value="Fabian")

style_range(ws, VE_R1, VE_R2, 1, 1, fmt=DATE, color=BLUE, fill=YELLOW)
style_range(ws, VE_R1, VE_R2, 2, 2, fill=GREY, align="center")
style_range(ws, VE_R1, VE_R2, 3, 4, color=BLUE, fill=YELLOW)
style_range(ws, VE_R1, VE_R2, 5, 10, fmt=MON, fill=GREY)
style_range(ws, VE_R1, VE_R2, 11, 12, color=BLUE, fill=YELLOW)
for r in range(VE_R1, VE_R2 + 1):
    ws.cell(row=r, column=4).number_format = INT
    ws.cell(row=r, column=10).font = Font(name=F, size=10, bold=True)

d = DataValidation(type="list", formula1=f"={PROD_NAME}", allow_blank=True)
d.error = "Ese producto no existe. Agregalo en la hoja PRODUCTOS."
d.errorTitle = "Producto no valido"
ws.add_data_validation(d); d.add(f"C{VE_R1}:C{VE_R2}")
d2 = DataValidation(type="list", formula1='"Efectivo,Transferencia,PayPhone,Tarjeta"', allow_blank=True)
ws.add_data_validation(d2); d2.add(f"K{VE_R1}:K{VE_R2}")
d3 = DataValidation(type="list", formula1='"Fabian,Nerea,Empleado"', allow_blank=True)
ws.add_data_validation(d3); d3.add(f"L{VE_R1}:L{VE_R2}")

VE_MES = f"VENTAS!$B${VE_R1}:$B${VE_R2}"
VE_FEC = f"VENTAS!$A${VE_R1}:$A${VE_R2}"
VE_PROD = f"VENTAS!$C${VE_R1}:$C${VE_R2}"
VE_CANT = f"VENTAS!$D${VE_R1}:$D${VE_R2}"
VE_TOT = f"VENTAS!$F${VE_R1}:$F${VE_R2}"
VE_IVA = f"VENTAS!$G${VE_R1}:$G${VE_R2}"
VE_NETO = f"VENTAS!$H${VE_R1}:$H${VE_R2}"
VE_COSTO = f"VENTAS!$I${VE_R1}:$I${VE_R2}"
VE_UTIL = f"VENTAS!$J${VE_R1}:$J${VE_R2}"
VE_PAGO = f"VENTAS!$K${VE_R1}:$K${VE_R2}"

# =====================================================================
# 7. GASTOS
# =====================================================================
ws = wb.create_sheet("GASTOS")
title(ws, "GASTOS", "Todo lo que sale del negocio. Si no lo registras, tu utilidad es mentira.", 8)
headers(ws, 4,
    ["Fecha", "Mes", "Categoria", "Detalle / Proveedor", "Monto", "Tipo", "Forma de pago", "¿Sale de caja?"],
    [12, 10, 22, 34, 12, 14, 16, 14])

for r in range(GA_R1, GA_R2 + 1):
    ws.cell(row=r, column=2, value=f'=IF($A{r}="","",TEXT($A{r},"YYYY-MM"))')

ws.cell(row=GA_R1, column=1, value=datetime.date(2026, 9, 15))
ws.cell(row=GA_R1, column=3, value="Insumos")
ws.cell(row=GA_R1, column=4, value="Compra de jarabes - proveedor local")
ws.cell(row=GA_R1, column=5, value=40.00)
ws.cell(row=GA_R1, column=6, value="Variable")
ws.cell(row=GA_R1, column=7, value="Efectivo")
ws.cell(row=GA_R1, column=8, value="SI")

style_range(ws, GA_R1, GA_R2, 1, 1, fmt=DATE, color=BLUE, fill=YELLOW)
style_range(ws, GA_R1, GA_R2, 2, 2, fill=GREY, align="center")
style_range(ws, GA_R1, GA_R2, 3, 4, color=BLUE, fill=YELLOW)
style_range(ws, GA_R1, GA_R2, 5, 5, fmt=MON, color=BLUE, fill=YELLOW)
style_range(ws, GA_R1, GA_R2, 6, 8, color=BLUE, fill=YELLOW)

for col, opts in (("C", '"Insumos,Descartables,Arriendo,Servicios basicos,Internet,Sueldos,Publicidad,Mantenimiento,Impuestos,Transporte,Otros"'),
                  ("F", '"Fijo,Variable"'),
                  ("G", '"Efectivo,Transferencia,PayPhone,Tarjeta"'),
                  ("H", '"SI,NO"')):
    d = DataValidation(type="list", formula1=opts, allow_blank=True)
    ws.add_data_validation(d); d.add(f"{col}{GA_R1}:{col}{GA_R2}")

GA_MES = f"GASTOS!$B${GA_R1}:$B${GA_R2}"
GA_FEC = f"GASTOS!$A${GA_R1}:$A${GA_R2}"
GA_CAT = f"GASTOS!$C${GA_R1}:$C${GA_R2}"
GA_MON = f"GASTOS!$E${GA_R1}:$E${GA_R2}"
GA_TIPO = f"GASTOS!$F${GA_R1}:$F${GA_R2}"
GA_PAGO = f"GASTOS!$G${GA_R1}:$G${GA_R2}"
GA_CAJA = f"GASTOS!$H${GA_R1}:$H${GA_R2}"

# =====================================================================
# 8. CAJA
# =====================================================================
ws = wb.create_sheet("CAJA")
title(ws, "CIERRE DE CAJA DIARIO", "Al cerrar: pon el fondo con el que abriste y cuenta el efectivo real. El descuadre te dice si algo se fue.", 10)
headers(ws, 4,
    ["Fecha", "Fondo apertura", "Ventas EFECTIVO", "Ventas TRANSFERENCIA", "Ventas PAYPHONE/Tarjeta",
     "Gastos en efectivo", "Retiros", "EFECTIVO TEORICO", "Efectivo contado", "DESCUADRE"],
    [12, 13, 14, 15, 16, 14, 11, 15, 14, 13])

for r in range(CA_R1, CA_R2 + 1):
    ws.cell(row=r, column=3, value=f'=IF($A{r}="","",SUMIFS({VE_TOT},{VE_FEC},$A{r},{VE_PAGO},"Efectivo"))')
    ws.cell(row=r, column=4, value=f'=IF($A{r}="","",SUMIFS({VE_TOT},{VE_FEC},$A{r},{VE_PAGO},"Transferencia"))')
    ws.cell(row=r, column=5, value=f'=IF($A{r}="","",SUMIFS({VE_TOT},{VE_FEC},$A{r},{VE_PAGO},"PayPhone")+SUMIFS({VE_TOT},{VE_FEC},$A{r},{VE_PAGO},"Tarjeta"))')
    ws.cell(row=r, column=6, value=f'=IF($A{r}="","",SUMIFS({GA_MON},{GA_FEC},$A{r},{GA_PAGO},"Efectivo",{GA_CAJA},"SI"))')
    ws.cell(row=r, column=8, value=f'=IF($A{r}="","",$B{r}+$C{r}-$F{r}-N($G{r}))')
    ws.cell(row=r, column=10, value=f'=IF($A{r}="","",IF($I{r}="","",$I{r}-$H{r}))')

ws.cell(row=CA_R1, column=1, value=datetime.date(2026, 9, 15))
ws.cell(row=CA_R1, column=2, value=20.00)

style_range(ws, CA_R1, CA_R2, 1, 1, fmt=DATE, color=BLUE, fill=YELLOW)
style_range(ws, CA_R1, CA_R2, 2, 2, fmt=MON, color=BLUE, fill=YELLOW)
style_range(ws, CA_R1, CA_R2, 3, 6, fmt=MON, color=GREEN, fill=GREY)
style_range(ws, CA_R1, CA_R2, 7, 7, fmt=MON, color=BLUE, fill=YELLOW)
style_range(ws, CA_R1, CA_R2, 8, 8, fmt=MON, fill=GREY)
style_range(ws, CA_R1, CA_R2, 9, 9, fmt=MON, color=BLUE, fill=YELLOW)
style_range(ws, CA_R1, CA_R2, 10, 10, fmt=MON, fill=GREY)
for r in range(CA_R1, CA_R2 + 1):
    ws.cell(row=r, column=10).font = Font(name=F, size=10, bold=True)

ws.conditional_formatting.add(f"J{CA_R1}:J{CA_R2}",
    CellIsRule(operator="lessThan", formula=["-0.5"], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006", bold=True)))
ws.conditional_formatting.add(f"J{CA_R1}:J{CA_R2}",
    CellIsRule(operator="greaterThan", formula=["0.5"], fill=PatternFill("solid", fgColor="FFEB9C"), font=Font(color="9C6500", bold=True)))

ws.cell(row=CA_R2 + 2, column=2, value="Descuadre negativo = falta plata. Positivo = sobra (mal cobrado o venta no registrada). Ambos son problema.").font = SUB_FONT

# =====================================================================
# 9. GASTOS_FIJOS
# =====================================================================
ws = wb.create_sheet("GASTOS_FIJOS")
title(ws, "GASTOS FIJOS MENSUALES", "Lo que pagas SI O SI cada mes, vendas o no vendas. Alimenta el punto de equilibrio.", 5)
headers(ws, 4, ["#", "Concepto", "Monto mensual", "¿Activo?", "Notas"], [6, 32, 15, 11, 46])

fijos = [
    ("Arriendo del local", 300.00, "SI", "Estimado analisis-costos.md"),
    ("Luz + agua", 80.00, "SI", "Sube con la maquina granizadora encendida todo el dia"),
    ("Internet / camara", 30.00, "SI", ""),
    ("Publicidad (Instagram/TikTok)", 50.00, "SI", ""),
    ("Descartables base (colchon mensual)", 60.00, "SI", "Si ya los cargas en RECETAS, ponlo en NO para no duplicar"),
    ("Sueldo empleado 1", 460.00, "NO", "Salario basico Ecuador. Poner SI cuando contrates"),
    ("Sueldo empleado 2 (cocina)", 460.00, "NO", "Cuando entre la linea de comida"),
    ("Contador / tramites", 30.00, "NO", ""),
    ("Mantenimiento equipos", 25.00, "NO", "Maquina granizadora y licuadora"),
]
for i, (con, mon, act, nota) in enumerate(fijos):
    r = GF_R1 + i
    ws.cell(row=r, column=1, value=i + 1)
    ws.cell(row=r, column=2, value=con)
    ws.cell(row=r, column=3, value=mon)
    ws.cell(row=r, column=4, value=act)
    ws.cell(row=r, column=5, value=nota)

style_range(ws, GF_R1, GF_R2, 1, 5, color=BLUE, fill=YELLOW)
for r in range(GF_R1, GF_R2 + 1):
    ws.cell(row=r, column=1).number_format = INT
    ws.cell(row=r, column=3).number_format = MON

d = DataValidation(type="list", formula1='"SI,NO"', allow_blank=True)
ws.add_data_validation(d); d.add(f"D{GF_R1}:D{GF_R2}")

TOT_R = GF_R2 + 2
ws.cell(row=TOT_R, column=2, value="TOTAL FIJOS ACTIVOS / MES").font = Font(name=F, size=11, bold=True, color="FFFFFF")
ws.cell(row=TOT_R, column=2).fill = HDR_FILL
ws.cell(row=TOT_R, column=3, value=f'=SUMIFS($C${GF_R1}:$C${GF_R2},$D${GF_R1}:$D${GF_R2},"SI")')
ws.cell(row=TOT_R, column=3).font = Font(name=F, size=11, bold=True, color="FFFFFF")
ws.cell(row=TOT_R, column=3).fill = HDR_FILL
ws.cell(row=TOT_R, column=3).number_format = MON
ws.cell(row=TOT_R + 1, column=2, value="Costo fijo por dia de operacion").font = Font(name=F, size=10, bold=True)
ws.cell(row=TOT_R + 1, column=3, value=f'=IFERROR($C${TOT_R}/{P_DIAS},0)')
ws.cell(row=TOT_R + 1, column=3).number_format = MON
ws.cell(row=TOT_R + 1, column=3).font = Font(name=F, size=10, bold=True)
ws.cell(row=TOT_R + 3, column=2, value="IMPORTANTE: esta hoja es tu PLAN de fijos (sirve para el punto de equilibrio y las proyecciones).").font = SUB_FONT
ws.cell(row=TOT_R + 4, column=2, value="Cuando REALMENTE pagues el arriendo o la luz, registralo ademas en la hoja GASTOS. No es duplicar: uno es plan, el otro es real.").font = SUB_FONT

GF_TOTAL = f"GASTOS_FIJOS!$C${TOT_R}"

# =====================================================================
# 10. INVENTARIO
# =====================================================================
ws = wb.create_sheet("INVENTARIO")
title(ws, "INVENTARIO", "Consumo estimado calculado automaticamente desde las VENTAS del mes del DASHBOARD.", 8)
headers(ws, 4,
    ["Insumo", "Unidad base", "Stock inicial del mes", "Compras del mes", "Consumo estimado por ventas",
     "STOCK ACTUAL", "Punto de reorden", "ALERTA"],
    [30, 12, 16, 14, 18, 14, 14, 16])

for i, ins in enumerate(insumos):
    r = IV_R1 + i
    ws.cell(row=r, column=1, value=ins[0])
    ws.cell(row=r, column=7, value=0)

for r in range(IV_R1, IV_R2 + 1):
    ws.cell(row=r, column=2, value=f'=IFERROR(IF($A{r}="","",INDEX({INSUMO_UNIT},MATCH($A{r},{INSUMO_RANGE},0))),"")')
    ws.cell(row=r, column=5, value=f'=IF($A{r}="","",SUMIFS({RE_CONS},{RE_INS},$A{r}))')
    ws.cell(row=r, column=6, value=f'=IF($A{r}="","",N($C{r})+N($D{r})-N($E{r}))')
    ws.cell(row=r, column=8, value=f'=IF($A{r}="","",IF(AND(N($C{r})=0,N($D{r})=0),"SIN DATOS",IF($F{r}<=$G{r},"COMPRAR YA","OK")))')

style_range(ws, IV_R1, IV_R2, 1, 1, color=BLUE, fill=YELLOW)
style_range(ws, IV_R1, IV_R2, 2, 2, color=GREEN, fill=GREY, align="center")
style_range(ws, IV_R1, IV_R2, 3, 4, fmt=NUM, color=BLUE, fill=YELLOW)
style_range(ws, IV_R1, IV_R2, 5, 6, fmt=NUM, fill=GREY)
style_range(ws, IV_R1, IV_R2, 7, 7, fmt=NUM, color=BLUE, fill=YELLOW)
style_range(ws, IV_R1, IV_R2, 8, 8, fill=GREY, align="center")

ws.conditional_formatting.add(f"H{IV_R1}:H{IV_R2}",
    FormulaRule(formula=[f'EXACT($H{IV_R1},"COMPRAR YA")'],
                fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006", bold=True)))

d = DataValidation(type="list", formula1=f"={INSUMO_RANGE}", allow_blank=True)
ws.add_data_validation(d); d.add(f"A{IV_R1}:A{IV_R2}")

# =====================================================================
# 11. EQUILIBRIO
# =====================================================================
ws = wb.create_sheet("EQUILIBRIO")
title(ws, "PUNTO DE EQUILIBRIO", "Cuanto tienes que vender para no perder plata. El numero mas importante del negocio.", 4)
ws.column_dimensions["A"].width = 4
ws.column_dimensions["B"].width = 44
ws.column_dimensions["C"].width = 16
ws.column_dimensions["D"].width = 62

def sect(ws, r, txt):
    ws.cell(row=r, column=2, value=txt).font = Font(name=F, size=11, bold=True, color="1F3864")
    for c in range(2, 5):
        ws.cell(row=r, column=c).fill = SECT_FILL

def line(ws, r, label, formula, fmt=MON, note="", bold=False, color=BLACK):
    ws.cell(row=r, column=2, value=label).font = Font(name=F, size=10, bold=bold)
    c = ws.cell(row=r, column=3, value=formula)
    c.number_format = fmt; c.border = BOX; c.fill = GREY
    c.font = Font(name=F, size=11 if bold else 10, bold=bold, color=color)
    c.alignment = Alignment(horizontal="center")
    ws.cell(row=r, column=4, value=note).font = Font(name=F, size=9, color="595959")

sect(ws, 4, "DATOS DEL MES ANALIZADO (viene de VENTAS del mes en INICIO)")
line(ws, 5, "Ingreso neto del mes (sin IVA)", f'=SUMIFS({VE_NETO},{VE_MES},{P_MES})', MON, "Lo que realmente entra a tu bolsillo")
line(ws, 6, "Costo de ventas del mes", f'=SUMIFS({VE_COSTO},{VE_MES},{P_MES})', MON, "Insumos consumidos")
line(ws, 7, "Unidades vendidas", f'=SUMIFS({VE_CANT},{VE_MES},{P_MES})', INT, "")
line(ws, 8, "Ticket promedio neto por unidad", '=IFERROR($C$5/$C$7,0)', MON, "")
line(ws, 9, "Costo promedio por unidad", '=IFERROR($C$6/$C$7,0)', MON, "")
line(ws, 10, "MARGEN DE CONTRIBUCION por unidad", '=$C$8-$C$9', MON, "Lo que deja cada venta para pagar los fijos", bold=True)
line(ws, 11, "Margen de contribucion %", '=IFERROR($C$10/$C$8,0)', PCT, "")

sect(ws, 13, "COSTOS FIJOS")
line(ws, 14, "Total gastos fijos activos / mes", f'={GF_TOTAL}', MON, "Editable en la hoja GASTOS_FIJOS")
line(ws, 15, "Dias de operacion al mes", f'={P_DIAS}', INT, "Editable en INICIO")

sect(ws, 17, "PUNTO DE EQUILIBRIO")
line(ws, 18, "Unidades a vender AL MES para no perder", '=IFERROR(ROUNDUP($C$14/$C$10,0),0)', INT, "", bold=True)
line(ws, 19, "Unidades a vender AL DIA para no perder", '=IFERROR(ROUNDUP($C$18/$C$15,0),0)', INT, "ESTE es el numero que tienes que tener en la cabeza", bold=True, color="C00000")
line(ws, 20, "Venta (con IVA) necesaria al mes", f'=IFERROR($C$18*$C$8*(1+{P_IVA}),0)', MON, "")
line(ws, 21, "Venta (con IVA) necesaria al dia", '=IFERROR($C$20/$C$15,0)', MON, "")

sect(ws, 23, "COMO VAS ESTE MES")
line(ws, 24, "Unidades vendidas vs punto de equilibrio", '=IFERROR($C$7/$C$18,0)', PCT, "100% = ya cubriste costos. Todo lo demas es ganancia")
line(ws, 25, "Utilidad neta del mes", f'=$C$5-$C$6-{GF_TOTAL}', MON, "Ingreso neto - costo de ventas - fijos", bold=True)
line(ws, 26, "Estado", '=IF($C$25>0,"GANANDO",IF($C$25=0,"EN EL LIMITE","PERDIENDO PLATA"))', "General", "")

ws.cell(row=27, column=4, value="Nota: aqui se usan los fijos PLANIFICADOS (GASTOS_FIJOS). El DASHBOARD usa los gastos REALES que registraste.").font = SUB_FONT
sect(ws, 28, "SIMULADOR: ¿que pasa si...?")
ws.cell(row=29, column=2, value="Unidades al dia (escribe aqui)").font = Font(name=F, size=10)
c = ws.cell(row=29, column=3, value=30); c.font = Font(name=F, size=10, bold=True, color=BLUE)
c.fill = YELLOW; c.border = BOX; c.number_format = INT; c.alignment = Alignment(horizontal="center")
line(ws, 30, "Utilidad neta proyectada al mes", '=IFERROR($C$29*$C$15*$C$10-$C$14,0)', MON, "Con el margen de contribucion actual", bold=True)
line(ws, 31, "Venta bruta proyectada (c/IVA) al mes", f'=IFERROR($C$29*$C$15*$C$8*(1+{P_IVA}),0)', MON, "")

ws.conditional_formatting.add("C25:C26",
    CellIsRule(operator="lessThan", formula=["0"], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006", bold=True)))

# =====================================================================
# 12. PYG
# =====================================================================
ws = wb.create_sheet("PYG")
title(ws, "ESTADO DE RESULTADOS (P&G) — REAL", "Se llena solo con lo que registras en VENTAS y GASTOS. No escribes nada aqui.", 9)
headers(ws, 4,
    ["Mes", "Venta bruta (c/IVA)", "IVA cobrado", "INGRESO NETO", "Costo de ventas", "UTILIDAD BRUTA",
     "Margen bruto", "Gastos operativos", "UTILIDAD NETA"],
    [12, 15, 12, 14, 14, 14, 12, 15, 14])

meses = ["2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02",
         "2027-03", "2027-04", "2027-05", "2027-06", "2027-07", "2027-08"]
PY_R1 = 5
for i, m in enumerate(meses):
    r = PY_R1 + i
    ws.cell(row=r, column=1, value=m)
    ws.cell(row=r, column=2, value=f'=SUMIFS({VE_TOT},{VE_MES},$A{r})')
    ws.cell(row=r, column=3, value=f'=SUMIFS({VE_IVA},{VE_MES},$A{r})')
    ws.cell(row=r, column=4, value=f'=SUMIFS({VE_NETO},{VE_MES},$A{r})')
    ws.cell(row=r, column=5, value=f'=SUMIFS({VE_COSTO},{VE_MES},$A{r})')
    ws.cell(row=r, column=6, value=f'=$D{r}-$E{r}')
    ws.cell(row=r, column=7, value=f'=IFERROR($F{r}/$D{r},0)')
    ws.cell(row=r, column=8, value=f'=SUMIFS({GA_MON},{GA_MES},$A{r})-SUMIFS({GA_MON},{GA_MES},$A{r},{GA_CAT},"Insumos")-SUMIFS({GA_MON},{GA_MES},$A{r},{GA_CAT},"Descartables")')
    ws.cell(row=r, column=9, value=f'=$F{r}-$H{r}')

PY_R2 = PY_R1 + len(meses) - 1
TR = PY_R2 + 1
ws.cell(row=TR, column=1, value="TOTAL")
for c in range(2, 10):
    if c == 7:
        ws.cell(row=TR, column=c, value=f'=IFERROR($F{TR}/$D{TR},0)')
    else:
        L = get_column_letter(c)
        ws.cell(row=TR, column=c, value=f'=SUM({L}{PY_R1}:{L}{PY_R2})')
for c in range(1, 10):
    cell = ws.cell(row=TR, column=c)
    cell.font = Font(name=F, size=10, bold=True, color="FFFFFF"); cell.fill = HDR_FILL; cell.border = BOX

style_range(ws, PY_R1, PY_R2, 1, 1, fill=GREY, align="center")
style_range(ws, PY_R1, PY_R2, 2, 6, fmt=MON, fill=GREY)
style_range(ws, PY_R1, PY_R2, 7, 7, fmt=PCT, fill=GREY)
style_range(ws, PY_R1, PY_R2, 8, 9, fmt=MON, fill=GREY)
for r in range(PY_R1, TR + 1):
    ws.cell(row=r, column=9).number_format = MON
    ws.cell(row=r, column=9).font = Font(name=F, size=10, bold=True,
                                         color="FFFFFF" if r == TR else BLACK)
    for c in (2, 3, 4, 5, 6, 8):
        ws.cell(row=r, column=c).number_format = MON
    ws.cell(row=r, column=7).number_format = PCT

ws.conditional_formatting.add(f"I{PY_R1}:I{PY_R2}",
    CellIsRule(operator="lessThan", formula=["0"], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006", bold=True)))

ws.cell(row=TR + 2, column=1, value="Gastos operativos = todos los GASTOS del mes MENOS insumos y descartables (esos ya estan en el costo de ventas via recetas).").font = SUB_FONT

# =====================================================================
# 13. PROYECCIONES
# =====================================================================
ws = wb.create_sheet("PROYECCIONES")
title(ws, "PROYECCIONES A 12 MESES", "3 escenarios. Cambia los supuestos en AZUL y mira que pasa con la caja.", 6)
for col, w in zip("ABCDEFGH", [4, 30, 14, 14, 14, 14, 14, 14]):
    ws.column_dimensions[col].width = w

ws.cell(row=4, column=2, value="SUPUESTOS").font = Font(name=F, size=11, bold=True, color="1F3864")
for c in range(2, 6): ws.cell(row=4, column=c).fill = SECT_FILL
hdr = ["Escenario", "Ventas/dia mes 1", "Ticket promedio c/IVA", "Crecimiento mensual"]
for i, h in enumerate(hdr):
    cell = ws.cell(row=5, column=2 + i, value=h)
    cell.font = HDR_FONT; cell.fill = HDR_FILL; cell.border = BOX
    cell.alignment = Alignment(horizontal="center", wrap_text=True)

esc = [("Pesimista", 15, 2.00, 0.02), ("Realista", 25, 2.20, 0.05), ("Optimista", 45, 2.50, 0.08)]
for i, (nom, vd, tk, cr) in enumerate(esc):
    r = 6 + i
    ws.cell(row=r, column=2, value=nom).font = Font(name=F, size=10, bold=True)
    for j, v in enumerate((vd, tk, cr)):
        cell = ws.cell(row=r, column=3 + j, value=v)
        cell.font = Font(name=F, size=10, color=BLUE); cell.fill = YELLOW; cell.border = BOX
        cell.alignment = Alignment(horizontal="center")
        cell.number_format = INT if j == 0 else (MON if j == 1 else PCT)

ws.cell(row=10, column=2, value="Margen de contribucion % (viene de EQUILIBRIO)").font = Font(name=F, size=10)
ws.cell(row=10, column=3, value="=IFERROR(EQUILIBRIO!$C$11,0.75)").number_format = PCT
ws.cell(row=10, column=3).fill = GREY; ws.cell(row=10, column=3).border = BOX
ws.cell(row=10, column=3).font = Font(name=F, size=10, color=GREEN)
ws.cell(row=10, column=4, value="Si aun no tienes ventas registradas usa 75% por defecto.").font = SUB_FONT
ws.cell(row=11, column=2, value="Gastos fijos / mes").font = Font(name=F, size=10)
ws.cell(row=11, column=3, value=f'={GF_TOTAL}').number_format = MON
ws.cell(row=11, column=3).fill = GREY; ws.cell(row=11, column=3).border = BOX
ws.cell(row=11, column=3).font = Font(name=F, size=10, color=GREEN)

row = 13
for i, (nom, _, _, _) in enumerate(esc):
    sup = 6 + i
    ws.cell(row=row, column=2, value=f"ESCENARIO {nom.upper()}").font = Font(name=F, size=11, bold=True, color="1F3864")
    for c in range(2, 9): ws.cell(row=row, column=c).fill = SECT_FILL
    row += 1
    hh = ["Mes", "Ventas/dia", "Venta bruta c/IVA", "Ingreso neto", "Margen contrib. $", "Gastos fijos", "UTILIDAD NETA", "Caja acumulada"]
    for j, h in enumerate(hh):
        cell = ws.cell(row=row, column=2 + j, value=h)
        cell.font = HDR_FONT; cell.fill = HDR_FILL; cell.border = BOX
        cell.alignment = Alignment(horizontal="center", wrap_text=True)
    hrow = row
    row += 1
    first = row
    for m in range(12):
        r = row + m
        ws.cell(row=r, column=2, value=f"Mes {m+1}")
        if m == 0:
            ws.cell(row=r, column=3, value=f'=$C${sup}')
        else:
            ws.cell(row=r, column=3, value=f'=$D{r-1}*(1+$E${sup})/$D${first}*$C${first}' if False else f'=$C{r-1}*(1+$E${sup})')
        ws.cell(row=r, column=4, value=f'=$C{r}*{P_DIAS}*$D${sup}')
        ws.cell(row=r, column=5, value=f'=$D{r}/(1+{P_IVA})')
        ws.cell(row=r, column=6, value=f'=$E{r}*$C$10')
        ws.cell(row=r, column=7, value=f'=$C$11')
        ws.cell(row=r, column=8, value=f'=$F{r}-$G{r}')
        ws.cell(row=r, column=9, value=f'=$H{r}' if m == 0 else f'=$I{r-1}+$H{r}')
    last = row + 11
    style_range(ws, first, last, 2, 2, fill=GREY, align="center")
    style_range(ws, first, last, 3, 3, fmt=NUM, fill=GREY, align="center")
    style_range(ws, first, last, 4, 9, fmt=MON, fill=GREY)
    for r in range(first, last + 1):
        ws.cell(row=r, column=8).font = Font(name=F, size=10, bold=True)
    ws.conditional_formatting.add(f"H{first}:I{last}",
        CellIsRule(operator="lessThan", formula=["0"], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006")))
    row = last + 3

ws.cell(row=row, column=2, value="La columna 'Caja acumulada' es la que importa: te dice en que mes dejas de poner plata de tu bolsillo.").font = SUB_FONT

# =====================================================================
# 14. DASHBOARD
# =====================================================================
ws = wb.create_sheet("DASHBOARD")
title(ws, "DASHBOARD", "Cambia el mes en la hoja INICIO (celda C8) y todo aqui se actualiza.", 6)
for col, w in zip("ABCDEFGH", [4, 34, 16, 4, 30, 14, 14, 12]):
    ws.column_dimensions[col].width = w

ws.cell(row=3, column=2, value="MES ANALIZADO:").font = Font(name=F, size=11, bold=True)
ws.cell(row=3, column=3, value=f'={P_MES}').font = Font(name=F, size=14, bold=True, color="C00000")
ws.cell(row=3, column=3).alignment = Alignment(horizontal="center")

kpis = [
    ("VENTA BRUTA DEL MES (c/IVA)", f'=SUMIFS({VE_TOT},{VE_MES},{P_MES})', MON),
    ("IVA cobrado (esto NO es tuyo)", f'=SUMIFS({VE_IVA},{VE_MES},{P_MES})', MON),
    ("INGRESO NETO (tuyo)", f'=SUMIFS({VE_NETO},{VE_MES},{P_MES})', MON),
    ("Costo de ventas", f'=SUMIFS({VE_COSTO},{VE_MES},{P_MES})', MON),
    ("UTILIDAD BRUTA", '=$C$7-$C$8', MON),
    ("Margen bruto", '=IFERROR($C$9/$C$7,0)', PCT),
    ("Gastos operativos del mes", f'=SUMIFS({GA_MON},{GA_MES},{P_MES})-SUMIFS({GA_MON},{GA_MES},{P_MES},{GA_CAT},"Insumos")-SUMIFS({GA_MON},{GA_MES},{P_MES},{GA_CAT},"Descartables")', MON),
    ("UTILIDAD NETA DEL MES", '=$C$9-$C$11', MON),
    ("Unidades vendidas", f'=SUMIFS({VE_CANT},{VE_MES},{P_MES})', INT),
    ("Ticket promedio (c/IVA)", '=IFERROR($C$5/$C$13,0)', MON),
    ("Dias con ventas registradas", f'=SUMPRODUCT(({VE_MES}={P_MES})*({VE_FEC}<>"")*(COUNTIFS({VE_FEC},{VE_FEC}&"")=0))', INT),
]
r = 5
for label, formula, fmt in kpis:
    ws.cell(row=r, column=2, value=label).font = Font(name=F, size=10, bold=(("UTILIDAD" in label) or ("VENTA BRUTA" in label)))
    c = ws.cell(row=r, column=3, value=formula)
    c.number_format = fmt; c.fill = GREY; c.border = BOX
    c.alignment = Alignment(horizontal="center")
    c.font = Font(name=F, size=12 if "UTILIDAD NETA" in label else 10, bold=("UTILIDAD" in label))
    r += 1

# corrige la fila 15 (dias con ventas) por una version simple y confiable
ws.cell(row=15, column=2, value="Venta promedio por dia (mes / dias operacion)")
ws.cell(row=15, column=3, value=f'=IFERROR($C$5/{P_DIAS},0)')
ws.cell(row=15, column=3).number_format = MON

ws.cell(row=17, column=2, value="VS PUNTO DE EQUILIBRIO").font = Font(name=F, size=11, bold=True, color="1F3864")
for c in range(2, 4): ws.cell(row=17, column=c).fill = SECT_FILL
for i, (lab, f_, fmt) in enumerate([
    ("Unidades necesarias al mes", "=IFERROR(EQUILIBRIO!$C$18,0)", INT),
    ("% del punto de equilibrio alcanzado", "=IFERROR($C$13/EQUILIBRIO!$C$18,0)", PCT),
    ("Estado", '=IF($C$12>0,"GANANDO PLATA",IF($C$13=0,"SIN DATOS","PERDIENDO PLATA"))', "General"),
]):
    rr = 18 + i
    ws.cell(row=rr, column=2, value=lab).font = Font(name=F, size=10)
    c = ws.cell(row=rr, column=3, value=f_)
    c.number_format = fmt; c.fill = GREY; c.border = BOX
    c.alignment = Alignment(horizontal="center"); c.font = Font(name=F, size=10, bold=True)

ws.conditional_formatting.add("C12",
    CellIsRule(operator="lessThan", formula=["0"], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006", bold=True)))
ws.conditional_formatting.add("C12",
    CellIsRule(operator="greaterThan", formula=["0"], fill=PatternFill("solid", fgColor="C6EFCE"), font=Font(color="006100", bold=True)))
ws.conditional_formatting.add("C20",
    FormulaRule(formula=['EXACT($C$20,"PERDIENDO PLATA")'], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(color="9C0006", bold=True)))
ws.conditional_formatting.add("C20",
    FormulaRule(formula=['EXACT($C$20,"GANANDO PLATA")'], fill=PatternFill("solid", fgColor="C6EFCE"), font=Font(color="006100", bold=True)))

# Ranking de productos (columna E-H)
ws.cell(row=4, column=5, value="RENDIMIENTO POR PRODUCTO (mes analizado)").font = Font(name=F, size=11, bold=True, color="1F3864")
for c in range(5, 9): ws.cell(row=4, column=c).fill = SECT_FILL
for j, h in enumerate(["Producto", "Unidades", "Venta c/IVA", "Utilidad"]):
    cell = ws.cell(row=5, column=5 + j, value=h)
    cell.font = HDR_FONT; cell.fill = HDR_FILL; cell.border = BOX
    cell.alignment = Alignment(horizontal="center")

DR1 = 6
DR2 = DR1 + (PR_R2 - PR_R1)
for i in range(PR_R2 - PR_R1 + 1):
    r = DR1 + i
    pr = PR_R1 + i
    ws.cell(row=r, column=5, value=f'=IF(PRODUCTOS!$B{pr}="","",PRODUCTOS!$B{pr})')
    ws.cell(row=r, column=6, value=f'=IF($E{r}="","",SUMIFS({VE_CANT},{VE_MES},{P_MES},{VE_PROD},$E{r}))')
    ws.cell(row=r, column=7, value=f'=IF($E{r}="","",SUMIFS({VE_TOT},{VE_MES},{P_MES},{VE_PROD},$E{r}))')
    ws.cell(row=r, column=8, value=f'=IF($E{r}="","",SUMIFS({VE_UTIL},{VE_MES},{P_MES},{VE_PROD},$E{r}))')

style_range(ws, DR1, DR2, 5, 5, color=GREEN, fill=GREY)
style_range(ws, DR1, DR2, 6, 6, fmt=INT, fill=GREY, align="center")
style_range(ws, DR1, DR2, 7, 8, fmt=MON, fill=GREY)

ws.cell(row=DR2 + 2, column=5, value="Ordena esta tabla por 'Utilidad' (Datos > Ordenar) para ver que producto realmente te da de comer.").font = SUB_FONT
ws.cell(row=DR2 + 3, column=5, value="El que mas vende no siempre es el que mas deja. Ese es el punto de esta tabla.").font = SUB_FONT

# =====================================================================
# 15. FICHAS_TECNICAS
# =====================================================================
ws = wb.create_sheet("FICHAS_TECNICAS")
title(ws, "FICHAS TECNICAS DE PRODUCCION",
      "Receta estandarizada, paso a paso y tiempos. Imprime esta hoja y pegala en la pared del local. El costo se actualiza solo.", 6)
for col, w in zip("ABCDEF", [4, 6, 34, 14, 12, 58]):
    ws.column_dimensions[col].width = w

PASOS = {
    "Granizado de maquina (Coco / Frutos Rojos / Maracuya / Naranja)": dict(
        ref="Coco s/alcohol", tiempo="Menos de 1 minuto", rinde="1 vaso 12 oz (350 ml)",
        equipo="Maquina granizadora de 4 sabores",
        pasos=[
            ("1", "Tomar vaso 12 oz limpio y colocarlo bajo la palanca del sabor pedido.", "5 seg"),
            ("2", "Accionar la palanca lentamente hasta llenar 3/4 del vaso (~300 ml).", "15 seg"),
            ("3", "CONTROL: el granizado debe salir compacto, no liquido. Si sale aguado, esperar 2 min a que enfrie la maquina.", "-"),
            ("4", "SOLO version c/alcohol: agregar 30 ml de vodka o aguardiente por encima.", "10 seg"),
            ("5", "Mezclar suavemente con el pitillo 2-3 veces. NO mezclar de mas: se pierde la textura.", "5 seg"),
            ("6", "Colocar tapa, insertar pitillo, entregar con servilleta.", "10 seg"),
        ],
        control=["Textura compacta, no liquida", "Vaso lleno a 3/4", "Tapa bien cerrada", "Sin derrames por fuera"],
        errores=["Granizado liquido -> maquina no fria o mezcla muy diluida",
                 "Muy dulce -> ajustar dilucion a 1:4", "Insipido -> ajustar dilucion a 1:2.5"],
        mezcla="Recarga: 500 ml de jarabe + 1500 ml de agua (1:3). Rinde ~8 vasos por carga."),
    "Granizado especial OREO": dict(
        ref="Oreo s/alcohol", tiempo="Menos de 2 minutos", rinde="1 vaso 12 oz",
        equipo="Licuadora",
        pasos=[
            ("1", "Meter 150 g de hielo (~10 cubos) en la licuadora.", "10 seg"),
            ("2", "Agregar 100 ml de leche entera.", "5 seg"),
            ("3", "Agregar 3 galletas Oreo enteras. RESERVAR 1 galleta para decorar.", "10 seg"),
            ("4", "Licuar 20-25 segundos hasta textura cremosa y espesa.", "25 seg"),
            ("5", "CONTROL: debe quedar espeso como helado suave. Si queda liquido, agregar hielo y volver a licuar.", "-"),
            ("6", "Verter en el vaso 12 oz.", "10 seg"),
            ("7", "SOLO c/alcohol: agregar 30 ml y mezclar con pitillo 2-3 veces.", "10 seg"),
            ("8", "Triturar la galleta reservada y espolvorear encima.", "15 seg"),
            ("9", "Tapa + pitillo. Entregar.", "10 seg"),
        ],
        control=["Textura espesa tipo smoothie helado", "Sabor intenso a Oreo (si esta suave: 1 galleta mas)",
                 "Decoracion visible arriba", "Muy frio al tacto"],
        errores=["Queda aguado -> falto hielo o sobro leche", "Sabor plano -> agregar 1 galleta"],
        mezcla="Limpiar la licuadora OBLIGATORIAMENTE entre cada especial."),
    "Granizado especial NUTELLA": dict(
        ref="Nutella s/alcohol", tiempo="Menos de 2 minutos", rinde="1 vaso 12 oz",
        equipo="Licuadora",
        pasos=[
            ("1", "Meter 150 g de hielo en la licuadora.", "10 seg"),
            ("2", "Agregar 120 ml de leche entera.", "5 seg"),
            ("3", "Agregar 2 cucharadas soperas de Nutella (~30 g), a temperatura ambiente.", "15 seg"),
            ("4", "Licuar 25-30 segundos hasta que quede cremoso y SIN grumos.", "30 seg"),
            ("5", "CONTROL: revisar que no queden pelotitas de Nutella sin mezclar.", "-"),
            ("6", "Verter en el vaso 12 oz.", "10 seg"),
            ("7", "SOLO c/alcohol: 30 ml y mezclar suavemente.", "10 seg"),
            ("8", "Decorar con un hilo de Nutella encima (para foto).", "10 seg"),
            ("9", "Tapa + pitillo. Entregar.", "10 seg"),
        ],
        control=["Sin grumos", "Textura espesa", "Hilo de Nutella visible", "Muy frio"],
        errores=["Grumos -> la Nutella estaba fria, sacarla de la nevera antes",
                 "Sabor amargo -> agregar 1 cucharadita de azucar"],
        mezcla="Limpiar la licuadora OBLIGATORIAMENTE entre cada especial."),
    "Granizado especial CAFE": dict(
        ref="Cafe s/alcohol", tiempo="Menos de 2 minutos", rinde="1 vaso 12 oz",
        equipo="Licuadora",
        pasos=[
            ("1", "Disolver 2 cucharaditas de cafe soluble en 20 ml de agua caliente. NUNCA en polvo directo.", "20 seg"),
            ("2", "Meter 160 g de hielo (~11 cubos) en la licuadora.", "10 seg"),
            ("3", "Agregar 80 ml de leche entera + 20 ml de leche condensada + el cafe disuelto.", "15 seg"),
            ("4", "Licuar 20 segundos.", "20 seg"),
            ("5", "CONTROL: textura espesa y fria. Si esta liquido, agregar hielo.", "-"),
            ("6", "Verter en el vaso 12 oz.", "10 seg"),
            ("7", "SOLO c/alcohol: 30 ml de licor de cafe (ideal) o vodka. Mezclar suave.", "10 seg"),
            ("8", "Tapa + pitillo. Entregar.", "10 seg"),
        ],
        control=["Sin grumos de cafe", "Dulzor equilibrado (lo da la leche condensada)", "Textura espesa", "Muy frio"],
        errores=["Grumoso -> el cafe no se disolvio primero", "Poco dulce -> media cucharada mas de condensada"],
        mezcla="Limpiar la licuadora OBLIGATORIAMENTE entre cada especial."),
    "PAPAS FRITAS EN CONO": dict(
        ref="Papas en cono natural", tiempo="3-4 minutos (con aceite ya caliente)", rinde="1 cono (~200 g de papa)",
        equipo="Freidora / sarten hondo",
        pasos=[
            ("1", "Precalentar el aceite a 175-180 C antes de abrir. Mantenerlo caliente todo el turno.", "-"),
            ("2", "Pesar 200 g de papa cortada.", "20 seg"),
            ("3", "Freir 3-4 minutos hasta dorado uniforme.", "4 min"),
            ("4", "Escurrir bien sobre rejilla o papel. CONTROL: no deben quedar aceitosas.", "20 seg"),
            ("5", "Salar de inmediato mientras estan calientes (2 g).", "10 seg"),
            ("6", "Servir en el cono de papel. Version + salsa: agregar el sachet elegido.", "15 seg"),
        ],
        control=["Dorado uniforme, no palidas ni quemadas", "Crujientes por fuera", "No aceitosas", "Saladas en caliente"],
        errores=["Blandas -> aceite frio o sobrecarga de la freidora",
                 "Quemadas -> aceite muy caliente o demasiado tiempo",
                 "Sabor rancio -> aceite reutilizado de mas, cambiarlo"],
        mezcla="Cambiar el aceite cada 3 dias o antes si se oscurece. El aceite viejo arruina el producto."),
}

r = 4
for nombre, d in PASOS.items():
    ws.cell(row=r, column=2, value=nombre).font = Font(name=F, size=13, bold=True, color="FFFFFF")
    for c in range(2, 7):
        ws.cell(row=r, column=c).fill = HDR_FILL
    ws.row_dimensions[r].height = 22
    r += 1
    meta = [("Tiempo objetivo", d["tiempo"]), ("Rendimiento", d["rinde"]), ("Equipo", d["equipo"])]
    for lab, val in meta:
        ws.cell(row=r, column=2, value=lab).font = Font(name=F, size=10, bold=True)
        ws.cell(row=r, column=3, value=val).font = Font(name=F, size=10)
        r += 1
    ws.cell(row=r, column=2, value="Costo real por unidad").font = Font(name=F, size=10, bold=True)
    cc = ws.cell(row=r, column=3, value=f'=IFERROR(INDEX({PROD_COST},MATCH("{d["ref"]}",{PROD_NAME},0)),"")')
    cc.number_format = MON; cc.font = Font(name=F, size=10, bold=True, color=GREEN); cc.fill = GREY; cc.border = BOX
    ws.cell(row=r, column=4, value="(se actualiza solo desde INSUMOS)").font = SUB_FONT
    r += 2

    for h, col in (("Paso", 2), ("Que hacer", 3), ("Tiempo", 4)):
        cell = ws.cell(row=r, column=col, value=h)
        cell.font = HDR_FONT; cell.fill = PatternFill("solid", fgColor="4472C4"); cell.border = BOX
        cell.alignment = Alignment(horizontal="center")
    ws.cell(row=r, column=5).fill = PatternFill("solid", fgColor="4472C4")
    ws.cell(row=r, column=6).fill = PatternFill("solid", fgColor="4472C4")
    r += 1
    for num, txt, t in d["pasos"]:
        ws.cell(row=r, column=2, value=num).font = Font(name=F, size=10, bold=True)
        ws.cell(row=r, column=2).alignment = Alignment(horizontal="center")
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=3)
        c3 = ws.cell(row=r, column=3, value=txt)
        c3.font = Font(name=F, size=10); c3.alignment = Alignment(wrap_text=True, vertical="top")
        ws.cell(row=r, column=4, value=t).font = Font(name=F, size=9, color="595959")
        ws.cell(row=r, column=4).alignment = Alignment(horizontal="center")
        for c in range(2, 5):
            ws.cell(row=r, column=c).border = BOX
        ws.row_dimensions[r].height = 26
        r += 1
    r += 1
    ws.cell(row=r, column=2, value="CONTROL DE CALIDAD antes de entregar").font = Font(name=F, size=10, bold=True, color="006100")
    r += 1
    for chk in d["control"]:
        ws.cell(row=r, column=3, value="[  ]  " + chk).font = Font(name=F, size=10)
        r += 1
    r += 1
    ws.cell(row=r, column=2, value="SI ALGO SALE MAL").font = Font(name=F, size=10, bold=True, color="9C0006")
    r += 1
    for e in d["errores"]:
        ws.cell(row=r, column=3, value="- " + e).font = Font(name=F, size=10)
        r += 1
    ws.cell(row=r, column=2, value="NOTA").font = Font(name=F, size=10, bold=True)
    ws.cell(row=r, column=3, value=d["mezcla"]).font = Font(name=F, size=10, italic=True)
    r += 3

ws.cell(row=r, column=2, value="Si cambias una receta aqui, cambiala TAMBIEN en la hoja RECETAS o el costo dejara de ser real.").font = Font(name=F, size=10, bold=True, color="9C0006")


# orden de hojas
orden = ["INICIO", "DASHBOARD", "VENTAS", "GASTOS", "CAJA", "PRODUCTOS", "COMBOS", "RECETAS",
         "INSUMOS", "FICHAS_TECNICAS", "INVENTARIO", "GASTOS_FIJOS", "EQUILIBRIO", "PYG", "PROYECCIONES"]
wb._sheets = [wb[n] for n in orden]
for n, color in (("INICIO", "1F3864"), ("DASHBOARD", "C00000"), ("VENTAS", "2E7D32"), ("GASTOS", "2E7D32"),
                 ("CAJA", "2E7D32"), ("PRODUCTOS", "1F3864"), ("COMBOS", "1F3864"), ("RECETAS", "1F3864"),
                 ("INSUMOS", "1F3864"), ("FICHAS_TECNICAS", "7030A0"), ("INVENTARIO", "ED7D31"),
                 ("GASTOS_FIJOS", "ED7D31"), ("EQUILIBRIO", "ED7D31"), ("PYG", "ED7D31"), ("PROYECCIONES", "ED7D31")):
    wb[n].sheet_properties.tabColor = color
wb.save(OUT)
print("OK:", OUT)
print("Hojas:", wb.sheetnames)
