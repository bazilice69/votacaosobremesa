/* ====================================================================
   MELHOR SOBREMESA 2026 — sistema de votação offline
   Tudo roda no navegador, dados salvos no localStorage (inclui fotos).
   Fluxo:
     1) Participante se cadastra: nome + sobremesa + FOTO
     2) Todo mundo vota (passa o aparelho), dando notas por quesito
     3) Ranking ao vivo + campeão
   ==================================================================== */

"use strict";

/* -------------------- QUESITOS -------------------- */
const QUESITOS = [
  { id:"sabor",       nome:"Sabor",       emoji:"😋" },
  { id:"aparencia",   nome:"Aparência",   emoji:"✨" },
  { id:"criatividade",nome:"Criatividade",emoji:"💡" },
];

/* -------------------- STORAGE -------------------- */
const CHAVE = "melhor_sobremesa_2026";
let estado = carregar();

function carregar(){
  try{
    const raw = localStorage.getItem(CHAVE);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return { sobremesas:[], votos:[] };
  // sobremesa = { id, participante, nome, foto(dataURL ou ""), }
  // voto      = { votante, sobremesaId, notas:{...} }
}
function salvar(){
  try{ localStorage.setItem(CHAVE, JSON.stringify(estado)); }
  catch(e){ aviso("⚠️ Memória cheia. Tente fotos menores ou remova alguma sobremesa."); }
}
function id(){ return Math.random().toString(36).slice(2,9); }

/* -------------------- ROTEADOR -------------------- */
const app = document.getElementById("app");
let telaAtual = "votar";

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("ativo"));
    btn.classList.add("ativo");
    telaAtual = btn.dataset.tela;
    render();
  });
});
function irPara(tela){
  telaAtual=tela;
  document.querySelectorAll(".tab").forEach(b=>
    b.classList.toggle("ativo", b.dataset.tela===tela));
  render();
}
function render(){
  if(telaAtual==="votar")     telaVotar();
  if(telaAtual==="ranking")   telaRanking();
  if(telaAtual==="cadastrar") telaCadastrar();
}

/* ==================================================================
   TELA — CADASTRAR SOBREMESA (o próprio participante)
   ================================================================== */
