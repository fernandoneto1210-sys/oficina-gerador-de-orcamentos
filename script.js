var STORAGE_KEY = 'oficina_orcamentos_v3';
var COUNTER_KEY = 'oficina_contador_v3';
var estadoAtual = { id: null, numero: null };
var voosIda     = [];
var voosVolta   = [];
var vooIdxCtrl  = 0;
var fotoDestinoBase64 = null; // Para a foto do destino

window.addEventListener('load', function () {
  document.getElementById('btnSalvar').onclick   = salvarOrcamento;
  document.getElementById('btnGerar').onclick    = gerarPDF;
  document.getElementById('btnLimpar').onclick   = limparFormulario;
  document.getElementById('btnNovo').onclick     = limparFormulario;
  document.getElementById('btnDuplicar').onclick = duplicarOrcamento;

  var btnAddIda   = document.getElementById('btnAddVooIda');
  var btnAddVolta = document.getElementById('btnAddVooVolta');
  if (btnAddIda)   btnAddIda.onclick   = function () { adicionarVoo('ida'); };
  if (btnAddVolta) btnAddVolta.onclick = function () { adicionarVoo('volta'); };

  var elData = document.getElementById('dataOrcamento');
  if (elData) elData.value = new Date().toISOString().slice(0, 10);

  var calcIds = [
    'numeroPessoas','precoPorPessoa','taxaEmbarque',
    'outrasTaxas','entrada','numeroParcelas'
  ];
  for (var i = 0; i < calcIds.length; i++) {
    var el = document.getElementById(calcIds[i]);
    if (el) el.addEventListener('input', calcularTotal);
  }

  adicionarVoo('ida');
  adicionarVoo('volta');
  carregarLista();
});

// ── FOTO DO DESTINO ───────────────────────────────────────

function previewFoto(input) {
  if (!input.files || !input.files[0]) return;
  var file   = input.files[0];
  var reader = new FileReader();
  reader.onload = function (e) {
    fotoDestinoBase64 = e.target.result;
    var img = document.getElementById('previewFotoImg');
    var box = document.getElementById('previewFotoBox');
    if (img) img.src = fotoDestinoBase64;
    if (box) box.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removerFoto() {
  fotoDestinoBase64 = null;
  var input = document.getElementById('fotoDestino');
  var img   = document.getElementById('previewFotoImg');
  var box   = document.getElementById('previewFotoBox');
  if (input) input.value = '';
  if (img)   img.src     = '';
  if (box)   box.style.display = 'none';
}

// ── VOOS ──────────────────────────────────────────────────

function adicionarVoo(tipo) {
  vooIdxCtrl++;
  var idx       = vooIdxCtrl;
  var arr       = (tipo === 'ida') ? voosIda : voosVolta;
  var cId       = (tipo === 'ida') ? 'containerVoosIda' : 'containerVoosVolta';
  var container = document.getElementById(cId);
  if (!container) return;

  var cor   = (tipo === 'ida') ? '#1e4a7d' : '#2c8c3a';
  var num   = arr.length + 1;
  var label = (tipo === 'ida') ? 'Voo de Ida' : 'Voo de Volta';

  var div = document.createElement('div');
  div.id  = 'vooBloco_' + tipo + '_' + idx;
  div.style.cssText =
    'border:1.5px solid #dde3ea;border-radius:8px;' +
    'padding:12px;margin-bottom:10px;background:#fafbff;';

  var cabec = document.createElement('div');
  cabec.style.cssText =
    'display:flex;justify-content:space-between;' +
    'align-items:center;margin-bottom:10px;';

  var tit = document.createElement('div');
  tit.style.cssText =
    'font-size:0.82rem;font-weight:700;color:' + cor + ';' +
    'text-transform:uppercase;';
  tit.textContent = label + ' ' + num;

  var btnRem = document.createElement('button');
  btnRem.type        = 'button';
  btnRem.textContent = 'Remover';
  btnRem.style.cssText =
    'font-size:0.75rem;padding:3px 10px;border:1px solid #c0392b;' +
    'background:#fff;color:#c0392b;border-radius:4px;cursor:pointer;';

  (function (divRef, tipoRef, idxRef) {
    btnRem.onclick = function () { removerVoo(divRef, tipoRef, idxRef); };
  })(div, tipo, idx);

  cabec.appendChild(tit);
  cabec.appendChild(btnRem);
  div.appendChild(cabec);

  var linhas = [
    [
      { id: 'cia',            label: 'Cia Aerea',
        ph: 'Ex: LATAM / GOL / Azul' },
      { id: 'numero',         label: 'N do Voo',
        ph: 'Ex: LA3042' }
    ],
    [
      { id: 'origem',         label: 'Origem',
        ph: 'Ex: Campinas (VCP)' },
      { id: 'destino',        label: 'Destino',
        ph: 'Ex: Recife (REC)' }
    ],
    [
      { id: 'dataPartida',    label: 'Data de Partida',
        ph: 'Ex: 10/07/2025', tipo: 'text' },
      { id: 'horaPartida',    label: 'Hora de Partida',
        ph: 'Ex: 06h30',      tipo: 'text' }
    ],
    [
      { id: 'dataChegada',    label: 'Data de Chegada',
        ph: 'Ex: 10/07/2025', tipo: 'text' },
      { id: 'horaChegada',    label: 'Hora de Chegada',
        ph: 'Ex: 08h45',      tipo: 'text' }
    ],
    [
      { id: 'obs',            label: 'Observacao',
        ph: 'Ex: Conexao em GRU', full: true }
    ]
  ];

  for (var r = 0; r < linhas.length; r++) {
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap;';

    for (var c = 0; c < linhas[r].length; c++) {
      var cf = linhas[r][c];
      var fg = document.createElement('div');
      fg.style.cssText =
        'display:flex;flex-direction:column;' +
        (cf.full ? 'flex:1;min-width:100%;' : 'flex:1;min-width:120px;');

      var lbl = document.createElement('label');
      lbl.style.cssText =
        'font-size:0.8rem;font-weight:600;color:#444;margin-bottom:3px;';
      var uid = 'voo_' + tipo + '_' + idx + '_' + cf.id;
      lbl.setAttribute('for', uid);
      lbl.textContent = cf.label;

      var inp = document.createElement('input');
      inp.type        = 'text';
      inp.id          = uid;
      inp.placeholder = cf.ph;
      inp.style.cssText =
        'padding:6px 8px;border:1.5px solid #dde3ea;border-radius:6px;' +
        'font-size:0.85rem;background:#fff;' +
        'box-sizing:border-box;width:100%;';

      fg.appendChild(lbl);
      fg.appendChild(inp);
      row.appendChild(fg);
    }
    div.appendChild(row);
  }

  container.appendChild(div);
  arr.push({ el: div, idx: idx });
}

function removerVoo(div, tipo, idx) {
  if (div && div.parentNode) div.parentNode.removeChild(div);
  var arr  = (tipo === 'ida') ? voosIda : voosVolta;
  var nova = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].idx !== idx) nova.push(arr[i]);
  }
  if (tipo === 'ida') voosIda = nova;
  else voosVolta = nova;
}

