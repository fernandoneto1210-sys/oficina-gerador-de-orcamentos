var STORAGE_KEY = 'oficina_orcamentos_v3';
var COUNTER_KEY = 'oficina_contador_v3';
var estadoAtual = { id: null, numero: null };

window.addEventListener('load', function () {
  document.getElementById('btnSalvar').onclick   = salvarOrcamento;
  document.getElementById('btnGerar').onclick    = gerarPDF;
  document.getElementById('btnLimpar').onclick   = limparFormulario;
  document.getElementById('btnNovo').onclick     = limparFormulario;
  document.getElementById('btnDuplicar').onclick = duplicarOrcamento;

  var elData = document.getElementById('dataOrcamento');
  if (elData) elData.value = new Date().toISOString().split('T')[0];

  var np = document.getElementById('numeroPessoas');
  var pp = document.getElementById('precoPorPessoa');
  if (np) np.addEventListener('input', calcularTotal);
  if (pp) pp.addEventListener('input', calcularTotal);

  carregarLista();
});

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
  var partes = v.toFixed(2).split('.');
  var inteiro = partes[0];
  var decimal = partes[1];
  var resultado = '';
  var count = 0;
  for (var i = inteiro.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) resultado = '.' + resultado;
    resultado = inteiro[i] + resultado;
    count++;
  }
  return 'R$ ' + resultado + ',' + decimal;
}

function somenteNumeros(str) {
  var r = '';
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c >= '0' && c <= '9') r += c;
    if (c === ',' || c === '.') r += c;
  }
  return r;
}

function limparNome(str) {
  var ok = 'abcdefghijklmnopqrstuvwxyz' +
           'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
           '0123456789_- ';
  var r = '';
  for (var i = 0; i < str.length; i++) {
    if (ok.indexOf(str[i]) >= 0) r += str[i];
  }
  var resultado = '';
  for (var i = 0; i < r.length; i++) {
    resultado += (r[i] === ' ') ? '_' : r[i];
  }
  if (resultado.length > 25) resultado = resultado.slice(0, 25);
  return resultado;
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

function calcularTotal() {
  var npEl  = document.getElementById('numeroPessoas');
  var ppEl  = document.getElementById('precoPorPessoa');
  var totEl = document.getElementById('totalCalculado');
  var detEl = document.getElementById('totalDetalhe');
  if (!npEl || !ppEl || !totEl) return;

  var np  = parseInt(npEl.value, 10);
  var raw = somenteNumeros(ppEl.value);
  var pos = raw.indexOf(',');
  if (pos >= 0) {
    raw = raw.slice(0, pos) + '.' + raw.slice(pos + 1);
  }
  var pp = parseFloat(raw);

  if (isNaN(np) || np <= 0 || isNaN(pp) || pp <= 0) {
    totEl.textContent = '-';
    if (detEl) detEl.textContent = '';
    return;
  }
  totEl.textContent = brFmt(np * pp);
  if (detEl) detEl.textContent = np + ' pessoa(s) x ' + brFmt(pp);
}

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
    id:             estadoAtual.id     || null,
    numero:         estadoAtual.numero || null,
    cliente:        gv('cliente'),
    destino:        gv('destino'),
    periodo:        gv('periodo'),
    saida:          gv('saida'),
    dataOrcamento:  gv('dataOrcamento'),
    numeroPessoas:  gv('numeroPessoas'),
    roteiro:        gv('roteiro'),
    precoPorPessoa: gv('precoPorPessoa'),
    ocupacao:       gv('ocupacao'),
    pagamento:      gv('pagamento'),
    observacoes:    gv('observacoes'),
    validade:       gv('validade'),
    vendedor:       gv('vendedor'),
    inclui:         gv('inclui'),
    naoInclui:      gv('naoInclui')
  };
}

function preencherFormulario(d) {
  sv('cliente',        d.cliente);
  sv('destino',        d.destino);
  sv('periodo',        d.periodo);
  sv('saida',          d.saida);
  sv('dataOrcamento',  d.dataOrcamento);
  sv('numeroPessoas',  d.numeroPessoas);
  sv('roteiro',        d.roteiro);
  sv('precoPorPessoa', d.precoPorPessoa);
  sv('ocupacao',       d.ocupacao);
  sv('pagamento',      d.pagamento);
  sv('observacoes',    d.observacoes);
  sv('validade',       d.validade);
  sv('vendedor',       d.vendedor);
  sv('inclui',         d.inclui);
  sv('naoInclui',      d.naoInclui);
  calcularTotal();
}

function limparFormulario() {
  estadoAtual = { id: null, numero: null };
  ocultarBadge();
  var ids = [
    'cliente', 'destino', 'periodo', 'saida', 'dataOrcamento',
    'numeroPessoas', 'roteiro', 'precoPorPessoa', 'ocupacao',
    'pagamento', 'observacoes', 'validade', 'vendedor',
    'inclui', 'naoInclui'
  ];
  for (var i = 0; i < ids.length; i++) sv(ids[i], '');
  var elData = document.getElementById('dataOrcamento');
  if (elData) elData.value = new Date().toISOString().split('T')[0];
  calcularTotal();
  carregarLista();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function obterLista() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function gravarLista(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function salvarOrcamento() {
  var d = lerFormulario();
  if (!d.destino || !d.roteiro) {
    alert('Preencha pelo menos Destino e Roteiro para salvar.');
    return;
  }
  var lista = obterLista();
  var idx = -1;
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

function excluirOrcamento(id) {
  var lista = obterLista();
  var nova  = [];
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id !== id) nova.push(lista[i]);
  }
  gravarLista(nova);
  if (id === estadoAtual.id) {
    limparFormulario();
  } else {
    carregarLista();
  }
}

function filtrarLista() {
  var el    = document.getElementById('campoBusca');
  var termo = el ? el.value.toLowerCase() : '';
  var items = document.querySelectorAll('.orcamento-item');
  for (var i = 0; i < items.length; i++) {
    var txt = items[i].textContent.toLowerCase();
    items[i].style.display = (txt.indexOf(termo) >= 0) ? '' : 'none';
  }
}

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

  var ordenada = lista.slice().sort(function (a, b) {
    return b.id - a.id;
  });

  for (var i = 0; i < ordenada.length; i++) {
    criarItemLista(ul, ordenada[i]);
  }
}

