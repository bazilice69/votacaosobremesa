/* ====================================================================
   MELHOR SOBREMESA — sistema de votação offline (familiar)
   Tudo no navegador, dados no localStorage.

   Recursos:
   - Participantes se inscrevem (nome + sobremesa + foto). Crianças também.
   - Voto por 4 critérios (1-5 estrelas): Sabor, Textura, Aparência, Criatividade
   - NÃO é possível votar na própria sobremesa (bloqueio real)
   - Vários votantes no mesmo aparelho (passa de mão em mão)
   - Modo TV (Fire TV): ranking grande ao vivo
   - Encerrar votação -> animação de CAMPEÃO (slot p/ boneco futuro)
   - Hall da Fama: guarda campeão/sobremesa/foto por ANO (acumula)
   ==================================================================== */

"use strict";

/* -------------------- CRITÉRIOS (ordem = desempate) -------------------- */
const QUESITOS = [
  { id:"sabor",       nome:"Sabor",       emoji:"😋" }, // desempate 1º
  { id:"textura",     nome:"Textura",     emoji:"🥄" }, // desempate 2º
  { id:"aparencia",   nome:"Aparência",   emoji:"✨" }, // desempate 3º
  { id:"criatividade",nome:"Criatividade",emoji:"💡" }, // desempate 4º
];

const ANO = new Date().getFullYear(); // ano corrente p/ o hall da fama

/* -------------------- STORAGE -------------------- */
const CHAVE = "melhor_sobremesa_app";
let estado = carregar();

function carregar(){
  try{
    const raw = localStorage.getItem(CHAVE);
    if(raw) return migrar(JSON.parse(raw));
  }catch(e){}
  return { ano:ANO, sobremesas:[], votos:[], hall:[] };
}
function migrar(e){
  // garante campos novos em bases antigas
  e.ano = e.ano || ANO;
  e.sobremesas = e.sobremesas || [];
  e.votos = e.votos || [];
  e.hall = e.hall || [];
  return e;
}
function salvar(){
  try{ localStorage.setItem(CHAVE, JSON.stringify(estado)); }
  catch(e){ aviso("⚠️ Memória cheia. Use fotos menores ou remova alguma sobremesa."); }
}
function id(){ return Math.random().toString(36).slice(2,9); }

document.getElementById("ano-topo").textContent = estado.ano;

/* -------------------- ROTEADOR -------------------- */
const app = document.getElementById("app");
let telaAtual = "votar";

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>irPara(btn.dataset.tela));
});
function irPara(tela){
  telaAtual=tela;
  document.querySelectorAll(".tab").forEach(b=>
    b.classList.toggle("ativo", b.dataset.tela===tela));
  render();
}
function render(){
  if(telaAtual==="cadastrar") telaCadastrar();
  if(telaAtual==="votar")     telaVotar();
  if(telaAtual==="tv")        telaTV();
  if(telaAtual==="ranking")   telaRanking();
  if(telaAtual==="hall")      telaHall();
}

/* ==================================================================
   TELA — INSCREVER (nome + sobremesa + foto). Crianças também.
   ================================================================== */