function lerVoos(tipo) {
  var arr = (tipo === 'ida') ? voosIda : voosVolta;
  var res = [];
  for (var i = 0; i < arr.length; i++) {
    var idx = arr[i].idx;
    var obj = {
      cia:         gvEl('voo_' + tipo + '_' + idx + '_cia'),
      numero:      gvEl('voo_' + tipo + '_' + idx + '_numero'),
      origem:      gvEl('voo_' + tipo + '_' + idx + '_origem'),
      destino:     gvEl('voo_' + tipo + '_' + idx + '_destino'),
      dataPartida: gvEl('voo_' + tipo + '_' + idx + '_dataPartida'),
      horaPartida: gvEl('voo_' + tipo + '_' + idx + '_horaPartida'),
      dataChegada: gvEl('voo_' + tipo + '_' + idx + '_dataChegada'),
      horaChegada: gvEl('voo_' + tipo + '_' + idx + '_horaChegada'),
      obs:         gvEl('voo_' + tipo + '_' + idx + '_obs')
    };
    var tem = obj.cia || obj.numero || obj.origem || obj.destino ||
              obj.dataPartida || obj.horaPartida ||
              obj.dataChegada || obj.horaChegada || obj.obs;
    if (tem) res.push(obj);
  }
  return res;
}

function gvEl(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function preencherVoos(tipo, lista) {
  var cId       = (tipo === 'ida') ? 'containerVoosIda' : 'containerVoosVolta';
  var container = document.getElementById(cId);
  if (!container) return;
  if (tipo === 'ida') voosIda = [];
  else voosVolta = [];
  container.innerHTML = '';

  if (!lista || lista.length === 0) {
    adicionarVoo(tipo);
    return;
  }
  for (var i = 0; i < lista.length; i++) {
    adicionarVoo(tipo);
    var arr = (tipo === 'ida') ? voosIda : voosVolta;
    var idx = arr[arr.length - 1].idx;
    var v   = lista[i];
    var cs  = [
      'cia','numero','origem','destino',
      'dataPartida','horaPartida',
      'dataChegada','horaChegada','obs'
    ];
    for (var j = 0; j < cs.length; j++) {
      var el = document.getElementById(
        'voo_' + tipo + '_' + idx + '_' + cs[j]);
      if (el && v[cs[j]]) el.value = v[cs[j]];
    }
  }
}

// ── UTILITARIOS — ZERO REGEX COM ACENTO ───────────────────

function proximoNumero() {
  var n = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(COUNTER_KEY, String(n));
  return n;
}

function fmt(n) {
  var s = String(n);
  while (s.length < 3) s = '0' + s;
  return s;
}

function brFmt(v) {
  var partes  = v.toFixed(2).split('.');
  var inteiro = partes[0];
  var decimal = partes[1];
  var res   = '';
  var count = 0;
  for (var i = inteiro.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) res = '.' + res;
    res = inteiro[i] + res;
    count++;
  }
  return 'R$ ' + res + ',' + decimal;
}

