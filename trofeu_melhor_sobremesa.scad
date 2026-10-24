// =====================================================================
//  TROFÉU "MELHOR SOBREMESA 2026"
//  Estilo: chapéu de chef (toque) + garfo e faca cruzados
//          + porta-retrato para foto do casal/família
//
//  Feito em OpenSCAD (gratuito): https://openscad.org
//
//  COMO USAR:
//   1. Baixe e instale o OpenSCAD.
//   2. Abra este arquivo.
//   3. Aperte F5 (pré-visualizar) ou F6 (render final).
//   4. Exporte para .STL:  Arquivo > Exportar > Exportar como STL
//   5. Abra o STL no seu fatiador (Cura, PrusaSlicer, Bambu Studio).
//
//  TUDO É PARAMETRIZADO: mude os números abaixo que a peça muda sozinha.
// =====================================================================


/* ======================= PARÂMETROS GERAIS ======================= */

// Texto da placa
texto_linha1   = "MELHOR SOBREMESA";
texto_linha2   = "2026";

// Qualidade das curvas (quanto maior, mais liso e mais pesado p/ renderizar)
$fn = 80;

// Pequena folga para evitar faces coladas no preview
eps = 0.01;


/* ===================== DIMENSÕES DA BASE ========================= */
base_largura   = 90;   // X
base_profund   = 55;   // Y
base_altura    = 16;   // Z (espessura do bloco da base)
base_chanfro   = 4;    // "arredondamento" das bordas da base

// Placa de texto frontal
placa_altura   = 10;
placa_rebaixo  = 1.2;  // quanto o texto fica rebaixado/elevado
texto_elevado  = true; // true = texto em alto relevo | false = em baixo relevo
texto_tam1     = 7;    // tamanho fonte linha 1
texto_tam2     = 9;    // tamanho fonte linha 2 (o ano, maior)


/* =============== PORTA-RETRATO (moldura atrás) =================== */
porta_retrato        = true;  // true para incluir o porta-retrato
foto_largura         = 55;    // área visível da foto (X)
foto_altura          = 42;    // área visível da foto (Y)
moldura_borda        = 6;     // espessura da moldura ao redor da foto
moldura_espessura    = 7;     // espessura total da moldura (Z/profundidade)
moldura_recuo_foto   = 2.5;   // degrau onde a foto encosta
fenda_foto           = 1.2;   // folga da ranhura para enfiar a foto por cima


/* ================= CHAPÉU DE CHEF (toque) ======================= */
chef_hat        = true;
chef_base_r     = 11;   // raio da faixa/cilindro de baixo do chapéu
chef_base_h     = 10;   // altura da faixa
chef_puff_r     = 16;   // raio da parte "fofa" de cima
chef_puff_h     = 16;   // altura da parte fofa


/* ================= TALHERES CRUZADOS ============================ */
talheres        = true;
talher_comp     = 46;   // comprimento de cada talher
talher_esp      = 3.2;  // espessura (profundidade) do talher
talher_incl     = 28;   // ângulo de inclinação do "X"


/* ================================================================= */
/* =====================  MONTAGEM DA PEÇA  ======================== */
/* ================================================================= */

montar_trofeu();

module montar_trofeu() {
    // Base
    base();

    // Placa com texto na frente da base
    translate([0, -base_profund/2 - eps, base_altura/2])
        placa_texto();

    // Porta-retrato centralizado, atrás
    if (porta_retrato)
        translate([0, base_profund/2 - moldura_espessura, base_altura])
            porta_retrato_frame();

    // Chapéu de chef, no topo à esquerda
    if (chef_hat)
        translate([-base_largura/2 + chef_puff_r + 4,
                   -base_profund/2 + chef_puff_r + 2,
                   base_altura])
            chapeu_chef();

    // Talheres cruzados, apoiados na frente da base
    if (talheres)
        translate([base_largura/2 - 20, -base_profund/2 + 4, base_altura])
            talheres_cruzados();
}


/* ----------------------- BASE ARREDONDADA ----------------------- */
module base() {
    hull() {
        for (sx = [-1, 1], sy = [-1, 1])
            translate([sx*(base_largura/2 - base_chanfro),
                       sy*(base_profund/2 - base_chanfro),
                       base_chanfro])
                sphere(r = base_chanfro);
        // Cantos inferiores (base apoia plana na mesa)
        for (sx = [-1, 1], sy = [-1, 1])
            translate([sx*(base_largura/2 - base_chanfro),
                       sy*(base_profund/2 - base_chanfro),
                       0.1])
                cylinder(r = base_chanfro, h = 0.1);
    }
    // Bloco superior reto para dar altura total
    translate([0,0,base_chanfro])
        linear_extrude(base_altura - base_chanfro)
            offset(r = base_chanfro)
                square([base_largura - 2*base_chanfro,
                        base_profund - 2*base_chanfro], center = true);
}