function telaCadastrar(){
  const itens = estado.sobremesas.map(s=>`
    <div class="card">
      <div class="card-topo">
        ${s.foto?`<img class="foto-mini" src="${s.foto}" alt="">`:`<div class="emoji-grande">🍰</div>`}
        <div style="flex:1">
          <div class="card-nome">${esc(s.nome||"(sem nome)")}</div>
          <div class="card-casal">por ${esc(nomesDe(s))} ${s.crianca?"👶":""}</div>
        </div>
        <button class="btn btn-cinza btn-sm" data-del="${s.id}">🗑️</button>
      </div>
    </div>`).join("");

  app.innerHTML = `
    <h2 class="titulo">🍰 Inscreva sua sobremesa</h2>
    <p class="dica">Pode competir <b>sozinho(a)</b> ou em <b>dupla/casal</b>. Escolha abaixo. 👇</p>

    <div class="card">
      <label>Quem vai competir?</label>
      <div class="segmento">
        <button type="button" class="seg-btn ativo" data-tipo="solo">🧑 Sozinho(a)</button>
        <button type="button" class="seg-btn" data-tipo="dupla">💑 Casal / Dupla</button>
      </div>

      <label id="lbl-part">Nome</label>
      <input type="text" id="c-part" placeholder="Ex.: João" autocomplete="off">

      <div id="box-part2" style="display:none">
        <label>Nome da 2ª pessoa</label>
        <input type="text" id="c-part2" placeholder="Ex.: Maria" autocomplete="off">
      </div>

      <label>Nome da sobremesa</label>
      <input type="text" id="c-nome" placeholder="Ex.: Pavê de Chocolate" autocomplete="off">

      <label class="check-linha">
        <input type="checkbox" id="c-crianca"> 👶 É uma criança
      </label>

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
    ${estado.sobremesas.length? `<button class="btn btn-cinza" id="btn-reset-tudo">♻️ Apagar inscrições e votos</button>`:""}
  `;

  // alterna entre Sozinho e Dupla
  let tipo="solo";
  app.querySelectorAll(".seg-btn").forEach(b=>b.onclick=()=>{
    tipo=b.dataset.tipo;
    app.querySelectorAll(".seg-btn").forEach(x=>x.classList.toggle("ativo",x===b));
    document.getElementById("box-part2").style.display = tipo==="dupla"?"block":"none";
    document.getElementById("lbl-part").textContent = tipo==="dupla"?"Nome da 1ª pessoa":"Nome";
  });

  let fotoData = "";
  const fileInp=document.getElementById("c-foto");
  const area=document.getElementById("foto-area");
  const prev=document.getElementById("foto-preview");
  area.onclick=()=>fileInp.click();
  fileInp.onchange=()=>{
    const f=fileInp.files[0]; if(!f) return;
    comprimirImagem(f,800,0.72,d=>{
      fotoData=d; prev.src=d; prev.style.display="block";
      area.querySelector("span").style.display="none";
    });
  };

  document.getElementById("btn-inscrever").onclick=()=>{
    const part=document.getElementById("c-part").value.trim();
    const part2=tipo==="dupla"? document.getElementById("c-part2").value.trim() : "";
    const nome=document.getElementById("c-nome").value.trim();
    const crianca=document.getElementById("c-crianca").checked;
    if(!part){ aviso(tipo==="dupla"?"Digite o nome da 1ª pessoa.":"Digite o nome."); return; }
    if(tipo==="dupla" && !part2){ aviso("Digite o nome da 2ª pessoa (ou mude para Sozinho)."); return; }
    if(!nome){ aviso("Digite o nome da sobremesa."); return; }
    estado.sobremesas.push({ id:id(), participante:part, participante2:part2, nome, foto:fotoData, crianca });
    salvar();
    aviso(`Sobremesa "${esc(nome)}" inscrita! 🎉`,()=>render());
  };

  app.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick=()=>confirmar("Remover esta sobremesa? Os votos dela também somem.",()=>{
      const sid=b.dataset.del;
      estado.sobremesas=estado.sobremesas.filter(x=>x.id!==sid);
      estado.votos=estado.votos.filter(v=>v.sobremesaId!==sid);
      salvar(); render();
    });
  });
  const rt=document.getElementById("btn-reset-tudo");
  if(rt) rt.onclick=()=>confirmar("Apagar todas as inscrições e votos deste ano? (O Hall da Fama é mantido.)",()=>{
    estado.sobremesas=[]; estado.votos=[]; salvar(); render();
  });
}