function toFloat(str) {
  if (!str) return 0;
  var r      = '';
  var temSep = false;
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c >= '0' && c <= '9') r += c;
    if ((c === ',' || c === '.') && !temSep) {
      r += '.';
      temSep = true;
    }
  }
  var v = parseFloat(r);
  return isNaN(v) ? 0 : v;
}

function limparNome(str) {
  var ok =
    'abcdefghijklmnopqrstuvwxyz' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    '0123456789_- ';
  var r = '';
  for (var i = 0; i < str.length; i++) {
    if (ok.indexOf(str[i]) >= 0) r += str[i];
  }
  var res = '';
  for (var i = 0; i < r.length; i++) {
    res += (r[i] === ' ') ? '_' : r[i];
  }
  if (res.length > 25) res = res.slice(0, 25);
  return res;
}

function mostrarBadge(numero) {
  estadoAtual.numero = numero;
  var el = document.getElementById('numeroBadge');
  var vl = document.getElementById('numeroAtualValor');
  if (!el || !vl) return;
  vl.textContent   = 'N ' + fmt(numero);
  el.style.display = 'flex';
}

function ocultarBadge() {
  var el = document.getElementById('numeroBadge');
  if (el) el.style.display = 'none';
  estadoAtual = { id: null, numero: null };
}

// ── CALCULADORA ───────────────────────────────────────────

function calcularTotal() {
  var np       = parseInt(gv('numeroPessoas'), 10);
  var pp       = toFloat(gv('precoPorPessoa'));
  var taxa     = toFloat(gv('taxaEmbarque'));
  var outras   = toFloat(gv('outrasTaxas'));
  var entrada  = toFloat(gv('entrada'));
  var parcelas = parseInt(gv('numeroParcelas'), 10);

  var totPP    = document.getElementById('totalPorPessoa');
  var totEl    = document.getElementById('totalCalculado');
  var detEl    = document.getElementById('totalDetalhe');
  var resumoEl = document.getElementById('resumoPagamento');

  if (!np || np <= 0 || pp <= 0) {
    if (totPP)    totPP.textContent = '-';
    if (totEl)    totEl.textContent = '-';
    if (detEl)    detEl.textContent = '';
    if (resumoEl) resumoEl.textContent =
      'Preencha os campos acima para calcular.';
    return;
  }

  var totalPessoa = pp + taxa + outras;
  var totalGrupo  = totalPessoa * np;

  if (totPP) totPP.textContent = brFmt(totalPessoa);
  if (totEl) totEl.textContent = brFmt(totalGrupo);
  if (detEl) detEl.textContent = np + ' pess. x ' + brFmt(totalPessoa);

  if (resumoEl) {
    if (parcelas > 0) {
      var vlParcela = 0;
      var txt = '';
      if (entrada > 0) {
        vlParcela = (totalPessoa - entrada) / parcelas;
        txt = 'Entrada: ' + brFmt(entrada) +
              '  +  ' + parcelas + 'x de ' + brFmt(vlParcela) +
              '  |  Total p/ pessoa: ' + brFmt(totalPessoa) +
              '  |  Total grupo: ' + brFmt(totalGrupo);
      } else {
        vlParcela = totalPessoa / parcelas;
        txt = parcelas + 'x de ' + brFmt(vlParcela) +
              '  |  Total p/ pessoa: ' + brFmt(totalPessoa) +
              '  |  Total grupo: ' + brFmt(totalGrupo);
      }
      resumoEl.textContent = txt;
    } else {
      resumoEl.textContent =
        'Informe o numero de parcelas para calcular.';
    }
  }
}

// ── FORMULARIO ────────────────────────────────────────────

