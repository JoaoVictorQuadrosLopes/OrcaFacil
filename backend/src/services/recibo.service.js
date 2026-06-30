const PDFDocument = require('pdfkit');
const { obterLogo } = require('./empresa.service');

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function linha(doc, y, cor = '#e5e7eb') {
  doc.moveTo(45, y).lineTo(550, y).strokeColor(cor).lineWidth(1).stroke();
}

function nomeLegal(empresa) {
  return empresa.razaoSocial || empresa.nomeFantasia || 'Empresa';
}

function gerarCabecalho(doc, empresa) {
  const logo = obterLogo();
  const x = logo ? 120 : 45;

  if (logo) {
    doc.image(logo.buffer, 45, 35, { width: 62, height: 62, fit: [62, 62] });
  }

  doc
    .fillColor('#111827')
    .fontSize(18)
    .text(empresa.nomeFantasia || 'Empresa', x, 40, { width: 550 - x });

  if (empresa.atividade) {
    doc
      .fillColor('#374151')
      .fontSize(10)
      .text(empresa.atividade, x, 63, { width: 550 - x });
  }

  const identificacao = [
    empresa.documento ? `CPF/CNPJ: ${empresa.documento}` : '',
    empresa.telefone,
    empresa.email
  ].filter(Boolean).join(' | ');

  if (identificacao) {
    doc
      .fillColor('#6b7280')
      .fontSize(8.5)
      .text(identificacao, x, 82, { width: 550 - x });
  }

  linha(doc, 115);
}

function gerarRodape(doc, empresa) {
  linha(doc, 752);
  doc
    .fillColor('#6b7280')
    .fontSize(8)
    .text(
      'Este documento é um recibo/pré-nota de serviço e não substitui a nota fiscal oficial.',
      45,
      760,
      { width: 505, align: 'center' }
    );
  doc.text(
    empresa.rodape ||
      [nomeLegal(empresa), empresa.documento].filter(Boolean).join(' | '),
    45,
    774,
    { width: 505, align: 'center' }
  );
}

function gerarCabecalhoTabela(doc, y) {
  doc
    .fillColor('#111827')
    .fontSize(9)
    .text('Descrição', 45, y)
    .text('Qtd.', 330, y, { width: 35, align: 'center' })
    .text('Unitário', 385, y, { width: 70, align: 'right' })
    .text('Subtotal', 465, y, { width: 85, align: 'right' });
  linha(doc, y + 16);
}

function gerarRecibo(orcamento, empresa, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=recibo-pre-nota-${orcamento.id}.pdf`
  );
  doc.pipe(res);

  gerarCabecalho(doc, empresa);
  doc
    .fillColor('#111827')
    .fontSize(22)
    .text('RECIBO / PRÉ-NOTA DE SERVIÇO', 45, 145);
  doc
    .fillColor('#6b7280')
    .fontSize(9)
    .text(`Referente ao orçamento nº ${orcamento.id}`, 45, 177)
    .text(`Data de emissão: ${orcamento.data}`, 45, 193);

  doc.fillColor('#111827').fontSize(11).text('Tomador do serviço', 45, 235);
  linha(doc, 255);
  doc
    .fillColor('#374151')
    .fontSize(9)
    .text(`Nome/Razão social: ${orcamento.cliente}`, 45, 275, { width: 505 })
    .text(`CPF/CNPJ: ${orcamento.documentoCliente || 'Não informado'}`, 45, 292, {
      width: 505
    })
    .text(`Telefone: ${orcamento.telefone}`, 45, 309, { width: 505 })
    .text(`Endereço: ${orcamento.endereco}`, 45, 326, { width: 505 });

  doc.fillColor('#111827').fontSize(11).text('Serviços prestados', 45, 375);
  gerarCabecalhoTabela(doc, 405);
  let y = 435;

  orcamento.servicos.forEach((servico, index) => {
    const quantidade = Number(servico.quantidade) || 1;
    const valor = Number(servico.valor) || 0;
    const subtotal = servico.subtotal || quantidade * valor;

    if (y > 700) {
      gerarRodape(doc, empresa);
      doc.addPage();
      gerarCabecalho(doc, empresa);
      doc.fillColor('#111827').fontSize(11).text('Serviços prestados', 45, 145);
      gerarCabecalhoTabela(doc, 175);
      y = 205;
    }

    doc
      .fillColor('#111827')
      .fontSize(9)
      .text(`${index + 1}. ${servico.descricao}`, 45, y, { width: 265 });
    doc
      .fillColor('#374151')
      .fontSize(9)
      .text(String(quantidade), 330, y, { width: 35, align: 'center' })
      .text(formatarMoeda(valor), 385, y, { width: 70, align: 'right' })
      .text(formatarMoeda(subtotal), 465, y, { width: 85, align: 'right' });
    y += 28;
    linha(doc, y - 8);
  });

  y += 25;
  if (y > 660) {
    gerarRodape(doc, empresa);
    doc.addPage();
    gerarCabecalho(doc, empresa);
    y = 150;
  }

  doc
    .fillColor('#111827')
    .fontSize(10)
    .text('Valor total recebido / a receber', 315, y);
  doc
    .fillColor('#111827')
    .fontSize(18)
    .text(formatarMoeda(orcamento.total), 405, y + 20, {
      width: 145,
      align: 'right'
    });
  y += 80;

  doc.fillColor('#111827').fontSize(11).text('Declaração', 45, y);
  doc
    .fillColor('#374151')
    .fontSize(9)
    .text(
      `Declaramos para os devidos fins que os serviços descritos neste documento foram orçados ou prestados por ${nomeLegal(empresa)}${empresa.documento ? `, inscrito(a) no CPF/CNPJ ${empresa.documento}` : ''}, ao tomador identificado acima.`,
      45,
      y + 25,
      { width: 505, lineGap: 3 }
    );
  y += 95;

  if (orcamento.observacoes && orcamento.observacoes.trim()) {
    doc.fillColor('#111827').fontSize(11).text('Observações', 45, y);
    doc
      .fillColor('#374151')
      .fontSize(9)
      .text(orcamento.observacoes, 45, y + 22, {
        width: 505,
        lineGap: 3
      });
    y += 85;
  }

  if (y > 690) {
    gerarRodape(doc, empresa);
    doc.addPage();
    gerarCabecalho(doc, empresa);
    y = 190;
  }

  doc.moveTo(70, y + 35).lineTo(250, y + 35).strokeColor('#9ca3af').stroke();
  doc.moveTo(345, y + 35).lineTo(525, y + 35).strokeColor('#9ca3af').stroke();
  doc.fillColor('#6b7280').fontSize(8);
  doc.text('Responsável', 70, y + 45, { width: 180, align: 'center' });
  doc.text('Tomador do serviço', 345, y + 45, {
    width: 180,
    align: 'center'
  });

  gerarRodape(doc, empresa);
  doc.end();
}

module.exports = { gerarRecibo };