function comprimirImagem(file,maxLado,q,cb){
  const r=new FileReader();
  r.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      let {width:w,height:h}=img;
      if(w>h&&w>maxLado){h=h*maxLado/w;w=maxLado;}
      else if(h>maxLado){w=w*maxLado/h;h=maxLado;}
      const cv=document.createElement("canvas");
      cv.width=w;cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      cb(cv.toDataURL("image/jpeg",q));
    };
    img.src=e.target.result;
  };
  r.readAsDataURL(file);
}

/* ==================================================================
   TELA — VOTAR (não mostra a própria sobremesa)
   ================================================================== */
let votanteAtual="";
let votanteEhSobremesaId=""; // id da sobremesa do próprio votante (p/ esconder)
let notasTemp={};

function telaVotar(){
  if(estado.sobremesas.length<1){
    app.innerHTML=vazio("🍽️","Nenhuma sobremesa inscrita","Vá em <b>Inscrever</b> e cadastre os pratos.")
      +`<button class="btn btn-rosa" id="ir-cad">Ir para inscrição ➕</button>`;
    document.getElementById("ir-cad").onclick=()=>irPara("cadastrar");
    return;
  }

  if(!votanteAtual){
    const pessoas=listaVotantes();
    app.innerHTML=`
      <h2 class="titulo">Quem está votando?</h2>
      <p class="dica">Toque no seu nome. Assim ninguém vota na própria sobremesa por engano. 😉</p>
      <div class="card">
        ${pessoas.map(p=>`<button class="btn btn-cinza btn-pessoa" data-nome="${esc(p.nome)}" style="text-align:left;margin-bottom:8px">👤 ${esc(p.nome)}${jaVotou(p.nome)?' <span class="badge-ok">✓ votou</span>':''}</button>`).join("")}
        <hr style="border:none;border-top:1px solid #eedbe4;margin:12px 0">
        <button class="btn btn-rosa" id="conv">🙋 Sou convidado (não inscrevi sobremesa)</button>
      </div>
      ${listaJaVotaram()}
    `;
    app.querySelectorAll(".btn-pessoa").forEach(b=>b.onclick=()=>{
      const v=b.dataset.nome;
      if(jaVotou(v)){
        confirmar(`"${esc(v)}" já votou. Votar de novo (substitui o voto anterior)?`,()=>{
          estado.votos=estado.votos.filter(x=>norm(x.votante)!==norm(v));
          salvar(); iniciar(v);
        });
        return;
      }
      iniciar(v);
    });
    document.getElementById("conv").onclick=()=>{
      const area=document.getElementById("app");
      const v=prompt("Qual o seu nome? (você vai poder votar em todas as sobremesas)");
      if(!v||!v.trim())return;
      const nome=v.trim();
      if(jaVotou(nome)){
        confirmar(`"${esc(nome)}" já votou. Votar de novo?`,()=>{
          estado.votos=estado.votos.filter(x=>norm(x.votante)!==norm(nome));
          salvar(); iniciar(nome);
        });
        return;
      }
      iniciar(nome);
    };
    return;
  }

  // sobremesas que ESTE votante pode avaliar (exclui a própria — considera casal)
  const votaveis = estado.sobremesas.filter(s=>
    norm(s.participante)!==norm(votanteAtual) && norm(s.participante2)!==norm(votanteAtual));

  if(votaveis.length===0){
    app.innerHTML=`
      <h2 class="titulo">Olá, ${esc(votanteAtual)}! 👋</h2>
      ${vazio("🙂","Nada para votar","A única sobremesa inscrita é a sua — e ninguém vota na própria. Espere mais inscrições!")}
      <button class="btn btn-cinza" id="btn-trocar-nome">Trocar de votante</button>`;
    document.getElementById("btn-trocar-nome").onclick=()=>{votanteAtual="";notasTemp={};render();};
    return;
  }

  const cards=votaveis.map(cardVoto).join("");
  app.innerHTML=`
    <h2 class="titulo">Olá, ${esc(votanteAtual)}! 👋</h2>
    <p class="dica">Dê de 1 a 5 ⭐ em cada critério.</p>
    ${cards}
    <button class="btn btn-verde" id="btn-enviar">Enviar meu voto ✅</button>
    <button class="btn btn-cinza" id="btn-trocar-nome">Trocar de votante</button>
  `;

  app.querySelectorAll(".estrelas").forEach(row=>{
    const sid=row.dataset.sid,q=row.dataset.q;
    row.querySelectorAll("span").forEach((st,i)=>{
      st.onclick=()=>{
        notasTemp[sid]=notasTemp[sid]||{};
        notasTemp[sid][q]=i+1;
        pintarEstrelas(row,i+1);
      };
    });
  });
  document.getElementById("btn-enviar").onclick=enviarVoto;
  document.getElementById("btn-trocar-nome").onclick=()=>{votanteAtual="";notasTemp={};render();};
}

