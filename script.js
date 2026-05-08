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
  if (elData) elData.value = new Date().toISOString().slice(0, 10);

  var ids = ['numeroPessoas','precoPorPessoa','taxaEmbarque',
             'outrasTaxas','entrada','numeroParcelas'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.addEventListener('input', calcularTotal);
  }

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
  var partes  = v.toFixed(2).split('.');
  var inteiro = partes[0];
  var decimal = partes[1];
  var res = '';
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
  var r = '';
  var temVirgula = false;
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c >= '0' && c <= '9') r += c;
    if (c === ',' && !temVirgula) { r += '.'; temVirgula = true; }
    if (c === '.' && !temVirgula) { r += '.'; temVirgula = true; }
  }
  var v = parseFloat(r);
  return isNaN(v) ? 0 : v;
}

function limparNome(str) {
  var ok = 'abcdefghijklmnopqrstuvwxyz' +
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
    if (totPP)    totPP.textContent  = '-';
    if (totEl)    totEl.textContent  = '-';
    if (detEl)    detEl.textContent  = '';
    if (resumoEl) resumoEl.textContent =
      'Preencha os campos acima para calcular o parcelamento.';
    return;
  }

  var totalPessoa = pp + taxa + outras;
  var totalGrupo  = totalPessoa * np;

  if (totPP) totPP.textContent = brFmt(totalPessoa);
  if (totEl) totEl.textContent = brFmt(totalGrupo);
  if (detEl) detEl.textContent =
    np + ' pess. x ' + brFmt(totalPessoa);

  // calculo do parcelamento
  if (resumoEl) {
    if (parcelas > 0) {
      var restante = totalPessoa;
      var txt = '';
      if (entrada > 0) {
        restante = totalPessoa - entrada;
        txt += 'Entrada: ' + brFmt(entrada) + ' por pessoa';
        if (parcelas > 0 && restante > 0) {
          var vlParcela = restante / parcelas;
          txt += '  +  ' + parcelas + 'x de ' + brFmt(vlParcela) + ' por pessoa';
        }
      } else {
        var vlParcela = totalPessoa / parcelas;
        txt += parcelas + 'x de ' + brFmt(vlParcela) + ' por pessoa';
      }
      txt += '   |   Total por pessoa: ' + brFmt(totalPessoa);
      txt += '   |   Total grupo: ' + brFmt(totalGrupo);
      resumoEl.textContent = txt;
    } else {
      resumoEl.textContent =
        'Informe o numero de parcelas para calcular o parcelamento.';
    }
  }
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
    id:              estadoAtual.id     || null,
    numero:          estadoAtual.numero || null,
    cliente:         gv('cliente'),
    destino:         gv('destino'),
    periodo:         gv('periodo'),
    saida:           gv('saida'),
    dataOrcamento:   gv('dataOrcamento'),
    numeroPessoas:   gv('numeroPessoas'),
    validade:        gv('validade'),
    vendedor:        gv('vendedor'),
    roteiro:         gv('roteiro'),
    precoPorPessoa:  gv('precoPorPessoa'),
    ocupacao:        gv('ocupacao'),
    taxaEmbarque:    gv('taxaEmbarque'),
    outrasTaxas:     gv('outrasTaxas'),
    outrasTaxasDesc: gv('outrasTaxasDesc'),
    entrada:         gv('entrada'),
    numeroParcelas:  gv('numeroParcelas'),
    pagamento:       gv('pagamento'),
    inclui:          gv('inclui'),
    naoInclui:       gv('naoInclui'),
    observacoes:     gv('observacoes'),
    vooIdaCia:       gv('vooIdaCia'),
    vooIdaNumero:    gv('vooIdaNumero'),
    vooIdaOrigem:    gv('vooIdaOrigem'),
    vooIdaDestino:   gv('vooIdaDestino'),
    vooIdaPartida:   gv('vooIdaPartida'),
    vooIdaChegada:   gv('vooIdaChegada'),
    vooIdaObs:       gv('vooIdaObs'),
    vooVoltaCia:     gv('vooVoltaCia'),
    vooVoltaNumero:  gv('vooVoltaNumero'),
    vooVoltaOrigem:  gv('vooVoltaOrigem'),
    vooVoltaDestino: gv('vooVoltaDestino'),
    vooVoltaPartida: gv('vooVoltaPartida'),
    vooVoltaChegada: gv('vooVoltaChegada'),
    vooVoltaObs:     gv('vooVoltaObs')
  };
}

