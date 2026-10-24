# 🍰 Melhor Sobremesa — Votação em REDE LOCAL (Wi-Fi)

Cada pessoa vota **no próprio celular**. A TV abre um link e mostra o ranking **ao vivo**.
Tudo roda num **notebook** na mesma Wi-Fi — **sem internet** e **sem instalar pacotes**.

## ✅ O que precisa

- Um **notebook** (Windows, Mac ou Linux) com **Node.js** instalado → https://nodejs.org (versão LTS).
- Todos (celulares + notebook + Fire TV) na **mesma rede Wi-Fi**.
  - *Sem Wi-Fi no sítio?* Crie um **hotspot no notebook** (ou no celular) e conecte todo mundo nele. Funciona sem internet.

## ▶️ Como rodar

1. Baixe esta pasta `votacao-rede` para o notebook.
2. Abra o terminal nessa pasta e rode:
   ```
   node servidor.js
   ```
3. O terminal mostra 3 endereços (com o IP do notebook). Exemplo:
   ```
   Celulares (votar) :  http://192.168.0.12:3000/
   TV (ranking)      :  http://192.168.0.12:3000/tv
   Admin (você)      :  http://192.168.0.12:3000/admin
   ```
4. Compartilhe o endereço **/** com a galera (WhatsApp da família), abra **/tv** na Fire TV
   e deixe **/admin** aberto no seu aparelho.

## 👥 Como funciona

- **Inscrever**: cada um coloca nome + sobremesa + foto. Casal? Preencha o **2º nome**.
  Criança? Marque 👶.
- **Votar**: a pessoa **escolhe o próprio nome numa lista** (não digita à toa).
  - Isso impede **voto fantasma** e garante o **bloqueio da própria sobremesa**
    — inclusive para **os dois nomes de um casal**.
  - Quem não inscreveu sobremesa entra como **"convidado"** e vota em todos.
- **Critérios (1 a 5 ⭐)**: 😋 Sabor · 🥄 Textura · ✨ Aparência · 💡 Criatividade.
  - **Desempate**: Sabor › Textura › Aparência › Criatividade › mais votos.
- **TV**: ranking ao vivo, atualiza sozinho a cada 2s.
- **Admin**: abrir inscrição/votação, **encerrar e coroar** (a TV mostra a animação 👑),
  Hall da Fama por ano, e **🧪 dados de exemplo** para testar.

## 🧪 Testar em casa (antes do dia)

1. `node servidor.js`
2. Abra **/admin** e clique em **"Carregar dados de EXEMPLO"** — entra com participantes e
   votos fictícios na hora.
3. Abra **/tv** noutra aba para ver o ranking.
4. Clique em **"Encerrar e coroar"** para ver a animação do campeão.
5. Para limpar: **/admin → "Apagar TUDO"**.

## Observações

- Os dados ficam no arquivo `dados.json` (criado ao lado do `servidor.js`).
- Espaço para um **boneco animado** do campeão já reservado em `tv.html` (`#boneco-slot`).
