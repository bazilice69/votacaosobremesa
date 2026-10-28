/* ====================================================================
   MELHOR SOBREMESA — Servidor de REDE LOCAL (LAN)
   --------------------------------------------------------------------
   Roda num notebook. Todos na MESMA Wi-Fi acessam pelo IP e votam
   cada um no seu próprio celular. A TV abre /tv e vê ao vivo.

   SEM dependências externas (só Node puro) -> funciona sem internet.

   COMO RODAR:
     1. Instale o Node.js (https://nodejs.org) — versão LTS.
     2. Abra a pasta no terminal e rode:  node servidor.js
     3. O terminal mostra o IP e um QR Code para os celulares.

   Links:
     http://SEU_IP:3000/        -> celulares (inscrever + votar)
     http://SEU_IP:3000/tv      -> a TV (ranking ao vivo)
     http://SEU_IP:3000/admin   -> você (encerrar, coroar, hall da fama)
   ==================================================================== */

"use strict";

const http = require("http");
const fs   = require("fs");
const path = require("path");
const os   = require("os");
const crypto = require("crypto");

const PORTA = process.env.PORT || 3000;
const ARQ_DADOS = path.join(__dirname, "dados.json");
const PUBLIC = path.join(__dirname, "public");

/* -------------------- CRITÉRIOS (ordem = desempate) -------------------- */
const QUESITOS = ["sabor","textura","aparencia","criatividade"];

/* -------------------- ESTADO (em memória + arquivo) -------------------- */
let dados = carregarDados();

function estadoInicial(){
  return {
    ano: new Date().getFullYear(),
    fase: "inscricao",            // inscricao | votacao | encerrado
    sobremesas: [],               // {id, participante, nome, foto, crianca}
    votos: [],                    // {id, votante, sobremesaId, notas:{...}}
    hall: [],                     // {ano, nome, participante, foto, media}
  };
}
function carregarDados(){
  try{
    if(fs.existsSync(ARQ_DADOS))
      return Object.assign(estadoInicial(), JSON.parse(fs.readFileSync(ARQ_DADOS,"utf8")));
  }catch(e){ console.error("Falha ao ler dados.json:", e.message); }
  return estadoInicial();
}
let salvarTimer=null;
function salvarDados(){
  clearTimeout(salvarTimer);
  salvarTimer=setTimeout(()=>{
    fs.writeFile(ARQ_DADOS, JSON.stringify(dados), e=>{ if(e) console.error("Erro ao salvar:",e.message); });
  }, 150);
}
function id(){ return crypto.randomBytes(5).toString("hex"); }

/* -------------------- RANKING + DESEMPATE -------------------- */
function calcularRanking(){
  const lista = dados.sobremesas.map(s=>{
    const votos = dados.votos.filter(v=>v.sobremesaId===s.id);
    const porCrit={};
    QUESITOS.forEach(q=>{
      const ns=votos.map(v=>v.notas[q]).filter(n=>n>0);
      porCrit[q]= ns.length? ns.reduce((a,b)=>a+b,0)/ns.length : 0;
    });
    const todas=[];
    votos.forEach(v=>QUESITOS.forEach(q=>{ if(v.notas[q]>0) todas.push(v.notas[q]); }));
    const media= todas.length? todas.reduce((a,b)=>a+b,0)/todas.length : 0;
    return { id:s.id, nome:s.nome, participante:s.participante, foto:s.foto,
             crianca:!!s.crianca, nvotos:votos.length, media, porCrit };
  });
  lista.sort((a,b)=>{
    if(b.media!==a.media) return b.media-a.media;
    for(const q of QUESITOS) if(b.porCrit[q]!==a.porCrit[q]) return b.porCrit[q]-a.porCrit[q];
    return b.nvotos-a.nvotos;
  });
  return lista;
}

function resumoPublico(){
  return {
    ano: dados.ano,
    fase: dados.fase,
    sobremesas: dados.sobremesas.map(s=>({
      id:s.id, nome:s.nome, participante:s.participante,
      participante2:s.participante2||"", foto:s.foto, crianca:!!s.crianca
    })),
    ranking: calcularRanking(),
    votantes: [...new Set(dados.votos.map(v=>v.votante))],
    totalVotantes: new Set(dados.votos.map(v=>v.votante)).size,
    hall: dados.hall,
  };
}

/* ==================================================================
   HTTP SERVER
   ================================================================== */
const server = http.createServer((req,res)=>{
  const url = new URL(req.url, "http://localhost");
  const rota = url.pathname;

  // -------- rotas de API --------
  if(rota.startsWith("/api/")) return api(req,res,rota);

  // -------- páginas HTML --------
  if(rota==="/" )      return servirArquivo(res, "votar.html");
  if(rota==="/tv")     return servirArquivo(res, "tv.html");
  if(rota==="/admin")  return servirArquivo(res, "admin.html");

  // -------- estáticos (css/js) --------
  return servirEstatico(res, rota);
});