/* ------------------- PLACA COM TEXTO ---------------------------- */
module placa_texto() {
    // Retângulo da placa
    placa_larg = base_largura * 0.78;
    color("gold")
    difference() {
        translate([-placa_larg/2, 0, -placa_altura/2 - 2])
            cube([placa_larg, placa_rebaixo, placa_altura + 4]);

        if (!texto_elevado)
            desenhar_texto(placa_rebaixo);
    }
    if (texto_elevado)
        color("gold")
        translate([0, placa_rebaixo - eps, 0])
            desenhar_texto(placa_rebaixo);
}

module desenhar_texto(prof) {
    // Texto rotacionado para ficar de pé na frente da base
    rotate([90, 0, 0])
        translate([0, 0, -prof])
        linear_extrude(prof + 0.6) {
            translate([0, texto_tam2*0.75, 0])
                text(texto_linha1, size = texto_tam1,
                     halign = "center", valign = "center",
                     font = "Liberation Sans:style=Bold");
            translate([0, -texto_tam2*0.75, 0])
                text(texto_linha2, size = texto_tam2,
                     halign = "center", valign = "center",
                     font = "Liberation Sans:style=Bold");
        }
}


/* ------------------- PORTA-RETRATO ------------------------------ */
module porta_retrato_frame() {
    larg_total = foto_largura + 2*moldura_borda;
    alt_total  = foto_altura  + 2*moldura_borda;

    difference() {
        // Bloco da moldura
        translate([-larg_total/2, 0, 0])
            cube([larg_total, moldura_espessura, alt_total]);

        // Janela da foto (vazada na frente, com degrau atrás p/ apoiar)
        translate([-foto_largura/2, -eps, moldura_borda])
            cube([foto_largura, moldura_recuo_foto + eps, foto_altura]);

        // Abertura frontal (vão onde a foto aparece)
        translate([-foto_largura/2, moldura_recuo_foto, moldura_borda])
            cube([foto_largura, moldura_espessura, foto_altura]);

        // Fenda no topo para inserir a foto deslizando por cima
        translate([-foto_largura/2 - fenda_foto/2,
                   moldura_recuo_foto - fenda_foto,
                   alt_total - moldura_borda - eps])
            cube([foto_largura + fenda_foto, fenda_foto, moldura_borda + 1]);
    }
}


/* ------------------- CHAPÉU DE CHEF ----------------------------- */
module chapeu_chef() {
    color("white") {
        // Faixa / cilindro de baixo
        cylinder(r = chef_base_r, h = chef_base_h);

        // Parte fofa de cima: 3 bolhas + cúpula central
        translate([0, 0, chef_base_h]) {
            // cúpula principal
            hull() {
                cylinder(r = chef_base_r, h = 1);
                translate([0, 0, chef_puff_h*0.6])
                    sphere(r = chef_puff_r*0.85);
            }
            // bolhas laterais para dar o volume de "nuvem"
            for (a = [0, 120, 240])
                rotate([0, 0, a])
                    translate([chef_base_r*0.55, 0, chef_puff_h*0.55])
                        sphere(r = chef_puff_r*0.55);
            // bolha do topo
            translate([0, 0, chef_puff_h])
                sphere(r = chef_puff_r*0.6);
        }
    }
}


/* ------------------- TALHERES CRUZADOS -------------------------- */
module talheres_cruzados() {
    color("silver") {
        // Faca (inclinada para um lado)
        rotate([0, 0,  talher_incl])
            translate([0, 0, 0])
                faca();
        // Garfo (inclinado para o outro lado)
        rotate([0, 0, -talher_incl])
            translate([0, 0, 0])
                garfo();
    }
}

// Cada talher fica "de pé", encostado, com leve profundidade (talher_esp)
module faca() {
    rotate([90, 0, 0])
    linear_extrude(talher_esp)
    union() {
        // cabo
        translate([-2.5, 0]) square([5, talher_comp*0.45]);
        // lâmina
        translate([0, talher_comp*0.45])
            polygon(points = [
                [-2.5, 0], [2.5, 0],
                [3.5, talher_comp*0.4], [3.5, talher_comp*0.55],
                [-3.5, talher_comp*0.55]
            ]);
    }
}

module garfo() {
    rotate([90, 0, 0])
    linear_extrude(talher_esp)
    union() {
        // cabo
        translate([-2.5, 0]) square([5, talher_comp*0.5]);
        // cabeça do garfo
        translate([-4, talher_comp*0.5]) square([8, talher_comp*0.12]);
        // dentes (3)
        for (i = [-1, 0, 1])
            translate([i*3 - 0.9, talher_comp*0.62])
                square([1.8, talher_comp*0.22]);
    }
}