function criarItemLista(ul, orc) {
  var hoje = new Date().toISOString().slice(0, 10);

  var li = document.createElement('li');
  li.className = 'orcamento-item';
  li.setAttribute('data-id', String(orc.id));
  if (orc.id === estadoAtual.id) li.className += ' ativo';
  if (orc.validade) {
    li.style.borderLeft = (orc.validade < hoje)
      ? '4px solid #c0392b'
      : '4px solid #2c8c3a';
  }

  var topo = document.createElement('div');
  topo.style.cssText =
    'display:flex;align-items:flex-start;justify-content:space-between;gap:6px;';

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
  del.textContent = 'X';
  del.title       = 'Excluir';
  del.style.cssText =
    'border:none;background:transparent;cursor:pointer;' +
    'font-size:12px;padding:0 2px;opacity:0.5;flex-shrink:0;color:#c0392b;font-weight:700;';

  (function (oid, onum) {
    del.onclick = function (e) {
      e.stopPropagation();
      if (confirm('Excluir orcamento N ' + fmt(onum || 0) + '?')) {
        excluirOrcamento(oid);
      }
    };
  })(orc.id, orc.numero);

  topo.appendChild(wrap);
  topo.appendChild(del);

  var meta = document.createElement('div');
  meta.style.cssText = 'font-size:0.74rem;color:#888;margin-top:3px;';
  var partes = [];
  if (orc.dataOrcamento) {
    var dp = orc.dataOrcamento.split('-');
    partes.push(dp[2] + '/' + dp[1] + '/' + dp[0]);
  }
  if (orc.periodo)       partes.push(orc.periodo);
  if (orc.numeroPessoas) partes.push(orc.numeroPessoas + ' pax');
  meta.textContent = partes.length ? partes.join(' | ') : '-';

  li.appendChild(topo);
  li.appendChild(meta);

  (function (oid, onum,orcamento) {
    li.onclick = function () {
      preencherFormulario(orcamento);
      estadoAtual.id     = oid;
      estadoAtual.numero = onum;
      if (onum) mostrarBadge(onum);
      var items = document.querySelectorAll('.orcamento-item');
      for (var j = 0; j < items.length; j++) {
        items[j].className = 'orcamento-item';
      }
      li.className = 'orcamento-item ativo';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  })(orc.id, orc.numero, orc);

  ul.appendChild(li);
}

function imgBase64(src) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var c = document.createElement('canvas');
        c.width  = img.naturalWidth  || 300;
        c.height = img.naturalHeight || 300;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch (e) { resolve(null); }
    };
    img.onerror = function () { resolve(null); };
    img.src = src + '?v=' + Date.now();
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
    _buildPDF(d, imgs[0], imgs[1]);
  });
}

function _buildPDF(d, logoB, seloB) {
  var jsPDF = window.jspdf.jsPDF;
  var doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

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

  function chk(n) { if (y + n > RBOT) novaPag(); }

  function novaPag() {
    doc.addPage();
    cabecalho();
    rst();
    y = HEND + 6;
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
    doc.text('Oficina de Turismo  -  Tel / WhatsApp: (35) 98862-2943  -  (35) 98844-5517',
             cx, ry + 2, { align: 'center' });
    doc.text('Instagram: @oficinadeturismo  -  Site: www.oficinatur.com.br',
             cx, ry + 7, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 74, 125);
    doc.text('30 anos de experiencia em viagens e grupos acompanhados',
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
    var lh  = 5.4;
    for (var i = 0; i < lns.length; i++) {
      chk(lh);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(lns[i], ML, y);
      y += lh;
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

  var c1 = ML;
  var c2 = ML + TW / 2 + 4;
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

  sec('ROTEIRO / PROGRAMACAO DA VIAGEM');
  bloco(d.roteiro, 5);

  sec('INVESTIMENTO');
  campo('Valor por pessoa:', d.precoPorPessoa);
  if (d.ocupacao) campo('Base de ocupacao:', d.ocupacao);

  var np2  = parseInt(d.numeroPessoas, 10);
  var raw2 = somenteNumeros(d.precoPorPessoa || '');
  var pos2 = raw2.indexOf(',');
  if (pos2 >= 0) raw2 = raw2.slice(0, pos2) + '.' + raw2.slice(pos2 + 1);
  var pp2 = parseFloat(raw2);
  if (np2 > 0 && pp2 > 0) {
    campo('Total do grupo (' + np2 + ' pax):', brFmt(np2 * pp2));
  }
  y += 2;

  if (d.pagamento) {
    sec('FORMA DE PAGAMENTO');
    bloco(d.pagamento, 5);
  }

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