function gv(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function sv(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val || '';
}

function lerFormulario() {
  return {
    id:              estadoAtual.id     || null,
    numero:          estadoAtual.numero || null,
    cliente:         gv('cliente'),
    destino:         gv('destino'),
    periodo:         gv('periodo'),
    saida:           gv('saida'),
    dataOrcamento:   gv('dataOrcamento'),
    numeroPessoas:   gv('numeroPessoas'),
    roteiro:         gv('roteiro'),
    precoPorPessoa:  gv('precoPorPessoa'),
    ocupacao:        gv('ocupacao'),
    taxaEmbarque:    gv('taxaEmbarque'),
    outrasTaxas:     gv('outrasTaxas'),
    outrasTaxasDesc: gv('outrasTaxasDesc'),
    entrada:         gv('entrada'),
    numeroParcelas:  gv('numeroParcelas'),
    pagamento:       gv('pagamento'),
    observacoes:     gv('observacoes'),
    validade:        gv('validade'),
    vendedor:        gv('vendedor'),
    inclui:          gv('inclui'),
    naoInclui:       gv('naoInclui'),
    voosIda:         lerVoos('ida'),
    voosVolta:       lerVoos('volta'),
    fotoDestino:     fotoDestinoBase64 // Salva a foto em base64
  };
}

function preencherFormulario(d) {
  sv('cliente',         d.cliente);
  sv('destino',         d.destino);
  sv('periodo',         d.periodo);
  sv('saida',           d.saida);
  sv('dataOrcamento',   d.dataOrcamento);
  sv('numeroPessoas',   d.numeroPessoas);
  sv('roteiro',         d.roteiro);
  sv('precoPorPessoa',  d.precoPorPessoa);
  sv('ocupacao',        d.ocupacao);
  sv('taxaEmbarque',    d.taxaEmbarque);
  sv('outrasTaxas',     d.outrasTaxas);
  sv('outrasTaxasDesc', d.outrasTaxasDesc);
  sv('entrada',         d.entrada);
  sv('numeroParcelas',  d.numeroParcelas);
  sv('pagamento',       d.pagamento);
  sv('observacoes',     d.observacoes);
  sv('validade',        d.validade);
  sv('vendedor',        d.vendedor);
  sv('inclui',          d.inclui);
  sv('naoInclui',       d.naoInclui);
  preencherVoos('ida',   d.voosIda   || []);
  preencherVoos('volta', d.voosVolta || []);

  // Preencher foto do destino
  fotoDestinoBase64 = d.fotoDestino || null;
  var img = document.getElementById('previewFotoImg');
  var box = document.getElementById('previewFotoBox');
  if (fotoDestinoBase64 && img && box) {
    img.src = fotoDestinoBase64;
    box.style.display = 'block';
  } else if (box) {
    box.style.display = 'none';
  }

  calcularTotal();
}

function limparFormulario() {
  estadoAtual = { id: null, numero: null };
  ocultarBadge();
  var ids = [
    'cliente','destino','periodo','saida','dataOrcamento',
    'numeroPessoas','roteiro','precoPorPessoa','ocupacao',
    'taxaEmbarque','outrasTaxas','outrasTaxasDesc',
    'entrada','numeroParcelas','pagamento','observacoes',
    'validade','vendedor','inclui','naoInclui'
  ];
  for (var i = 0; i < ids.length; i++) sv(ids[i], '');
  var elData = document.getElementById('dataOrcamento');
  if (elData) elData.value = new Date().toISOString().slice(0, 10);
  voosIda   = [];
  voosVolta = [];
  var cIda   = document.getElementById('containerVoosIda');
  var cVolta = document.getElementById('containerVoosVolta');
  if (cIda)   cIda.innerHTML   = '';
  if (cVolta) cVolta.innerHTML = '';
  adicionarVoo('ida');
  adicionarVoo('volta');
  removerFoto(); // Limpa a foto do destino
  calcularTotal();
  carregarLista();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── STORAGE ───────────────────────────────────────────────

function obterLista() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function gravarLista(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// ── SALVAR ────────────────────────────────────────────────

function salvarOrcamento() {
  var d = lerFormulario();
  if (!d.destino || !d.roteiro) {
    alert('Preencha pelo menos Destino e Roteiro para salvar.');
    return;
  }
  var lista = obterLista();
  var idx   = -1;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === d.id) { idx = i; break; }
  }
  if (idx >= 0) {
    d.numero   = lista[idx].numero;
    lista[idx] = d;
    alert('Orcamento N ' + fmt(d.numero) + ' atualizado!');
  } else {
    d.numero = proximoNumero();
    d.id     = Date.now();
    lista.push(d);
    alert('Orcamento N ' + fmt(d.numero) + ' salvo!');
  }
  estadoAtual.id     = d.id;
  estadoAtual.numero = d.numero;
  mostrarBadge(d.numero);
  gravarLista(lista);
  carregarLista();
}

// ── DUPLICAR ──────────────────────────────────────────────

function duplicarOrcamento() {
  var d = lerFormulario();
  if (!d.destino) {
    alert('Carregue um orcamento antes de duplicar.');
    return;
  }
  estadoAtual = { id: null, numero: null };
  ocultarBadge();
  preencherFormulario(d);
  alert('Orcamento duplicado! Edite e salve como novo.');
}

// ── EXCLUIR ───────────────────────────────────────────────

function excluirOrcamento(id) {
  var lista = obterLista();
  var nova  = [];
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id !== id) nova.push(lista[i]);
  }
  gravarLista(nova);
  if (id === estadoAtual.id) limparFormulario();
  else carregarLista();
}