// lista de pessoas que podem votar (separa os dois nomes de uma dupla)
function listaVotantes(){
  const set=new Map();
  estado.sobremesas.forEach(s=>{
    [s.participante, s.participante2].forEach(p=>{
      if(p && p.trim()) set.set(norm(p), {nome:p.trim(), sobremesaId:s.id});
    });
  });
  return [...set.values()];
}
// nomes de uma sobremesa (solo ou dupla) para exibição
function nomesDe(s){ const p=s.participante||"?"; return s.participante2? (p+" & "+s.participante2) : p; }
// a sobremesa que pertence a este votante (considera os dois nomes da dupla)
function sobremesaDoVotante(nome){
  return estado.sobremesas.find(s=>
    norm(s.participante)===norm(nome) || norm(s.participante2)===norm(nome));
}

function iniciar(nome){
  votanteAtual=nome;
  notasTemp={};
  const minha=sobremesaDoVotante(nome);
  votanteEhSobremesaId = minha? minha.id : "";
  render();
}

function cardVoto(s){
  const quesitos=QUESITOS.map(q=>`
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
          <div class="card-casal">por ${esc(nomesDe(s))} ${s.crianca?"👶":""}</div>
        </div>
      </div>
      ${quesitos}
    </div>`;
}
function pintarEstrelas(row,n){ row.querySelectorAll("span").forEach((st,i)=>st.classList.toggle("on",i<n)); }

function enviarVoto(){
  const avaliadas=Object.keys(notasTemp);
  if(avaliadas.length===0){ aviso("Dê pelo menos uma nota antes de enviar. 😉"); return; }
  avaliadas.forEach(sid=>{
    if(sid===votanteEhSobremesaId) return; // bloqueio real (própria sobremesa / dupla)
    const notas={};
    QUESITOS.forEach(q=> notas[q.id]=notasTemp[sid][q.id]||0 );
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
   RANKING / DESEMPATE
   ================================================================== */
function calcularRanking(){
  const lista=estado.sobremesas.map(s=>{
    const votos=estado.votos.filter(v=>v.sobremesaId===s.id);
    // média por critério
    const porCrit={};
    QUESITOS.forEach(q=>{
      const ns=votos.map(v=>v.notas[q.id]).filter(n=>n>0);
      porCrit[q.id]= ns.length? ns.reduce((a,b)=>a+b,0)/ns.length : 0;
    });
    // média geral = média das notas válidas de todos critérios
    const todas=[];
    votos.forEach(v=>QUESITOS.forEach(q=>{ if(v.notas[q.id]>0) todas.push(v.notas[q.id]); }));
    const media= todas.length? todas.reduce((a,b)=>a+b,0)/todas.length : 0;
    return { ...s, nvotos:votos.length, media, porCrit };
  });
  // ordenação com desempate por critério na ordem de QUESITOS, depois nº votos
  lista.sort((a,b)=>{
    if(b.media!==a.media) return b.media-a.media;
    for(const q of QUESITOS){
      if(b.porCrit[q.id]!==a.porCrit[q.id]) return b.porCrit[q.id]-a.porCrit[q.id];
    }
    return b.nvotos-a.nvotos;
  });
  return lista;
}

function telaRanking(){
  if(estado.sobremesas.length===0){
    app.innerHTML=`<h2 class="titulo">🏆 Ranking</h2>`+vazio("🏆","Sem sobremesas ainda","Cadastre os pratos para ver o ranking.");
    return;
  }
  if(estado.votos.length===0){
    app.innerHTML=`<h2 class="titulo">🏆 Ranking</h2>`+vazio("🗳️","Ainda sem votos","Vá em <b>Votar</b> para começar!");
    return;
  }
  const rank=calcularRanking();
  const totalVotantes=[...new Set(estado.votos.map(v=>v.votante))].length;
  let html=`<h2 class="titulo">🏆 Ranking ao vivo</h2>
    <p class="dica">${totalVotantes} votante(s) · nota média de 0 a 5 · desempate por Sabor › Textura › Aparência › Criatividade</p>`;

  rank.forEach((r,i)=>{
    const pos=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}º`;
    const campeao=i===0&&r.media>0;
    html+=`
      <div class="card ${campeao?'campeao':''}">
        ${campeao?`<div class="coroa">👑</div><div class="faixa-campeao">LIDERANDO!</div>`:""}
        <div class="rank-item">
          <div class="rank-pos">${pos}</div>
          ${r.foto?`<img class="foto-mini" src="${r.foto}">`:`<div class="emoji-grande">🍰</div>`}
          <div class="rank-info">
            <div class="card-nome">${esc(r.nome)}</div>
            <div class="card-casal">por ${esc(nomesDe(r))} ${r.crianca?"👶":""} · ${r.nvotos} voto(s)</div>
            <div class="barra"><i style="width:${(r.media/5*100).toFixed(0)}%"></i></div>
          </div>
          <div class="rank-nota">${r.media.toFixed(2)}</div>
        </div>
      </div>`;
  });

  html+=`
    <button class="btn btn-dourado" id="btn-encerrar">🎉 Encerrar votação e coroar campeã(o)</button>
    <button class="btn btn-cinza" id="btn-zerar-votos">🗑️ Zerar votos (recomeçar votação)</button>`;
  app.innerHTML=html;

  document.getElementById("btn-encerrar").onclick=encerrarVotacao;
  document.getElementById("btn-zerar-votos").onclick=()=>
    confirmar("Apagar TODOS os votos? As sobremesas continuam inscritas.",()=>{
      estado.votos=[]; salvar(); render();
    });
}

/* ==================================================================
   ENCERRAR -> animação de campeão + salva no Hall da Fama
   ================================================================== */
let rankGuardado=[];   // ranking no momento do encerramento (p/ pódio)

function encerrarVotacao(){
  if(estado.votos.length===0){ aviso("Ainda não há votos para apurar."); return; }
  const rank=calcularRanking();
  const campeao=rank[0];
  if(!campeao || campeao.media<=0){ aviso("Ainda não há notas suficientes."); return; }
  rankGuardado=rank;

  // salva no Hall da Fama (um registro por ano; atualiza se reencerrar)
  const reg={
    ano: estado.ano,
    nome: campeao.nome,
    participante: campeao.participante,
    participante2: campeao.participante2||"",
    foto: campeao.foto,
    media: Number(campeao.media.toFixed(2)),
    crianca: !!campeao.crianca,
  };
  const i=estado.hall.findIndex(h=>h.ano===estado.ano);
  if(i>=0) estado.hall[i]=reg; else estado.hall.push(reg);
  salvar();

  // mostra a tela de SUSPENSE; o clique no botão revela (e libera o som)
  const rv=document.getElementById("revelar-overlay");
  rv.classList.remove("escondido");
  document.getElementById("btn-revelar").onclick=()=>{
    rv.classList.add("escondido");
    mostrarCampeao(campeao);
  };
}

function mostrarCampeao(c){
  const ov=document.getElementById("campeao-overlay");
  document.getElementById("campeao-foto").src = c.foto||"";
  document.getElementById("campeao-foto").style.display = c.foto?"block":"none";
  document.getElementById("campeao-nome").textContent = c.nome;
  document.getElementById("campeao-autor").textContent = "por "+nomesDe(c)+(c.crianca?" 👶":"");
  document.getElementById("campeao-nota").textContent = "Nota "+c.media.toFixed(2)+" ⭐";

  // pódio 2º e 3º
  const podio=document.getElementById("podio");
  const medalhas=["","🥈","🥉"];
  podio.innerHTML = rankGuardado.slice(1,3)
    .filter(r=>r.media>0)
    .map((r,i)=>`<div class="podio-item">
      <div class="podio-medalha">${medalhas[i+1]}</div>
      <div class="podio-nome">${esc(r.nome)}</div>
      <div class="podio-autor">${esc(nomesDe(r))}</div>
      <div class="podio-nota">${r.media.toFixed(2)} ⭐</div>
    </div>`).join("");

  ov.classList.remove("escondido");
  chuvaConfete();
  tocarFanfarra();   // som de aplauso/fanfarra sintetizado

  const v=document.getElementById("mascote-video");
  if(v){ try{
    v.muted=false; v.volume=1.0; v.currentTime=0; v.loop=false;
    v.play().catch(()=>{ v.muted=true; v.play().catch(()=>{}); });
  }catch(e){} }
  document.getElementById("campeao-fechar").onclick=()=>{
    ov.classList.add("escondido");
    if(v){ try{ v.pause(); }catch(e){} }
  };
}

/* fanfarra/acorde de vitória usando Web Audio (sem arquivo de som) */
function tocarFanfarra(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    const ac=new AC();
    const notas=[523.25,659.25,783.99,1046.50]; // dó-mi-sol-dó (acorde subindo)
    notas.forEach((f,i)=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type="triangle"; o.frequency.value=f;
      o.connect(g); g.connect(ac.destination);
      const t=ac.currentTime+i*0.12;
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(0.25,t+0.03);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.8);
      o.start(t); o.stop(t+0.85);
    });
  }catch(e){}
}

function chuvaConfete(){
  const box=document.getElementById("confete-chuva");
  box.innerHTML="";
  const emojis=["🎉","🎊","⭐","🍰","🧁","👑","✨"];
  for(let i=0;i<40;i++){
    const s=document.createElement("span");
    s.textContent=emojis[Math.floor(Math.random()*emojis.length)];
    s.style.left=Math.random()*100+"%";
    s.style.animationDelay=(Math.random()*1.5)+"s";
    s.style.animationDuration=(2+Math.random()*2)+"s";
    s.style.fontSize=(16+Math.random()*22)+"px";
    box.appendChild(s);
  }
}

/* ==================================================================
   TELA — TV (Fire TV): ranking grande ao vivo
   ================================================================== */
let tvTimer=null;
function telaTV(){
  clearInterval(tvTimer);
  pintarTV();
  // atualiza sozinho a cada 2s (reflete votos feitos neste aparelho)
  tvTimer=setInterval(()=>{ if(telaAtual==="tv") pintarTV(); else clearInterval(tvTimer); },2000);
}
function pintarTV(){
  const rank = estado.votos.length? calcularRanking() : estado.sobremesas.map(s=>({...s,media:0,nvotos:0}));
  const totalVotantes=[...new Set(estado.votos.map(v=>v.votante))].length;
  let html=`<div class="tv-wrap">
    <div class="tv-cabecalho">🍰 Melhor Sobremesa ${estado.ano} 🏆
      <div class="tv-sub">${totalVotantes} votante(s) · ao vivo</div>
    </div>`;
  if(rank.length===0){
    html+=`<div class="vazio" style="color:#fff"><span class="big">🍽️</span>Nenhuma sobremesa inscrita ainda</div>`;
  }else{
    rank.forEach((r,i)=>{
      const pos=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}º`;
      html+=`
        <div class="tv-linha ${i===0&&r.media>0?'tv-lider':''}">
          <div class="tv-pos">${pos}</div>
          ${r.foto?`<img class="tv-foto" src="${r.foto}">`:`<div class="tv-foto tv-sem">🍰</div>`}
          <div class="tv-info">
            <div class="tv-nome">${esc(r.nome)}</div>
            <div class="tv-autor">${esc(nomesDe(r))} ${r.crianca?"👶":""}</div>
            <div class="tv-barra"><i style="width:${(r.media/5*100).toFixed(0)}%"></i></div>
          </div>
          <div class="tv-nota">${r.media.toFixed(2)}</div>
        </div>`;
    });
  }
  html+=`<div class="tv-dica">📺 Espelhe este celular na sua Fire TV · a tela atualiza sozinha</div></div>`;
  app.innerHTML=html;
}

/* ==================================================================
   TELA — HALL DA FAMA (histórico por ano)
   ================================================================== */
function telaHall(){
  const lista=[...estado.hall].sort((a,b)=>b.ano-a.ano);
  let html=`<h2 class="titulo">🏛️ Hall da Fama</h2>
    <p class="dica">Os campeões de cada ano. Use o mesmo app todo ano que ele vai acumulando! 🏆</p>`;

  if(lista.length===0){
    html+=vazio("🏆","Ainda sem campeões","Encerre uma votação na aba <b>Ranking</b> para registrar o campeão do ano.");
  }else{
    lista.forEach(h=>{
      html+=`
        <div class="card campeao">
          <div class="hall-ano">🏆 ${h.ano}</div>
          <div class="rank-item">
            ${h.foto?`<img class="foto-mini" src="${h.foto}">`:`<div class="emoji-grande">🍰</div>`}
            <div class="rank-info">
              <div class="card-nome">${esc(h.nome)}</div>
              <div class="card-casal">campeã(o): ${esc(nomesDe(h))} ${h.crianca?"👶":""}</div>
            </div>
            <div class="rank-nota">${Number(h.media).toFixed(2)}</div>
          </div>
        </div>`;
    });
  }

  // controle do ano da competição + iniciar novo ano
  html+=`
    <div class="card">
      <label>Ano desta competição</label>
      <div class="linha">
        <input type="text" id="in-ano" value="${estado.ano}" inputmode="numeric">
        <button class="btn btn-vinho btn-sm" id="btn-salvar-ano">Salvar ano</button>
      </div>
      <p class="dica" style="margin:8px 0 0">Para começar a competição de um novo ano, salve os campeões atuais (encerrando a votação) e depois use o botão abaixo.</p>
      <div style="height:10px"></div>
      <button class="btn btn-dourado" id="btn-novo-ano">🎉 Iniciar novo ano (limpa inscrições e votos)</button>
    </div>`;
  app.innerHTML=html;

  document.getElementById("btn-salvar-ano").onclick=()=>{
    const a=parseInt(document.getElementById("in-ano").value,10);
    if(!a||a<2000||a>2100){ aviso("Digite um ano válido (ex.: 2026)."); return; }
    estado.ano=a; salvar();
    document.getElementById("ano-topo").textContent=a;
    aviso("Ano atualizado para "+a+".",()=>render());
  };
  document.getElementById("btn-novo-ano").onclick=()=>{
    confirmar("Iniciar um NOVO ano? Isso apaga as inscrições e votos atuais. O Hall da Fama é mantido. (Dica: encerre a votação antes para salvar o campeão deste ano.)",()=>{
      estado.sobremesas=[]; estado.votos=[];
      salvar();
      aviso("Pronto! Nova competição começando. Cadastre as sobremesas. 🍰",()=>irPara("cadastrar"));
    });
  };
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