/* -------------------- API -------------------- */
function api(req,res,rota){
  // GET estado
  if(rota==="/api/estado" && req.method==="GET")
    return json(res, resumoPublico());

  // POST inscrever sobremesa
  if(rota==="/api/inscrever" && req.method==="POST")
    return lerBody(req, body=>{
      if(dados.fase==="encerrado") return json(res,{erro:"Competição encerrada."},400);
      const { participante, participante2, nome, foto, crianca } = body||{};
      if(!participante || !nome) return json(res,{erro:"Nome e sobremesa são obrigatórios."},400);
      // evita participante repetido (senão a sobremesa some na votação dessa pessoa)
      const nl=n=>String(n||"").trim().toLowerCase();
      const novos=[participante, participante2].filter(Boolean).map(nl);
      const dup=dados.sobremesas.find(x=>
        novos.includes(nl(x.participante)) || (x.participante2 && novos.includes(nl(x.participante2))));
      if(dup) return json(res,{erro:`Já existe sobremesa com o participante "${dup.participante}". Cada pessoa inscreve só uma — use outro nome se for outra pessoa.`},400);
      const s={ id:id(), participante:String(participante).slice(0,60),
                participante2:String(participante2||"").slice(0,60),
                nome:String(nome).slice(0,80), foto:foto||"", crianca:!!crianca };
      dados.sobremesas.push(s); salvarDados();
      return json(res,{ok:true, sobremesa:s});
    });

  // POST votar
  if(rota==="/api/votar" && req.method==="POST")
    return lerBody(req, body=>{
      if(dados.fase==="encerrado") return json(res,{erro:"Votação encerrada."},400);
      const { votante, notasPorSobremesa } = body||{};
      if(!votante) return json(res,{erro:"Informe quem está votando."},400);
      const nome=String(votante).trim();
      const nl=nome.toLowerCase();
      // remove votos anteriores desse votante (permite refazer)
      dados.votos = dados.votos.filter(v=>v.votante.toLowerCase()!==nl);
      // descobre a sobremesa do próprio votante — bloqueia por QUALQUER um
      // dos nomes do casal (participante ou participante2)
      const propria = dados.sobremesas.find(s=>
        (s.participante||"").toLowerCase()===nl ||
        (s.participante2||"").toLowerCase()===nl);
      let registrados=0;
      Object.entries(notasPorSobremesa||{}).forEach(([sid,notas])=>{
        if(propria && sid===propria.id) return;           // bloqueio real
        if(!dados.sobremesas.find(s=>s.id===sid)) return;
        const limpo={}; let soma=0;
        QUESITOS.forEach(q=>{ const n=Math.max(0,Math.min(5,parseInt(notas[q]||0,10))); limpo[q]=n; soma+=n; });
        if(soma>0){ dados.votos.push({id:id(),votante:nome,sobremesaId:sid,notas:limpo}); registrados++; }
      });
      if(registrados===0) return json(res,{erro:"Dê ao menos uma nota (e não na sua própria sobremesa)."},400);
      salvarDados();
      return json(res,{ok:true, registrados});
    });

  // POST admin: mudar fase / encerrar / zerar / novo ano / exemplo
  if(rota==="/api/admin" && req.method==="POST")
    return lerBody(req, body=>{
      const acao=(body||{}).acao;
      if(acao==="fase"){ dados.fase=body.fase; salvarDados(); return json(res,{ok:true}); }
      if(acao==="zerar-votos"){ dados.votos=[]; salvarDados(); return json(res,{ok:true}); }
      if(acao==="remover-sobremesa"){
        dados.sobremesas=dados.sobremesas.filter(s=>s.id!==body.sobremesaId);
        dados.votos=dados.votos.filter(v=>v.sobremesaId!==body.sobremesaId);
        salvarDados(); return json(res,{ok:true});
      }
      if(acao==="encerrar"){
        const r=calcularRanking();
        if(r.length && r[0].media>0){
          const c=r[0];
          const reg={ano:dados.ano,nome:c.nome,participante:c.participante,
                     foto:c.foto,media:Number(c.media.toFixed(2)),crianca:c.crianca};
          const i=dados.hall.findIndex(h=>h.ano===dados.ano);
          if(i>=0) dados.hall[i]=reg; else dados.hall.push(reg);
        }
        dados.fase="encerrado"; salvarDados();
        return json(res,{ok:true, campeao:r[0]||null});
      }
      if(acao==="novo-ano"){
        dados.ano=parseInt(body.ano,10)||dados.ano;
        dados.sobremesas=[]; dados.votos=[]; dados.fase="inscricao";
        salvarDados(); return json(res,{ok:true});
      }
      if(acao==="set-ano"){ dados.ano=parseInt(body.ano,10)||dados.ano; salvarDados(); return json(res,{ok:true}); }
      if(acao==="exemplo"){ carregarExemplo(); salvarDados(); return json(res,{ok:true}); }
      if(acao==="reset-tudo"){ dados=estadoInicial(); salvarDados(); return json(res,{ok:true}); }
      return json(res,{erro:"Ação desconhecida."},400);
    });

  return json(res,{erro:"Rota não encontrada."},404);
}