function preencherFormulario(d) {
  var campos = [
    'cliente','destino','periodo','saida','dataOrcamento',
    'numeroPessoas','validade','vendedor','roteiro',
    'precoPorPessoa','ocupacao','taxaEmbarque','outrasTaxas',
    'outrasTaxasDesc','entrada','numeroParcelas','pagamento',
    'inclui','naoInclui','observacoes',
    'vooIdaCia','vooIdaNumero','vooIdaOrigem','vooIdaDestino',
    'vooIdaPartida','vooIdaChegada','vooIdaObs',
    'vooVoltaCia','vooVoltaNumero','vooVoltaOrigem','vooVoltaDestino',
    'vooVoltaPartida','vooVoltaChegada','vooVoltaObs'
  ];
  for (var i = 0; i < campos.length; i++) {
    sv(campos[i], d[campos[i]]);
  }
  calcularTotal();
}

function limparFormulario() {
  estadoAtual = { id: null, numero: null };
  ocultarBadge();
  var campos = [
    'cliente','destino','periodo','saida','dataOrcamento',
    'numeroPessoas','validade','vendedor','roteiro',
    'precoPorPessoa','ocupacao','taxaEmbarque','outrasTaxas',
    'outrasTaxasDesc','entrada','numeroParcelas','pagamento',
    'inclui','naoInclui','observacoes',
    'vooIdaCia','vooIdaNumero','vooIdaOrigem','vooIdaDestino',
    'vooIdaPartida','vooIdaChegada','vooIdaObs',
    'vooVoltaCia','vooVoltaNumero','vooVoltaOrigem','vooVoltaDestino',
    'vooVoltaPartida','vooVoltaChegada','vooVoltaObs'
  ];
  for (var i = 0; i < campos.length; i++) sv(campos[i], '');
  var elData = document.getElementById('dataOrcamento');
  if (elData) elData.value = new Date().toISOString().slice(0, 10);
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
  if (id === estadoAtual.id) limparFormulario();
  else carregarLista();
}

