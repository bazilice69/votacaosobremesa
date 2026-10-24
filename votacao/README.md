# 🍰 Melhor Sobremesa — Votação da Família

App de votação para a competição de sobremesas. **100% offline**, roda direto no
navegador do celular. Sem servidor, sem internet obrigatória.

## As 5 abas

| Aba | O que faz |
|-----|-----------|
| ➕ **Inscrever** | Cada participante entra com **nome + sobremesa + foto**. Crianças também (marque 👶). |
| 🗳️ **Votar** | Passa de mão em mão. Cada votante digita o nome e dá **1 a 5 ⭐** por critério. **Ninguém vota na própria sobremesa** (ela nem aparece). |
| 📺 **TV** | Tela grande para **espelhar na Fire TV**. Ranking ao vivo que se atualiza sozinho. |
| 🏆 **Ranking** | Classificação detalhada + botão para **encerrar e coroar** o campeão (animação 🎉). |
| 🏛️ **Hall da Fama** | Guarda o **campeão de cada ano**. Use o mesmo app todo ano que ele acumula. |

## Critérios de votação (1 a 5 ⭐)

1. 😋 **Sabor**  — desempate 1º
2. 🥄 **Textura** — desempate 2º
3. ✨ **Aparência** — desempate 3º
4. 💡 **Criatividade** — desempate 4º

> **Desempate:** se empatar na média geral, ganha quem tiver maior nota em Sabor;
> depois Textura, Aparência, Criatividade e, por fim, mais votos.

## Fluxo da festa

1. **Inscrever** todas as sobremesas (foto incluída).
2. **Espelhar o celular na Fire TV** e abrir a aba **TV**.
3. Passar o celular (ou um 2º aparelho) para todo mundo **Votar** — a TV atualiza ao vivo.
4. No fim, aba **Ranking → "Encerrar votação"** → animação de **CAMPEÃO** 👑.
5. O campeão entra automaticamente no **Hall da Fama** do ano.

## Ano que vem

- Na aba **Hall da Fama**, ajuste o **ano** e use **"Iniciar novo ano"** — isso limpa
  inscrições/votos mas **mantém o Hall da Fama** (histórico de campeões).

## Detalhes técnicos

- Dados salvos no próprio aparelho (localStorage); fotos comprimidas automaticamente.
- Cada pessoa vota 1 vez (pode refazer, substitui o voto anterior).
- O espaço do **boneco animado** do campeão já está reservado no código (`#boneco-slot`)
  para quando você quiser adicionar.

> ⚠️ Como é offline, os votos ficam no aparelho onde foram feitos. Modelo ideal:
> **um celular oficial da votação** que passa de mão em mão (e é esse que você espelha na TV).
