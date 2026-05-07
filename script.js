var STORAGE_KEY = 'oficina_orcamentos_v3';
var COUNTER_KEY = 'oficina_contador_v3';
var estadoAtual = { id: null, numero: null };

window.addEventListener('load', function () {
  document.getElementById('btnSalvar').onclick = salvarOrcamento;
  document.getElementById('btnGerar').onclick  = gerarPDF;
  document.getElementById('btnLimpar').onclick = limparFormulario;
  document.getElementById('btnNovo').onclick   = limparFormulario;

  var elData = document.getElementById('dataOrcamento');
  if (elData) elData.value = new Date().toISOString().split('T')[0];

  carregarLista();
});

function proximoNumero() {
  var n = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(COUNTER_KEY, String(n));
  return n;
}

function fmt(n) {
  return String(n).padStart(3, '0');
}

function mostrarBadge(numero) {
  estadoAtual.numero = numero;
  var el = document.getElementById('numeroBadge');
  var vl = document.getElementById('numeroAtualValor');
  if (!el || !vl) return;
  vl.textContent  = 'N ' + fmt(numero);
  el.style.display = 'flex';
}

function ocultarBadge() {
  var el = document.getElementById('numeroBadge');
  if (el) el.style.display = 'none';
  estadoAtual = { id: null, numero: null };
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
    id:             estadoAtual.id || null,
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
    observacoes:    gv('observacoes')
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
}

function limparFormulario() {
  estadoAtual = { id: null, numero: null };
  ocultarBadge();
  var ids = ['cliente','destino','periodo','saida','dataOrcamento',
             'numeroPessoas','roteiro','precoPorPessoa','ocupacao',
             'pagamento','observacoes'];
  ids.forEach(function(id) { sv(id, ''); });
  var elData = document.getElementById('dataOrcamento');
  if (elData) elData.value = new Date().toISOString().split('T')[0];
  carregarLista();
}

function obterLista() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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

function excluirOrcamento(id) {
  var nova = obterLista().filter(function (o) {
    return o.id !== id;
  });
  gravarLista(nova);
  if (id === estadoAtual.id) {
    limparFormulario();
  } else {
    carregarLista();
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

  lista.slice().sort(function (a, b) {
    return b.id - a.id;
  }).forEach(function (orc) {

    var li        = document.createElement('li');
    li.className  = 'orcamento-item';
    li.dataset.id = orc.id;
    if (orc.id === estadoAtual.id) li.classList.add('ativo');

    var topo = document.createElement('div');
    topo.style.cssText =
      'display:flex;align-items:flex-start;' +
      'justify-content:space-between;gap:6px;';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:4px;flex:1;';

    if (orc.numero) {
      var num = document.createElement('span');
      num.style.cssText =
        'background:#2c8c3a;color:#fff;font-size:0.68rem;' +
        'font-weight:700;border-radius:4px;padding:2px 6px;flex-shrink:0;';
      num.textContent = fmt(orc.numero);
      wrap.appendChild(num);
    }

    var txt = document.createElement('div');
    txt.style.cssText  = 'font-size:0.87rem;font-weight:600;color:#222;line-height:1.35;flex:1;';
    txt.textContent    = (orc.cliente || 'Sem nome') + ' - ' + (orc.destino || 'Sem destino');
    wrap.appendChild(txt);

    var del = document.createElement('button');
    del.textContent   = 'X';
    del.title         = 'Excluir';
    del.style.cssText =
      'border:none;background:#fee2e2;color:#c0392b;cursor:pointer;' +
      'font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;' +
      'opacity:0.7;flex-shrink:0;';
    del.onmouseover = function () { this.style.opacity = '1'; };
    del.onmouseout  = function () { this.style.opacity = '0.7'; };

    (function (oid, onum) {
      del.onclick = function (e) {
        e.stopPropagation();
        if (confirm('Excluir orcamento N ' + fmt(onum || 0) + '?')) {
          excluirOrcamento(oid);
        }
      };
      li.onclick = function () {
        var lista2 = obterLista();
        var found  = null;
        for (var i = 0; i < lista2.length; i++) {
          if (lista2[i].id === oid) { found = lista2[i]; break; }
        }
        if (!found) return;
        estadoAtual.id     = found.id;
        estadoAtual.numero = found.numero;
        preencherFormulario(found);
        mostrarBadge(found.numero);
        carregarLista();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    })(orc.id, orc.numero);

    var meta = document.createElement('div');
    meta.style.cssText = 'font-size:0.74rem;color:#888;margin-top:3px;';
    var partes = [];
    if (orc.dataOrcamento) {
      partes.push(orc.dataOrcamento.split('-').reverse().join('/'));
    }
    if (orc.periodo)       partes.push(orc.periodo);
    if (orc.numeroPessoas) partes.push(orc.numeroPessoas + ' pax');
    meta.textContent = partes.join(' | ') || '-';

    topo.appendChild(wrap);
    topo.appendChild(del);
    li.appendChild(topo);
    li.appendChild(meta);
    ul.appendChild(li);
  });
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
    img.src = src + '?cb=' + Date.now();
  });
}

function gerarPDF() {
  var d = lerFormulario();
  if (!d.destino || !d.roteiro || !d.precoPorPessoa) {
    alert('Preencha pelo menos: Destino, Roteiro e Valor por pessoa.');
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

  var PW = 210, PH = 297, ML = 18, MR = 18;
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
    var ry = PH - 20, cx = PW / 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.25);
    doc.line(ML, ry - 2, PW - MR, ry - 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Oficina de Turismo  -  Tel / WhatsApp: (35) 98862-2943  -  (35) 98844-5517',
      cx, ry + 2, { align: 'center' }
    );
    doc.text(
      'Instagram: @oficinadeturismo  -  Site: www.oficinatur.com.br',
      cx, ry + 7, { align: 'center' }
    );
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 74, 125);
    doc.text(
      '30 anos de experiencia em viagens e grupos acompanhados',
      cx, ry + 12, { align: 'center' }
    );
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
    lns.forEach(function (ln) {
      chk(lh);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(ln, ML, y);
      y += lh;
    });
    if (sp) y += sp;
  }

  // CONSTROI O PDF
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

  rst();
  doc.setFontSize(9.5);
  var c1 = ML, c2 = ML + TW / 2 + 4;
  var dados = [
    d.cliente       ? ['Cliente:',      d.cliente]      : null,
    d.saida         ? ['Saida de:',     d.saida]        : null,
    d.periodo       ? ['Periodo:',      d.periodo]      : null,
    d.dataOrcamento ? ['Data:',
      d.dataOrcamento.split('-').reverse().join('/')]    : null,
    d.numeroPessoas ? ['Passageiros:',
      d.numeroPessoas + ' pessoa(s)']                   : null
  ].filter(Boolean);

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
  y += 2;

  if (d.pagamento) {
    sec('FORMA DE PAGAMENTO');
    bloco(d.pagamento, 5);
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

  // CORRECAO DEFINITIVA — sem regex com acentos
  function limparNome(str) {
    return str
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 25);
  }

  var nd  = limparNome(d.destino || 'Oficina');
  var nc  = limparNome(d.cliente || '').slice(0, 20);
  var num = d.numero ? '_' + fmt(d.numero) : '';
  doc.save('Orcamento' + num + '_' + nd + (nc ? '_' + nc : '') + '.pdf');
}
