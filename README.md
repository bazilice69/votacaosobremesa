# 🍰 Melhor Sobremesa — Competição da Família

Projeto da competição de sobremesas de fim de ano: **votação** + **troféu 3D** + **mascote chef**.

## 📁 O que tem aqui

### 1. `votacao/` — Versão LINK (celular + PC, idêntica) ⭐
Roda **direto no navegador**, sem instalar nada. Serve tanto no **celular** quanto no **PC**
(layout responsivo — a mesma aplicação se adapta à tela).

**Abra por aqui:** https://bazilice69.github.io/votacaosobremesa/votacao/

- Inscrever (Sozinho 🧑 ou Dupla/Casal 💑) com foto
- Votar por 4 critérios (Sabor, Textura, Aparência, Criatividade — 1 a 5 ⭐)
- Ranking + **coroação com o mascote em vídeo**, pódio 🥇🥈🥉, confete e **som de fanfarra**
- Hall da Fama (campeões por ano)
- *Dados ficam no próprio aparelho — ideal: 1 aparelho oficial que passa de mão.*

### 2. `votacao-rede/` — Versão REDE LOCAL (cada um no seu celular)
Roda num **notebook** com Node.js. Todos na mesma Wi-Fi votam no próprio celular e a
**TV abre um link** com o ranking ao vivo. Veja o `README` dentro da pasta.

### 3. Troféu 3D
- `trofeu_melhor_sobremesa.scad` — modelo paramétrico (OpenSCAD)
- `trofeu_melhor_sobremesa_bin.stl` — pronto para visualizar/imprimir

## 🎬 Mascote
O chef campeão (`mascote.mp4`) aparece **grande**, falando, no momento da coroação.

## Qual versão usar?
- **Testar / festa simples** → versão LINK (`votacao/`)
- **Cada um no próprio celular, com TV ao vivo** → versão REDE LOCAL (`votacao-rede/`) no notebook