// ── BUSCA ─────────────────────────────────────────────────

function filtrarLista() {
  var el    = document.getElementById('campoBusca');
  var termo = el ? el.value.toLowerCase() : '';
  var items = document.querySelectorAll('.orcamento-item');
  for (var i = 0; i < items.length; i++) {
    items[i].style.display =
      items[i].textContent.toLowerCase().indexOf(termo) >= 0 ? '' : 'none';
  }
}

// ── LISTA SIDEBAR ─────────────────────────────────────────

function carregarLista() {
  var lista = obterLista();
  var ul    = document.getElementById('listaOrcamentos');
  var cnt   = document.getElementById('sidebarCount');
  ul.innerHTML = '';
  if (cnt) cnt.textContent = lista.length;
  if (!lista.length) {
    var li = document.createElement('li');
    li.textContent   = 'Nenhum orcamento salvo ainda.';
    li.style.cssText = 'font-size:.85rem;color:#666;padding:6px 2px;';
    ul.appendChild(li);
    return;
  }
  var ordenada = lista.slice().sort(function (a, b) { return b.id - a.id; });
  for (var i = 0; i < ordenada.length; i++) {
    criarItemLista(ul, ordenada[i]);
  }
}

function criarItemLista(ul, orc) {
  var hoje = new Date().toISOString().slice(0, 10);
  var li   = document.createElement('li');
  li.className = 'orcamento-item';
  li.setAttribute('data-id', String(orc.id));
  if (orc.id === estadoAtual.id) li.className += ' ativo';
  if (orc.validade) {
    li.style.borderLeft = (orc.validade < hoje)
      ? '4px solid #c0392b' : '4px solid #2c8c3a';
  }

  var topo = document.createElement('div');
  topo.style.cssText =
    'display:flex;align-items:flex-start;' +
    'justify-content:space-between;gap:6px;';

  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:4px;flex:1;';

  if (orc.numero) {
    var numEl = document.createElement('span');
    numEl.textContent = fmt(orc.numero);
    numEl.style.cssText =
      'background:#2c8c3a;color:#fff;font-size:0.68rem;' +
      'font-weight:700;border-radius:4px;padding:2px 6px;flex-shrink:0;';
    wrap.appendChild(numEl);
  }

  var titulo = document.createElement('div');
  titulo.textContent =
    (orc.cliente || 'Sem nome') + ' - ' + (orc.destino || 'Sem destino');
  titulo.style.cssText = 'font-size:0.87rem;font-weight:600;color:#222;';
  wrap.appendChild(titulo);

  var del = document.createElement('button');
  del.textContent   = 'X';
  del.title         = 'Excluir orcamento';
  del.style.cssText =
    'background:#f0f0f0;border:1px solid #ccc;color:#888;' +
    'font-size:0.7rem;padding:2px 6px;border-radius:4px;' +
    'cursor:pointer;flex-shrink:0;margin-left:auto;';
  (function (id) {
    del.onclick = function (e) {
      e.stopPropagation();
      if (confirm('Tem certeza que deseja excluir este orcamento?')) {
        excluirOrcamento(id);
      }
    };
  })(orc.id);

  topo.appendChild(wrap);
  topo.appendChild(del);
  li.appendChild(topo);

  var sub = document.createElement('div');
  sub.style.cssText = 'font-size:0.75rem;color:#666;margin-top:2px;';
  var partes = [];
  if (orc.periodo) partes.push(orc.periodo);
  if (orc.dataOrcamento) {
    var dp = orc.dataOrcamento.split('-');
    partes.push('Criado: ' + dp[2] + '/' + dp[1] + '/' + dp[0]);
  }
  if (orc.validade) {
    var vp = orc.validade.split('-');
    var vStr = 'Val: ' + vp[2] + '/' + vp[1] + '/' + vp[0];
    if (orc.validade < hoje) vStr += ' (EXPIRADO)';
    partes.push(vStr);
  }
  sub.textContent = partes.join(' | ');
  li.appendChild(sub);

  (function (o) {
    li.onclick = function () { carregarOrcamento(o); };
  })(orc);

  ul.appendChild(li);
}

function carregarOrcamento(orc) {
  estadoAtual.id     = orc.id;
  estadoAtual.numero = orc.numero;
  preencherFormulario(orc);
  mostrarBadge(orc.numero);
  carregarLista();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── PDF ───────────────────────────────────────────────────

function imgBase64(src) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var cv  = document.createElement('canvas');
        cv.width  = img.naturalWidth;
        cv.height = img.naturalHeight;
        cv.getContext('2d').drawImage(img, 0, 0);
        resolve(cv.toDataURL('image/png'));
      } catch (e) { resolve(null); }
    };
    img.onerror = function () { resolve(null); };
    img.src = src + '?v=' + Date.now(); // Adiciona timestamp para evitar cache
  });
}