function telaCadastrar(){
  const itens = estado.sobremesas.map(s=>`
    <div class="card">
      <div class="card-topo">
        ${s.foto
          ? `<img class="foto-mini" src="${s.foto}" alt="">`
          : `<div class="emoji-grande">🍰</div>`}
        <div style="flex:1">
          <div class="card-nome">${esc(s.nome||"(sem nome)")}</div>
          <div class="card-casal">por ${esc(s.participante||"?")}</div>
        </div>
        <button class="btn btn-cinza btn-sm" data-del="${s.id}">🗑️</button>
      </div>
    </div>`).join("");

  app.innerHTML = `
    <h2 class="titulo">🍰 Inscreva sua sobremesa</h2>
    <p class="dica">Cada pessoa coloca o <b>seu nome</b>, o <b>nome da sobremesa</b> e uma <b>foto</b>. Pode entrar quanta gente quiser!</p>

    <div class="card">
      <label>Seu nome</label>
      <input type="text" id="c-part" placeholder="Ex.: João" autocomplete="off">

      <label>Nome da sobremesa</label>
      <input type="text" id="c-nome" placeholder="Ex.: Pavê de Chocolate" autocomplete="off">

      <label>Foto da sobremesa</label>
      <div class="foto-area" id="foto-area">
        <span>📷 Toque para tirar foto<br><small>ou escolher da galeria</small></span>
        <img id="foto-preview" style="display:none">
      </div>
      <input type="file" id="c-foto" accept="image/*" capture="environment" hidden>

      <div style="height:12px"></div>
      <button class="btn btn-rosa" id="btn-inscrever">➕ Inscrever sobremesa</button>
    </div>

    <h2 class="titulo" style="margin-top:20px">Inscritas (${estado.sobremesas.length})</h2>
    ${itens || vazio("🍽️","Nenhuma ainda","Seja o primeiro a se inscrever acima!")}
    ${estado.sobremesas.length? `<button class="btn btn-cinza" id="btn-reset-tudo">♻️ Apagar tudo e recomeçar</button>`:""}
  `;

  // ---- foto ----
  let fotoData = "";
  const fileInp = document.getElementById("c-foto");
  const area = document.getElementById("foto-area");
  const prev = document.getElementById("foto-preview");
  area.onclick = ()=> fileInp.click();
  fileInp.onchange = ()=>{
    const f = fileInp.files[0];
    if(!f) return;
    comprimirImagem(f, 800, 0.72, (dataUrl)=>{
      fotoData = dataUrl;
      prev.src = dataUrl; prev.style.display="block";
      area.querySelector("span").style.display="none";
    });
  };

  // ---- inscrever ----
  document.getElementById("btn-inscrever").onclick = ()=>{
    const part = document.getElementById("c-part").value.trim();
    const nome = document.getElementById("c-nome").value.trim();
    if(!part){ aviso("Digite o seu nome."); return; }
    if(!nome){ aviso("Digite o nome da sobremesa."); return; }
    estado.sobremesas.push({ id:id(), participante:part, nome, foto:fotoData });
    salvar();
    aviso(`Sobremesa "${esc(nome)}" inscrita! 🎉`,()=>render());
  };

  // ---- apagar item ----
  app.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick=()=>confirmar("Remover esta sobremesa? Os votos dela também somem.",()=>{
      const sid=b.dataset.del;
      estado.sobremesas=estado.sobremesas.filter(x=>x.id!==sid);
      estado.votos=estado.votos.filter(v=>v.sobremesaId!==sid);
      salvar(); render();
    });
  });
  const rt=document.getElementById("btn-reset-tudo");
  if(rt) rt.onclick=()=>confirmar("Apagar TODAS as sobremesas e votos?",()=>{
    estado={sobremesas:[],votos:[]}; salvar(); render();
  });
}

