const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function linha(doc, y) {
  doc
    .moveTo(45, y)
    .lineTo(550, y)
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .stroke();
}

function gerarCabecalho(doc) {
  const logoPath = path.join(__dirname, '../assets/logo-jgl.png');

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 45, 35, {
      width: 62
    });
  }

  doc
    .fillColor('#111827')
    .fontSize(18)
    .text('JGL', 120, 40);

  doc
    .fillColor('#374151')
    .fontSize(10)
    .text('Instalações Elétricas e Ar-Condicionado', 120, 63);

  doc
    .fillColor('#6b7280')
    .fontSize(8.5)
    .text('CNPJ: 36.359.331/0001-60', 120, 80);

  linha(doc, 115);
}

function gerarRodape(doc) {
  linha(doc, 752);

  doc
    .fillColor('#6b7280')
    .fontSize(8)
    .text(
      'Este documento é um recibo/pré-nota de serviço e não substitui a Nota Fiscal de Serviço Eletrônica oficial.',
      45,
      760,
      {
        width: 505,
        align: 'center'
      }
    );

  doc
    .fillColor('#6b7280')
    .fontSize(8)
    .text(
      'JGL - Instalações Elétricas e Ar-Condicionado | CNPJ: 36.359.331/0001-60',
      45,
      774,
      {
        width: 505,
        align: 'center'
      }
    );
}

function gerarCabecalhoTabela(doc, y) {
  doc
    .fillColor('#111827')
    .fontSize(9)
    .text('Descrição', 45, y)
    .text('Qtd.', 330, y, {
      width: 35,
      align: 'center'
    })
    .text('Unitário', 385, y, {
      width: 70,
      align: 'right'
    })
    .text('Subtotal', 465, y, {
      width: 85,
      align: 'right'
    });

  linha(doc, y + 16);
}

function gerarRecibo(orcamento, res) {
  const doc = new PDFDocument({
    margin: 45,
    size: 'A4'
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=recibo-pre-nota-${orcamento.id}.pdf`
  );

  doc.pipe(res);

  gerarCabecalho(doc);

  doc
    .fillColor('#111827')
    .fontSize(22)
    .text('RECIBO / PRÉ-NOTA DE SERVIÇO', 45, 145);

  doc
    .fillColor('#6b7280')
    .fontSize(9)
    .text(`Referente ao orçamento nº ${orcamento.id}`, 45, 177)
    .text(`Data de emissão: ${orcamento.data}`, 45, 193);

  doc
    .fillColor('#111827')
    .fontSize(11)
    .text('Tomador do serviço', 45, 235);

  linha(doc, 255);

  doc
    .fillColor('#374151')
    .fontSize(9)
    .text(`Nome/Razão social: ${orcamento.cliente}`, 45, 275, {
      width: 505
    })
    .text(`CPF/CNPJ: ${orcamento.documentoCliente || 'Não informado'}`, 45, 292, {
      width: 505
    })
    .text(`Telefone: ${orcamento.telefone}`, 45, 309, {
      width: 505
    })
    .text(`Endereço: ${orcamento.endereco}`, 45, 326, {
      width: 505
    });

  doc
    .fillColor('#111827')
    .fontSize(11)
    .text('Serviços prestados', 45, 375);

  gerarCabecalhoTabela(doc, 405);

  let y = 435;

  orcamento.servicos.forEach((servico, index) => {
    const quantidade = Number(servico.quantidade) || 1;
    const valor = Number(servico.valor) || 0;
    const subtotal = servico.subtotal || quantidade * valor;

    if (y > 700) {
      gerarRodape(doc);
      doc.addPage();
      gerarCabecalho(doc);

      doc
        .fillColor('#111827')
        .fontSize(11)
        .text('Serviços prestados', 45, 145);

      gerarCabecalhoTabela(doc, 175);
      y = 205;
    }

    doc
      .fillColor('#111827')
      .fontSize(9)
      .text(`${index + 1}. ${servico.descricao}`, 45, y, {
        width: 265
      });

    doc
      .fillColor('#374151')
      .fontSize(9)
      .text(String(quantidade), 330, y, {
        width: 35,
        align: 'center'
      });

    doc
      .fillColor('#374151')
      .fontSize(9)
      .text(formatarMoeda(valor), 385, y, {
        width: 70,
        align: 'right'
      });

    doc
      .fillColor('#374151')
      .fontSize(9)
      .text(formatarMoeda(subtotal), 465, y, {
        width: 85,
        align: 'right'
      });

    y += 28;
    linha(doc, y - 8);
  });

  y += 25;

  if (y > 660) {
    gerarRodape(doc);
    doc.addPage();
    gerarCabecalho(doc);
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

  doc
    .fillColor('#111827')
    .fontSize(11)
    .text('Declaração', 45, y);

  doc
    .fillColor('#374151')
    .fontSize(9)
    .text(
      `Declaramos para os devidos fins que os serviços descritos neste documento foram orçados/prestados pela empresa JGL - Instalações Elétricas e Ar-Condicionado, inscrita no CNPJ 36.359.331/0001-60, ao tomador identificado acima.`,
      45,
      y + 25,
      {
        width: 505,
        lineGap: 3
      }
    );

  y += 95;

  if (orcamento.observacoes && orcamento.observacoes.trim() !== '') {
    doc
      .fillColor('#111827')
      .fontSize(11)
      .text('Observações', 45, y);

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
    gerarRodape(doc);
    doc.addPage();
    gerarCabecalho(doc);
    y = 190;
  }

  doc
    .moveTo(70, y + 35)
    .lineTo(250, y + 35)
    .strokeColor('#9ca3af')
    .lineWidth(1)
    .stroke();

  doc
    .moveTo(345, y + 35)
    .lineTo(525, y + 35)
    .strokeColor('#9ca3af')
    .lineWidth(1)
    .stroke();

  doc
    .fillColor('#6b7280')
    .fontSize(8)
    .text('Responsável', 70, y + 45, {
      width: 180,
      align: 'center'
    });

  doc
    .fillColor('#6b7280')
    .fontSize(8)
    .text('Tomador do serviço', 345, y + 45, {
      width: 180,
      align: 'center'
    });

  gerarRodape(doc);

  doc.end();
}

module.exports = {
  gerarRecibo
};