function filtrarLista() {
  var el    = document.getElementById('campoBusca');
  var termo = el ? el.value.toLowerCase() : '';
  var items = document.querySelectorAll('.orcamento-item');
  for (var i = 0; i < items.length; i++) {
    items[i].style.display =
      items[i].textContent.toLowerCase().indexOf(termo) >= 0 ? '' : 'none';
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
  wrap.style.cssText =
    'display:flex;align-items:flex-start;gap:4px;flex:1;';

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
  titulo.style.cssText =
    'font-size:0.87rem;font-weight:600;color:#222;';
  wrap.appendChild(titulo);

  var del = document.createElement('button');
  del.textContent   = 'X';
  del.title         = 'Excluir';
  del.style.cssText =
    'border:none;background:transparent;cursor:pointer;' +
    'font-size:12px;padding:0 4px;color:#c0392b;font-weight:700;';

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

  (function (oid, onum, orcamento) {
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
    doc.addPage(); cabecalho(); rst(); y = HEND + 6;
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
      'Oficina de Turismo  -  Tel / WhatsApp: (35) 98862-2943  -  (35) 98844-5517',
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

  function linhaVoo(label, valor) {
    if (!valor) return;
    chk(6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 74, 125);
    var lw = doc.getTextWidth(label + '  ');
    doc.text(label, ML + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(valor, ML + 4 + lw, y);
    y += 5.8;
  }

  function secVoo(titulo, cia, numero, origem, destino, partida, chegada, obs) {
    var temDados = cia || numero || origem || destino || partida || chegada || obs;
    if (!temDados) return;
    chk(40);

    // fundo azul claro
    doc.setFillColor(230, 240, 255);
    doc.roundedRect(ML, y - 3, TW, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 74, 125);
    doc.text(titulo, ML + 4, y + 2);
    y += 10;

    // tabela do voo
    var colW = TW / 2 - 2;
    if (cia || numero) {
      doc.setFillColor(245, 248, 255);
      doc.rect(ML, y - 3, TW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 74, 125);
      doc.text('Cia Aerea:', ML + 2, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(cia || '-', ML + 24, y + 1);
      if (numero) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 74, 125);
        doc.text('Voo:', ML + colW + 2, y + 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(numero, ML + colW + 14, y + 1);
      }
      y += 7;
    }

    if (origem || destino) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 74, 125);
      doc.text('Origem:', ML + 2, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(origem || '-', ML + 20, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 74, 125);
      doc.text('Destino:', ML + colW + 2, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(destino || '-', ML + colW + 22, y + 1);
      y += 7;
    }

    if (partida || chegada) {
      doc.setFillColor(245, 248, 255);
      doc.rect(ML, y - 3, TW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 74, 125);
      doc.text('Partida:', ML + 2, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(partida || '-', ML + 20, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 74, 125);
      doc.text('Chegada:', ML + colW + 2, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(chegada || '-', ML + colW + 24, y + 1);
      y += 7;
    }

    if (obs) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text('Obs: ' + obs, ML + 4, y + 1);
      y += 7;
    }
    y += 3;
  }

  // ── CONSTROI O PDF ────────────────────────────────────────

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
    d.vendedor      ? ['Consultor:',  d.vendedor]       : null
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

  // VOOS
  var temVoos = d.vooIdaCia || d.vooIdaOrigem || d.vooVoltaCia || d.vooVoltaOrigem;
  if (temVoos) {
    sec('INFORMACOES DE VOO');
    secVoo('VOO DE IDA',
      d.vooIdaCia, d.vooIdaNumero, d.vooIdaOrigem,
      d.vooIdaDestino, d.vooIdaPartida, d.vooIdaChegada, d.vooIdaObs);
    secVoo('VOO DE VOLTA',
      d.vooVoltaCia, d.vooVoltaNumero, d.vooVoltaOrigem,
      d.vooVoltaDestino, d.vooVoltaPartida, d.vooVoltaChegada, d.vooVoltaObs);
  }

  // ROTEIRO
  sec('ROTEIRO / PROGRAMACAO DA VIAGEM');
  bloco(d.roteiro, 5);

  // INVESTIMENTO
  sec('INVESTIMENTO');
  campo('Valor por pessoa:', d.precoPorPessoa);
  if (d.ocupacao) campo('Base de ocupacao:', d.ocupacao);

  var pp   = toFloat(d.precoPorPessoa);
  var taxa = toFloat(d.taxaEmbarque);
  var out  = toFloat(d.outrasTaxas);
  var np2  = parseInt(d.numeroPessoas, 10);

  if (taxa > 0) campo('Taxa de embarque por pessoa:', brFmt(taxa));
  if (out  > 0) {
    var descTaxa = d.outrasTaxasDesc ? d.outrasTaxasDesc : 'Outras taxas';
    campo(descTaxa + ' por pessoa:', brFmt(out));
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
    doc.setFillColor(220, 240, 225);
    doc.roundedRect(ML, y - 3, TW, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 74, 125);
    doc.text('Total do grupo (' + np2 + ' pax):', ML + 4, y + 2);
    doc.text(brFmt(totalPP * np2), PW - MR - 4, y + 2, { align: 'right' });
    y += 10;
  }
  y += 2;

  // FORMA DE PAGAMENTO
  sec('FORMA DE PAGAMENTO');
  var entrada  = toFloat(d.entrada);
  var parcelas = parseInt(d.numeroParcelas, 10);
  if (totalPP > 0 && parcelas > 0) {
    if (entrada > 0) {
      var restante  = totalPP - entrada;
      var vlParcela = restante / parcelas;
      campo('Entrada por pessoa:', brFmt(entrada));
      campo(parcelas + ' parcelas de:', brFmt(vlParcela));
      campo('Total por pessoa:', brFmt(totalPP));
    } else {
      var vlParcela = totalPP / parcelas;
      campo(parcelas + ' parcelas de:', brFmt(vlParcela));
      campo('Total por pessoa:', brFmt(totalPP));
    }
    if (np2 > 0) {
      campo('Total do grupo:', brFmt(totalPP * np2));
    }
  }
  if (d.pagamento) bloco(d.pagamento, 3);
  y += 2;

  // INCLUI / NAO INCLUI
  if (d.inclui || d.naoInclui) {
    blocoDuplo('O PACOTE INCLUI', d.inclui, 'NAO INCLUI', d.naoInclui);
  }

  // OBSERVACOES
  if (d.observacoes) {
    sec('OBSERVACOES / CONDICOES GERAIS');
    bloco(d.observacoes, 5);
  }

  // rodape
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