/* comprime a foto para não estourar o localStorage */
function comprimirImagem(file, maxLado, qualidade, cb){
  const reader = new FileReader();
  reader.onload = e=>{
    const img = new Image();
    img.onload = ()=>{
      let {width:w, height:h} = img;
      if(w>h && w>maxLado){ h=h*maxLado/w; w=maxLado; }
      else if(h>maxLado){ w=w*maxLado/h; h=maxLado; }
      const cv=document.createElement("canvas");
      cv.width=w; cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      cb(cv.toDataURL("image/jpeg",qualidade));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ==================================================================
   TELA — VOTAR
   ================================================================== */
let votanteAtual = "";
let notasTemp = {};

function telaVotar(){
  if(estado.sobremesas.length < 1){
    app.innerHTML = vazio("🍽️","Nenhuma sobremesa inscrita",
      "Vá em <b>Inscrever</b> e cadastre os pratos da competição.")
      + `<button class="btn btn-rosa" id="ir-cad">Ir para inscrição ➕</button>`;
    document.getElementById("ir-cad").onclick=()=>irPara("cadastrar");
    return;
  }

  // passo 1 — nome do votante
  if(!votanteAtual){
    app.innerHTML = `
      <h2 class="titulo">Quem está votando?</h2>
      <p class="dica">Digite seu nome e passe o aparelho de pessoa em pessoa.</p>
      <div class="card">
        <label>Seu nome</label>
        <input type="text" id="nome-votante" placeholder="Ex.: Tia Marta" autocomplete="off">
        <div style="height:12px"></div>
        <button class="btn btn-rosa" id="btn-comecar">Começar a votar 🗳️</button>
      </div>
      ${listaJaVotaram()}
    `;
    document.getElementById("btn-comecar").onclick = ()=>{
      const v = document.getElementById("nome-votante").value.trim();
      if(!v){ aviso("Digite seu nome para votar."); return; }
      if(jaVotou(v)){
        confirmar(`"${esc(v)}" já votou. Votar de novo (substitui o voto anterior)?`,()=>{
          estado.votos = estado.votos.filter(x=>norm(x.votante)!==norm(v));
          salvar(); iniciar(v);
        });
        return;
      }
      iniciar(v);
    };
    return;
  }

  // passo 2 — notas
  const cards = estado.sobremesas.map(cardVoto).join("");
  app.innerHTML = `
    <h2 class="titulo">Olá, ${esc(votanteAtual)}! 👋</h2>
    <p class="dica">Dê de 1 a 5 ⭐ em cada quesito. Na sua própria sobremesa, é só não dar nota.</p>
    ${cards}
    <button class="btn btn-verde" id="btn-enviar">Enviar meu voto ✅</button>
    <button class="btn btn-cinza" id="btn-trocar-nome">Trocar de votante</button>
  `;

  app.querySelectorAll(".estrelas").forEach(row=>{
    const sid=row.dataset.sid, q=row.dataset.q;
    row.querySelectorAll("span").forEach((st,i)=>{
      st.onclick=()=>{
        notasTemp[sid]=notasTemp[sid]||{};
        notasTemp[sid][q]=i+1;
        pintarEstrelas(row,i+1);
      };
    });
  });
  document.getElementById("btn-enviar").onclick = enviarVoto;
  document.getElementById("btn-trocar-nome").onclick = ()=>{ votanteAtual=""; notasTemp={}; render(); };
}

function iniciar(nome){ votanteAtual=nome; notasTemp={}; render(); }

function cardVoto(s){
  const quesitos = QUESITOS.map(q=>`
    <div class="quesito">
      <div class="quesito-nome"><span>${q.emoji} ${q.nome}</span></div>
      <div class="estrelas" data-sid="${s.id}" data-q="${q.id}">
        ${[0,0,0,0,0].map(()=>`<span>⭐</span>`).join("")}
      </div>
    </div>`).join("");
  return `
    <div class="card">
      <div class="card-topo">
        ${s.foto?`<img class="foto-mini" src="${s.foto}" alt="">`:`<div class="emoji-grande">🍰</div>`}
        <div>
          <div class="card-nome">${esc(s.nome)}</div>
          <div class="card-casal">por ${esc(s.participante)}</div>
        </div>
      </div>
      ${quesitos}
    </div>`;
}

function pintarEstrelas(row,n){
  row.querySelectorAll("span").forEach((st,i)=>st.classList.toggle("on", i<n));
}

function enviarVoto(){
  const avaliadas = Object.keys(notasTemp);
  if(avaliadas.length===0){ aviso("Dê pelo menos uma nota antes de enviar. 😉"); return; }
  avaliadas.forEach(sid=>{
    const notas={};
    QUESITOS.forEach(q=> notas[q.id]= notasTemp[sid][q.id]||0 );
    if(QUESITOS.reduce((a,q)=>a+notas[q.id],0)>0)
      estado.votos.push({ votante:votanteAtual, sobremesaId:sid, notas });
  });
  salvar();
  const nome=votanteAtual; votanteAtual=""; notasTemp={};
  aviso(`Voto de ${esc(nome)} registrado! 🎉 Passe o aparelho para o próximo.`,()=>render());
}

function listaJaVotaram(){
  const nomes=[...new Set(estado.votos.map(v=>v.votante))];
  if(!nomes.length) return "";
  return `<div class="card">
    <div class="card-nome" style="font-size:.95rem;margin-bottom:8px;">Já votaram (${nomes.length})</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${nomes.map(n=>`<span class="badge-ok">✓ ${esc(n)}</span>`).join("")}
    </div></div>`;
}
function jaVotou(nome){ return estado.votos.some(v=>norm(v.votante)===norm(nome)); }

/* ==================================================================
   TELA — RANKING
   ================================================================== */
function telaRanking(){
  if(estado.sobremesas.length===0){
    app.innerHTML = `<h2 class="titulo">🏆 Ranking</h2>`+
      vazio("🏆","Sem sobremesas ainda","Cadastre os pratos para ver o ranking.");
    return;
  }
  if(estado.votos.length===0){
    app.innerHTML = `<h2 class="titulo">🏆 Ranking</h2>`+
      vazio("🗳️","Ainda sem votos","Vá em <b>Votar</b> para começar a competição!");
    return;
  }

  const rank = calcularRanking();
  const totalVotantes=[...new Set(estado.votos.map(v=>v.votante))].length;
  let html=`<h2 class="titulo">🏆 Ranking ao vivo</h2>
    <p class="dica">${totalVotantes} pessoa(s) já votaram · nota média de 0 a 5</p>`;

  rank.forEach((r,i)=>{
    const pos = i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}º`;
    const campeao = i===0 && r.media>0;
    html += `
      <div class="card ${campeao?'campeao':''}">
        ${campeao?`<div class="coroa confete">👑</div><div class="faixa-campeao">CAMPEÃ(O)!</div>`:""}
        <div class="rank-item">
          <div class="rank-pos">${pos}</div>
          ${r.foto?`<img class="foto-mini" src="${r.foto}">`:`<div class="emoji-grande">🍰</div>`}
          <div class="rank-info">
            <div class="card-nome">${esc(r.nome)}</div>
            <div class="card-casal">por ${esc(r.participante)} · ${r.nvotos} voto(s)</div>
            <div class="barra"><i style="width:${(r.media/5*100).toFixed(0)}%"></i></div>
          </div>
          <div class="rank-nota">${r.media.toFixed(2)}</div>
        </div>
      </div>`;
  });

  html += `<button class="btn btn-cinza" id="btn-zerar-votos">🗑️ Zerar votos (recomeçar votação)</button>`;
  app.innerHTML = html;
  document.getElementById("btn-zerar-votos").onclick=()=>
    confirmar("Apagar TODOS os votos? As sobremesas continuam inscritas.",()=>{
      estado.votos=[]; salvar(); render();
    });
}

function calcularRanking(){
  const lista = estado.sobremesas.map(s=>{
    const votos = estado.votos.filter(v=>v.sobremesaId===s.id);
    let soma=0;
    votos.forEach(v=>{
      const notas=QUESITOS.map(q=>v.notas[q.id]).filter(n=>n>0);
      soma += notas.length? notas.reduce((a,b)=>a+b,0)/notas.length : 0;
    });
    return { ...s, nvotos:votos.length, media: votos.length? soma/votos.length : 0 };
  });
  return lista.sort((a,b)=> b.media-a.media || b.nvotos-a.nvotos);
}

/* ==================================================================
   HELPERS
   ================================================================== */
function vazio(emoji,titulo,txt){
  return `<div class="vazio"><span class="big">${emoji}</span>
    <b>${titulo}</b><br><span style="font-size:.85rem">${txt}</span></div>`;
}
function esc(s){ return String(s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function norm(s){ return String(s||"").trim().toLowerCase(); }

const modal=document.getElementById("modal");
const modalTexto=document.getElementById("modal-texto");
const btnOk=document.getElementById("modal-ok");
const btnCancel=document.getElementById("modal-cancelar");
function aviso(txt,cb){
  modalTexto.innerHTML=txt; btnCancel.style.display="none"; btnOk.textContent="OK";
  modal.classList.remove("escondido");
  btnOk.onclick=()=>{ modal.classList.add("escondido"); if(cb)cb(); };
}
function confirmar(txt,cb){
  modalTexto.innerHTML=txt; btnCancel.style.display=""; btnOk.textContent="Confirmar";
  modal.classList.remove("escondido");
  btnOk.onclick=()=>{ modal.classList.add("escondido"); cb(); };
  btnCancel.onclick=()=>modal.classList.add("escondido");
}

render();
