#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o troféu "MELHOR SOBREMESA 2026" como arquivo .STL
sem usar nenhuma biblioteca externa (Python puro).

Saída: trofeu_melhor_sobremesa.stl  (STL ASCII)

Modelo: base arredondada + placa frontal + chapéu de chef (toque)
        + garfo e faca cruzados + moldura de porta-retrato atrás.
"""

import math
import struct

TRIS = []  # lista de triângulos: cada um = (v0, v1, v2)


# ------------------------------------------------------------------
# Utilidades de geometria
# ------------------------------------------------------------------
def add_tri(a, b, c):
    TRIS.append((a, b, c))


def add_quad(a, b, c, d):
    """Quadrilátero a->b->c->d (ordem antihorária vista de fora)."""
    add_tri(a, b, c)
    add_tri(a, c, d)


def box(x0, y0, z0, x1, y1, z1):
    """Caixa alinhada aos eixos, de (x0,y0,z0) a (x1,y1,z1)."""
    p = [
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),  # base 0-3
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),  # topo 4-7
    ]
    add_quad(p[0], p[3], p[2], p[1])  # fundo
    add_quad(p[4], p[5], p[6], p[7])  # topo
    add_quad(p[0], p[1], p[5], p[4])  # frente (y0)
    add_quad(p[2], p[3], p[7], p[6])  # trás  (y1)
    add_quad(p[1], p[2], p[6], p[5])  # dir   (x1)
    add_quad(p[3], p[0], p[4], p[7])  # esq   (x0)


def box_rot(cx, cy, z0, z1, w, l, ang_deg):
    """Caixa vertical em Z, retângulo (w=largura X, l=comprimento Y)
    centrado em (cx,cy) e girado 'ang_deg' graus em torno de Z."""
    a = math.radians(ang_deg)
    ca, sa = math.cos(a), math.sin(a)
    # cantos do retângulo no plano, antes de girar
    corners = [(-w/2, -l/2), (w/2, -l/2), (w/2, l/2), (-w/2, l/2)]
    rot = []
    for (x, y) in corners:
        rx = x*ca - y*sa + cx
        ry = x*sa + y*ca + cy
        rot.append((rx, ry))
    bot = [(rx, ry, z0) for (rx, ry) in rot]
    top = [(rx, ry, z1) for (rx, ry) in rot]
    add_quad(bot[0], bot[3], bot[2], bot[1])  # fundo
    add_quad(top[0], top[1], top[2], top[3])  # topo
    for i in range(4):
        j = (i+1) % 4
        add_quad(bot[i], bot[j], top[j], top[i])  # laterais


def sphere(cx, cy, cz, r, seg=16):
    """Esfera UV centrada em (cx,cy,cz)."""
    for i in range(seg):          # latitude
        th0 = math.pi * i / seg
        th1 = math.pi * (i+1) / seg
        for j in range(seg*2):    # longitude
            ph0 = 2*math.pi * j / (seg*2)
            ph1 = 2*math.pi * (j+1) / (seg*2)

            def pt(th, ph):
                return (cx + r*math.sin(th)*math.cos(ph),
                        cy + r*math.sin(th)*math.sin(ph),
                        cz + r*math.cos(th))
            a = pt(th0, ph0)
            b = pt(th1, ph0)
            c = pt(th1, ph1)
            d = pt(th0, ph1)
            add_quad(a, b, c, d)


def cylinder(cx, cy, z0, z1, r, seg=32):
    """Cilindro vertical em Z, com tampas."""
    pts0, pts1 = [], []
    for j in range(seg):
        ph = 2*math.pi*j/seg
        x = cx + r*math.cos(ph)
        y = cy + r*math.sin(ph)
        pts0.append((x, y, z0))
        pts1.append((x, y, z1))
    c0 = (cx, cy, z0)
    c1 = (cx, cy, z1)
    for j in range(seg):
        k = (j+1) % seg
        add_tri(c0, pts0[k], pts0[j])      # tampa de baixo
        add_tri(c1, pts1[j], pts1[k])      # tampa de cima
        add_quad(pts0[j], pts0[k], pts1[k], pts1[j])  # lateral


def cone(cx, cy, z0, z1, r0, r1, seg=32):
    """Tronco de cone (r0 em baixo, r1 em cima)."""
    pts0, pts1 = [], []
    for j in range(seg):
        ph = 2*math.pi*j/seg
        pts0.append((cx + r0*math.cos(ph), cy + r0*math.sin(ph), z0))
        pts1.append((cx + r1*math.cos(ph), cy + r1*math.sin(ph), z1))
    c0 = (cx, cy, z0)
    c1 = (cx, cy, z1)
    for j in range(seg):
        k = (j+1) % seg
        add_tri(c0, pts0[k], pts0[j])
        add_tri(c1, pts1[j], pts1[k])
        add_quad(pts0[j], pts0[k], pts1[k], pts1[j])


# ------------------------------------------------------------------
# Texto simples em relevo (dígitos e letras como blocos 5x7)
# ------------------------------------------------------------------
FONT = {
    "2": ["111", "001", "111", "100", "111"],
    "0": ["111", "101", "101", "101", "111"],
    "6": ["111", "100", "111", "101", "111"],
    " ": ["000", "000", "000", "000", "000"],
    "S": ["111", "100", "111", "001", "111"],
    "O": ["111", "101", "101", "101", "111"],
    "B": ["110", "101", "110", "101", "110"],
    "R": ["110", "101", "110", "101", "101"],
    "E": ["111", "100", "110", "100", "111"],
    "M": ["101", "111", "111", "101", "101"],
    "L": ["100", "100", "100", "100", "111"],
    "H": ["101", "101", "111", "101", "101"],
    "A": ["111", "101", "111", "101", "101"],
    "D": ["110", "101", "101", "101", "110"],
}


def texto_relevo(txt, x, y_front, z, px=1.6, prof=1.2):
    """Escreve 'txt' em pixels 3x5 em relevo saindo para -Y (frente)."""
    largura_total = len(txt) * 4 * px
    start_x = x - largura_total/2
    for ci, ch in enumerate(txt.upper()):
        glyph = FONT.get(ch, FONT[" "])
        for row in range(5):
            for col in range(3):
                if glyph[row][col] == "1":
                    bx = start_x + ci*4*px + col*px
                    bz = z + (4-row)*px
                    box(bx, y_front - prof, bz,
                        bx + px*0.95, y_front, bz + px*0.95)


# ------------------------------------------------------------------
# MONTAGEM DO TROFÉU
# ------------------------------------------------------------------
def montar():
    # ---- Base (bloco) ----
    BW, BD, BH = 90, 55, 16
    box(-BW/2, -BD/2, 0, BW/2, BD/2, BH)

    # ---- Placa de texto na frente (y = -BD/2) ----
    texto_relevo("MELHOR SOBREMESA", 0, -BD/2, 9.5, px=1.3, prof=1.0)
    texto_relevo("2026", 0, -BD/2, 2.5, px=2.2, prof=1.2)

    # ---- Porta-retrato (moldura atrás) ----
    FW, FH = 55, 42           # janela da foto
    MB = 6                    # borda da moldura
    MESP = 7                  # espessura (profundidade Y)
    y0 = BD/2 - MESP
    y1 = BD/2
    lt = FW + 2*MB
    at = FH + 2*MB
    z_base = BH
    # pilares e travessas da moldura (frame vazado)
    box(-lt/2, y0, z_base, -FW/2, y0+MESP, z_base+at)          # esquerda
    box(FW/2, y0, z_base, lt/2, y0+MESP, z_base+at)            # direita
    box(-FW/2, y0, z_base+FH, FW/2, y0+MESP, z_base+at)        # topo
    box(-FW/2, y0, z_base, FW/2, y0+MESP, z_base+MB)           # baixo
    # fundo fino atrás da foto (para apoiar)
    box(-FW/2, y1-1.5, z_base+MB, FW/2, y1, z_base+MB+FH)

    # ---- Chapéu de chef (toque) no topo esquerdo ----
    hx, hy = -BW/2 + 18, -BD/2 + 18
    cylinder(hx, hy, BH, BH+10, 10)                  # faixa
    cone(hx, hy, BH+10, BH+14, 10, 13)               # transição
    sphere(hx, hy, BH+20, 12, seg=14)                # cúpula fofa central
    for a in (0, 120, 240):                          # bolhas laterais
        bx = hx + 7*math.cos(math.radians(a))
        by = hy + 7*math.sin(math.radians(a))
        sphere(bx, by, BH+17, 7, seg=12)
    sphere(hx, hy, BH+27, 7, seg=12)                 # bolha do topo

    # ---- Talheres cruzados no topo direito ----
    tx, ty = BW/2 - 20, -BD/2 + 20
    z0, z1 = BH, BH + 3.0
    # faca: cabo + lâmina (duas caixas giradas formando um talher)
    box_rot(tx, ty, z0, z1, 5, 26, 28)               # faca inteira (simplif.)
    box_rot(tx, ty+2, z0+3.0, z1+3.0, 7, 22, 28)     # lâmina mais larga
    # garfo (inclinado para o outro lado)
    box_rot(tx, ty, z0, z1, 5, 26, -28)              # cabo+corpo
    # dentes do garfo
    a = math.radians(-28)
    hx2 = tx + (0)*math.cos(a) - (16)*math.sin(a)
    hy2 = ty + (0)*math.sin(a) + (16)*math.cos(a)
    for off in (-3, 0, 3):
        ddx = hx2 + off*math.cos(a)
        ddy = hy2 + off*math.sin(a)
        box_rot(ddx, ddy, z0, z1, 1.6, 8, -28)


# ------------------------------------------------------------------
# Normal + escrita do STL
# ------------------------------------------------------------------
def normal(a, b, c):
    ux, uy, uz = b[0]-a[0], b[1]-a[1], b[2]-a[2]
    vx, vy, vz = c[0]-a[0], c[1]-a[1], c[2]-a[2]
    nx = uy*vz - uz*vy
    ny = uz*vx - ux*vz
    nz = ux*vy - uy*vx
    ln = math.sqrt(nx*nx + ny*ny + nz*nz) or 1.0
    return (nx/ln, ny/ln, nz/ln)


def escrever_ascii(path):
    with open(path, "w") as f:
        f.write("solid trofeu\n")
        for (a, b, c) in TRIS:
            n = normal(a, b, c)
            f.write("facet normal %f %f %f\n" % n)
            f.write("  outer loop\n")
            for v in (a, b, c):
                f.write("    vertex %f %f %f\n" % v)
            f.write("  endloop\n")
            f.write("endfacet\n")
        f.write("endsolid trofeu\n")


def escrever_binario(path):
    with open(path, "wb") as f:
        f.write(b"\0" * 80)                       # cabeçalho
        f.write(struct.pack("<I", len(TRIS)))     # nº de triângulos
        for (a, b, c) in TRIS:
            n = normal(a, b, c)
            f.write(struct.pack("<3f", *n))
            f.write(struct.pack("<3f", *a))
            f.write(struct.pack("<3f", *b))
            f.write(struct.pack("<3f", *c))
            f.write(struct.pack("<H", 0))


if __name__ == "__main__":
    montar()
    escrever_ascii("trofeu_melhor_sobremesa.stl")
    escrever_binario("trofeu_melhor_sobremesa_bin.stl")
    print("Triângulos gerados:", len(TRIS))
    print("Arquivos: trofeu_melhor_sobremesa.stl (ASCII) e _bin.stl (binario)")
