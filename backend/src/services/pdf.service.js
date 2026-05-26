const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function linha(doc, y, cor = '#e5e7eb') {
  doc
    .moveTo(45, y)
    .lineTo(550, y)
    .strokeColor(cor)
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
      'JGL - Instalações Elétricas e Ar-Condicionado | CNPJ: 36.359.331/0001-60',
      45,
      765,
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

  linha(doc, y + 16, '#d1d5db');
}

function gerarPdf(orcamento, res) {
  const doc = new PDFDocument({
    margin: 45,
    size: 'A4'
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=orcamento-${orcamento.id}.pdf`
  );

  doc.pipe(res);

  gerarCabecalho(doc);

  doc
    .fillColor('#111827')
    .fontSize(24)
    .text('ORÇAMENTO', 45, 145);

  doc
    .fillColor('#6b7280')
    .fontSize(9)
    .text(`Nº ${orcamento.id}`, 45, 177)
    .text(`Data: ${orcamento.data}`, 45, 193)
    .text(`Validade: ${orcamento.validade || '7 dias'}`, 45, 209)
    .text(`Status: ${orcamento.status || 'Pendente'}`, 45, 225);

  doc
    .fillColor('#111827')
    .fontSize(10)
    .text('Cliente', 340, 177);

  doc
    .fillColor('#374151')
    .fontSize(9)
    .text(orcamento.cliente, 340, 197, {
      width: 210
    })
    .text(orcamento.telefone, 340, 213, {
      width: 210
    })
    .text(orcamento.endereco, 340, 229, {
      width: 210
    });

  linha(doc, 270);

  doc
    .fillColor('#111827')
    .fontSize(12)
    .text('Itens do orçamento', 45, 300);

  gerarCabecalhoTabela(doc, 330);

  let y = 360;

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
        .fontSize(12)
        .text('Itens do orçamento', 45, 145);

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

    linha(doc, y - 8, '#f0f0f0');
  });

  y += 20;

  if (y > 675) {
    gerarRodape(doc);
    doc.addPage();
    gerarCabecalho(doc);
    y = 155;
  }

  linha(doc, y);

  doc
    .fillColor('#111827')
    .fontSize(10)
    .text('Total', 365, y + 20);

  doc
    .fillColor('#111827')
    .fontSize(18)
    .text(formatarMoeda(orcamento.total), 405, y + 15, {
      width: 145,
      align: 'right'
    });

  y += 70;

  if (orcamento.observacoes && orcamento.observacoes.trim() !== '') {
    if (y > 650) {
      gerarRodape(doc);
      doc.addPage();
      gerarCabecalho(doc);
      y = 150;
    }

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

    y += 95;
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
    .text('Cliente', 345, y + 45, {
      width: 180,
      align: 'center'
    });

  gerarRodape(doc);

  doc.end();
}

module.exports = {
  gerarPdf
};