function gerarPDF() {
  var d = lerFormulario();
  if (!d.destino || !d.roteiro) {
    alert('Preencha pelo menos Destino e Roteiro para gerar o PDF.');
    return;
  }
  Promise.all([
    imgBase64('logo-oficina.png'),
    imgBase64('selo30anos.png')
  ]).then(function (imgs) {
    _buildPDF(d, imgs[0], imgs[1], fotoDestinoBase64);
  });
}

function _buildPDF(d, logoB, seloB, fotoB) {
  var jsPDF = window.jspdf.jsPDF;
  var doc   = new jsPDF({
    orientation: 'portrait', unit: 'mm', format: 'a4'
  });

  var PW   = 210, PH = 297, ML = 18, MR = 18;
  var TW   = PW - ML - MR;
  var RBOT = PH - 28;
  var HEND = 42;
  var y    = HEND + 6;

  function rst() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
  }

  function chk(n) {
    if (y + n > RBOT) {
      doc.addPage();
      cabecalho();
      rst();
      y = HEND + 6;
    }
  }

  function cabecalho() {
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, PW, HEND - 4, 'F');
    doc.setDrawColor(30, 74, 125);
    doc.setLineWidth(1.5);
    doc.line(0, HEND - 4, PW, HEND - 4);
    if (logoB) {
      try { doc.addImage(logoB, 'PNG', ML, 5, 0, 32); }
      catch (e) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 74, 125);
        doc.text('Oficina de Turismo', ML, 22);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 74, 125);
      doc.text('Oficina de Turismo', ML, 22);
    }
    if (seloB) {
      try { doc.addImage(seloB, 'PNG', PW - MR - 34, 3, 0, 34); }
      catch (e) {}
    }
    if (d.numero) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text('Orcamento N ' + fmt(d.numero),
               PW - MR, HEND - 8, { align: 'right' });
    }
  }

  function rodape(pag, tot) {
    var ry = PH - 20;
    var cx = PW / 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.25);
    doc.line(ML, ry - 2, PW - MR, ry - 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Oficina de Turismo  -  Tel: (35) 98862-2943  -  (35) 98844-5517',
      cx, ry + 2, { align: 'center' });
    doc.text(
      'Instagram: @oficinadeturismo  -  Site: www.oficinatur.com.br',
      cx, ry + 7, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 74, 125);
    doc.text(
      '30 anos de experiencia em viagens e grupos acompanhados',
      cx, ry + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 180, 180);
    doc.text('Pag. ' + pag + ' / ' + tot,
             PW - MR, ry + 12, { align: 'right' });
  }

  function sec(txt) {
    chk(14);
    doc.setFillColor(30, 74, 125);
    doc.roundedRect(ML, y - 4.5, TW, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(txt, ML + 5, y + 1.5);
    y += 12;
    rst();
  }

  function campo(label, valor) {
    if (!valor) return;
    chk(7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 74, 125);
    var lw = doc.getTextWidth(label + '  ');
    doc.text(label, ML, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(valor, ML + lw, y);
    y += 6.5;
  }

  function bloco(txt, sp) {
    if (!txt) return;
    rst();
    var lns = doc.splitTextToSize(txt, TW);
    for (var i = 0; i < lns.length; i++) {
      chk(5.4);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(lns[i], ML, y);
      y += 5.4;
    }
    if (sp) y += sp;
  }

  function blocoDuplo(t1, txt1, t2, txt2) {
    if (!txt1 && !txt2) return;
    chk(18);
    var cw = TW / 2 - 3;
    var c1 = ML;
    var c2 = ML + TW / 2 + 3;
    if (txt1) {
      doc.setFillColor(44, 140, 58);
      doc.roundedRect(c1, y - 4.5, cw, 9, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(t1, c1 + 4, y + 1.5);
    }
    if (txt2) {
      doc.setFillColor(180, 50, 50);
      doc.roundedRect(c2, y - 4.5, cw, 9, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(t2, c2 + 4, y + 1.5);
    }
    y += 12;
    rst();
    var lns1 = txt1 ? doc.splitTextToSize(txt1, cw - 2) : [];
    var lns2 = txt2 ? doc.splitTextToSize(txt2, cw - 2) : [];
    var max  = Math.max(lns1.length, lns2.length);
    for (var i = 0; i < max; i++) {
      chk(5.4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      if (lns1[i]) doc.text(lns1[i], c1, y);
      if (lns2[i]) doc.text(lns2[i], c2, y);
      y += 5.4;
    }
    y += 5;
  }

  function blocoVoo(titulo, lista) {
    if (!lista || lista.length === 0) return;
    chk(14);
    doc.setFillColor(230, 240, 255);
    doc.roundedRect(ML, y - 4.5, TW, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 74, 125);
    doc.text(titulo, ML + 5, y + 1.5);
    y += 12;
    rst();

    for (var v = 0; v < lista.length; v++) {
      var voo  = lista[v];
      var col1 = ML;
      var col2 = ML + TW / 2 + 4;

      if (lista.length > 1) {
        chk(7);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        var trechoTxt = (v === 0) ? 'Trecho 1' : 'Conexao ' + v;
        if (voo.origem && voo.destino) {
          trechoTxt = trechoTxt + '  ' + voo.origem + ' -> ' + voo.destino;
        }
        doc.text(trechoTxt, ML + 2, y);
        y += 6;
      }

      if (voo.cia || voo.numero) {
        chk(6);
        doc.setFillColor(245, 248, 255);
        doc.rect(col1, y - 3, TW, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 74, 125);
        if (voo.cia) {
          doc.text('Cia:', col1 + 2, y + 1);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(voo.cia, col1 + 12, y + 1);
        }
        if (voo.numero) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 74, 125);
          doc.text('Voo:', col2, y + 1);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(voo.numero, col2 + 12, y + 1);
        }
        y += 7;
      }

      if (voo.origem || voo.destino) {
        chk(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 74, 125);
        doc.text('Origem:', col1 + 2, y + 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(voo.origem || '-', col1 + 20, y + 1);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 74, 125);
        doc.text('Destino:', col2, y + 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(voo.destino || '-', col2 + 22, y + 1);
        y += 7;
      }

      // PARTIDA — data e hora separados no PDF
      if (voo.dataPartida || voo.horaPartida) {
        chk(6);
        doc.setFillColor(245, 248, 255);
        doc.rect(col1, y - 3, TW, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 74, 125);
        doc.text('Partida:', col1 + 2, y + 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        var txtPartida = '';
        if (voo.dataPartida && voo.horaPartida) {
          txtPartida = voo.dataPartida + ' as ' + voo.horaPartida;
        } else {
          txtPartida = voo.dataPartida || voo.horaPartida;
        }
        doc.text(txtPartida, col1 + 22, y + 1);
        y += 7;
      }

      // CHEGADA — data e hora separados no PDF
      if (voo.dataChegada || voo.horaChegada) {
        chk(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 74, 125);
        doc.text('Chegada:', col1 + 2, y + 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        var txtChegada = '';
        if (voo.dataChegada && voo.horaChegada) {
          txtChegada = voo.dataChegada + ' as ' + voo.horaChegada;
        } else {
          txtChegada = voo.dataChegada || voo.horaChegada;
        }
        doc.text(txtChegada, col1 + 24, y + 1);
        y += 7;
      }

      if (voo.obs) {
        chk(6);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 100);
        doc.text('Obs: ' + voo.obs, col1 + 2, y + 1);
        y += 7;
      }

      if (v < lista.length - 1) {
        chk(8);
        doc.setDrawColor(180, 200, 230);
        doc.setLineWidth(0.3);
        doc.line(ML + 10, y, PW - MR - 10, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 74, 125);
        doc.text('>> CONEXAO >>', PW / 2, y + 4, { align: 'center' });
        y += 8;
      }
    }
    y += 4;
  }

  // ── MONTA O PDF ───────────────────────────────────────────

  cabecalho();
  rst();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 74, 125);
  doc.text('Orcamento de Viagem', ML, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(44, 140, 58);
  doc.text(d.destino, ML, y);
  y += 2;

  doc.setDrawColor(44, 140, 58);
  doc.setLineWidth(0.6);
  doc.line(ML, y + 1, PW - MR, y + 1);
  y += 8;

  // FOTO DO DESTINO NO PDF
  if (fotoB) {
    try {
      var fotoH = 65;
      var fotoW = TW;
      chk(fotoH + 4);
      doc.addImage(fotoB, 'JPEG', ML, y, fotoW, fotoH,
                   '', 'FAST');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(ML, y, fotoW, fotoH);
      y += fotoH + 5;
    } catch (e) {}
  }

  if (d.validade) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 100, 0);
    var vp = d.validade.split('-');
    doc.text('Valido ate: ' + vp[2] + '/' + vp[1] + '/' + vp[0],
             PW - MR, y - 4, { align: 'right' });
  }

  rst();
  doc.setFontSize(9.5);
  var dadosBrutos = [
    d.cliente       ? ['Cliente:',     d.cliente]       : null,
    d.saida         ? ['Saida de:',    d.saida]         : null,
    d.periodo       ? ['Periodo:',     d.periodo]       : null,
    d.dataOrcamento ? (function () {
      var dp = d.dataOrcamento.split('-');
      return ['Data:', dp[2] + '/' + dp[1] + '/' + dp[0]];
    })() : null,
    d.numeroPessoas ? ['Passageiros:', d.numeroPessoas + ' pessoa(s)'] : null,
    d.vendedor      ? ['Consultor:',   d.vendedor]      : null
  ];

  var dados = [];
  for (var i = 0; i < dadosBrutos.length; i++) {
    if (dadosBrutos[i]) dados.push(dadosBrutos[i]);
  }

  var c1 = ML, c2 = ML + TW / 2 + 4;
  for (var i = 0; i < dados.length; i++) {
    var xp = (i % 2 === 0) ? c1 : c2;
    if (i % 2 === 0 && i > 0) y += 6.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 74, 125);
    var lw = doc.getTextWidth(dados[i][0] + ' ');
    doc.text(dados[i][0], xp, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(dados[i][1], xp + lw, y);
  }
  y += 10;

  var temIda   = d.voosIda   && d.voosIda.length   > 0;
  var temVolta = d.voosVolta && d.voosVolta.length  > 0;
  if (temIda || temVolta) {
    sec('INFORMACOES DE VOO');
    if (temIda)   blocoVoo('VOO DE IDA',   d.voosIda);
    if (temVolta) blocoVoo('VOO DE VOLTA', d.voosVolta);
  }

  sec('ROTEIRO / PROGRAMACAO DA VIAGEM');
  bloco(d.roteiro, 5);

  sec('INVESTIMENTO');
  campo('Valor por pessoa:', d.precoPorPessoa);
  if (d.ocupacao) campo('Base de ocupacao:', d.ocupacao);

  var pp   = toFloat(d.precoPorPessoa);
  var taxa = toFloat(d.taxaEmbarque);
  var out  = toFloat(d.outrasTaxas);
  var np2  = parseInt(d.numeroPessoas, 10);

  if (taxa > 0) campo('Taxa de embarque por pessoa:', brFmt(taxa));
  if (out  > 0) {
    var descOut = (d.outrasTaxasDesc && d.outrasTaxasDesc.length > 0)
      ? d.outrasTaxasDesc : 'Outras taxas';
    campo(descOut + ' por pessoa:', brFmt(out));
  }

  var totalPP = pp + taxa + out;
  if (totalPP > 0) {
    chk(8);
    doc.setFillColor(230, 245, 235);
    doc.roundedRect(ML, y - 3, TW, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(44, 140, 58);
    doc.text('Total por pessoa:', ML + 4, y + 2);
    doc.text(brFmt(totalPP), PW - MR - 4, y + 2, { align: 'right' });
    y += 10;
  }

  if (np2 > 0 && totalPP > 0) {
    chk(8);
    doc.setFillColor(210, 235, 215);
    doc.roundedRect(ML, y - 3, TW, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 74, 125);
    doc.text('Total do grupo (' + np2 + ' pax):', ML + 4, y + 2);
    doc.text(brFmt(totalPP * np2), PW - MR - 4, y + 2, { align: 'right' });
    y += 10;
  }
  y += 2;

  sec('FORMA DE PAGAMENTO');
  var entradaV  = toFloat(d.entrada);
  var parcelasV = parseInt(d.numeroParcelas, 10);
  if (totalPP > 0 && parcelasV > 0) {
    var vlParcela = 0;
    if (entradaV > 0) {
      vlParcela = (totalPP - entradaV) / parcelasV;
      campo('Entrada por pessoa:', brFmt(entradaV));
      campo(parcelasV + ' parcelas de:', brFmt(vlParcela));
    } else {
      vlParcela = totalPP / parcelasV;
      campo(parcelasV + ' parcelas de:', brFmt(vlParcela));
    }
    campo('Total por pessoa:', brFmt(totalPP));
    if (np2 > 0) campo('Total do grupo:', brFmt(totalPP * np2));
  }
  if (d.pagamento) bloco(d.pagamento, 3);
  y += 2;

  if (d.inclui || d.naoInclui) {
    blocoDuplo('O PACOTE INCLUI', d.inclui, 'NAO INCLUI', d.naoInclui);
  }

  if (d.observacoes) {
    sec('OBSERVACOES / CONDICOES GERAIS');
    bloco(d.observacoes, 5);
  }

  var tot = doc.getNumberOfPages();
  for (var p = 1; p <= tot; p++) {
    doc.setPage(p);
    rodape(p, tot);
  }

  var nd  = limparNome(d.destino || 'Oficina');
  var nc  = limparNome(d.cliente || '');
  if (nc.length > 20) nc = nc.slice(0, 20);
  var num = d.numero ? '_' + fmt(d.numero) : '';
  var nomeFinal = 'Orcamento' + num + '_' + nd;
  if (nc) nomeFinal += '_' + nc;
  doc.save(nomeFinal + '.pdf');
}