/* -------------------- DADOS DE EXEMPLO (teste em casa) -------------------- */
function carregarExemplo(){
  const nomes=[
    {participante:"João", nome:"Pavê de Chocolate", crianca:false, emoji:"🍫"},
    {participante:"Maria", nome:"Torta de Limão", crianca:false, emoji:"🥧"},
    {participante:"Pedro (6 anos)", nome:"Brigadeirão", crianca:true, emoji:"🍮"},
    {participante:"Ana & Bruno", nome:"Cheesecake de Frutas Vermelhas", crianca:false, emoji:"🍰"},
    {participante:"Tia Marta", nome:"Pudim da Vó", crianca:false, emoji:"🍮"},
  ];
  dados.sobremesas = nomes.map(n=>({ id:id(), participante:n.participante, nome:n.nome, foto:"", crianca:n.crianca }));
  // votos fictícios
  const votantes=["Carlos","Fernanda","Lucas","Beatriz","Rafael","Juliana","Vovô"];
  dados.votos=[];
  votantes.forEach(v=>{
    dados.sobremesas.forEach(s=>{
      // não vota em si mesmo (caso coincida nome) e às vezes pula alguma
      if(s.participante.toLowerCase()===v.toLowerCase()) return;
      if(Math.random()<0.15) return;
      const notas={};
      QUESITOS.forEach(q=> notas[q]=2+Math.floor(Math.random()*4)); // 2..5
      dados.votos.push({id:id(),votante:v,sobremesaId:s.id,notas});
    });
  });
  dados.fase="votacao";
}

/* -------------------- UTIL HTTP -------------------- */
function json(res,obj,status=200){
  const s=JSON.stringify(obj);
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Content-Length":Buffer.byteLength(s)});
  res.end(s);
}
function lerBody(req,cb){
  let b="";
  req.on("data",c=>{ b+=c; if(b.length>8e6) req.destroy(); }); // ~8MB (fotos)
  req.on("end",()=>{ try{ cb(b?JSON.parse(b):{}); }catch(e){ cb({}); } });
}
function servirArquivo(res,arq){
  const p=path.join(PUBLIC,arq);
  fs.readFile(p,(e,buf)=>{
    if(e){ res.writeHead(404); return res.end("Página não encontrada"); }
    res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
    res.end(buf);
  });
}
function servirEstatico(res,rota){
  const arq=path.normalize(rota).replace(/^(\.\.[\/\\])+/,"");
  const p=path.join(PUBLIC,arq);
  if(!p.startsWith(PUBLIC)){ res.writeHead(403); return res.end(); }
  fs.readFile(p,(e,buf)=>{
    if(e){ res.writeHead(404); return res.end("Não encontrado"); }
    const ext=path.extname(p).toLowerCase();
    const tipos={".css":"text/css",".js":"text/javascript",".html":"text/html",
                 ".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",
                 ".svg":"image/svg+xml",".mp4":"video/mp4",".webm":"video/webm",
                 ".gif":"image/gif",".mp3":"audio/mpeg",".m4a":"audio/mp4"};
    const tipo=tipos[ext]||"application/octet-stream";
    // charset só faz sentido para texto; binários (mp4/png) não levam charset
    const ehTexto=/^(text\/|application\/(javascript|json))/.test(tipo);
    res.writeHead(200,{"Content-Type":tipo+(ehTexto?"; charset=utf-8":"")});
    res.end(buf);
  });
}

/* -------------------- IP LOCAL + QR no terminal -------------------- */
function ipLocal(){
  const ifaces=os.networkInterfaces();
  for(const nome of Object.keys(ifaces)){
    for(const ni of ifaces[nome]){
      if(ni.family==="IPv4" && !ni.internal) return ni.address;
    }
  }
  return "127.0.0.1";
}

server.listen(PORTA,"0.0.0.0",()=>{
  const ip=ipLocal();
  const base=`http://${ip}:${PORTA}`;
  console.log("\n==================================================");
  console.log("  🍰  MELHOR SOBREMESA — servidor de rede local  🏆");
  console.log("==================================================");
  console.log("  Celulares (votar) :  "+base+"/");
  console.log("  TV (ranking)      :  "+base+"/tv");
  console.log("  Admin (você)      :  "+base+"/admin");
  console.log("--------------------------------------------------");
  console.log("  Todos devem estar na MESMA rede Wi-Fi.");
  console.log("  Para parar: Ctrl + C");
  console.log("==================================================\n");
  qrTerminal(base+"/");
});

/* QR Code simples no terminal (sem libs) — aponta a câmera para votar */
function qrTerminal(texto){
  try{
    const qr = gerarQRMatrix(texto);
    if(!qr) return;
    console.log("  Aponte a câmera do celular para votar:\n");
    const n=qr.length;
    for(let y=0;y<n;y+=2){
      let linha="    ";
      for(let x=0;x<n;x++){
        const cima=qr[y][x], baixo=(y+1<n)?qr[y+1][x]:0;
        linha += cima&&baixo ? "█" : cima ? "▀" : baixo ? "▄" : " ";
      }
      console.log(linha);
    }
    console.log("");
  }catch(e){ /* QR é opcional */ }
}
// QR mínimo não é trivial sem lib; deixamos desativado por padrão (retorna null)
function gerarQRMatrix(){ return null; }
