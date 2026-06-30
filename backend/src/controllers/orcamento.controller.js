const fs = require('fs');
const path = require('path');
const { gerarPdf } = require('../services/pdf.service');
const { gerarRecibo } = require('../services/recibo.service');
const { lerEmpresa } = require('../services/empresa.service');

const dataDir =
  process.env.ORCAFACIL_DATA_DIR ||
  process.env.JGL_DATA_DIR ||
  path.join(__dirname, '../database');
const arquivoOrcamentos = path.join(dataDir, 'orcamentos.json');

function garantirArquivoOrcamentos() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
      recursive: true
    });
  }

  if (!fs.existsSync(arquivoOrcamentos)) {
    fs.writeFileSync(arquivoOrcamentos, JSON.stringify([]), 'utf8');
  }
}

function lerOrcamentos() {
  garantirArquivoOrcamentos();

  const dados = fs.readFileSync(arquivoOrcamentos);
  return JSON.parse(dados);
}

function salvarOrcamentos(orcamentos) {
  garantirArquivoOrcamentos();

  fs.writeFileSync(arquivoOrcamentos, JSON.stringify(orcamentos, null, 2));
}

function criarOrcamento(req, res) {
  const {
    cliente,
    documentoCliente,
    telefone,
    endereco,
    validade,
    observacoes,
    servicos
  } = req.body;

  if (!cliente || !telefone || !endereco || !servicos || servicos.length === 0) {
    return res.status(400).json({
      mensagem: 'Preencha todos os dados obrigatórios do orçamento.'
    });
  }

  const servicosTratados = servicos.map(servico => {
    const quantidade = Number(servico.quantidade) || 1;
    const valor = Number(servico.valor) || 0;
    const subtotal = quantidade * valor;

    return {
      descricao: servico.descricao,
      quantidade,
      valor,
      subtotal
    };
  });

  const total = servicosTratados.reduce((soma, servico) => {
    return soma + servico.subtotal;
  }, 0);

  const novoOrcamento = {
    id: Date.now(),
    cliente,
    documentoCliente: documentoCliente || '',
    telefone,
    endereco,
    validade: validade || '7 dias',
    observacoes: observacoes || '',
    servicos: servicosTratados,
    total,
    status: 'Pendente',
    data: new Date().toLocaleDateString('pt-BR')
  };

  const orcamentos = lerOrcamentos();
  orcamentos.push(novoOrcamento);
  salvarOrcamentos(orcamentos);

  return res.status(201).json(novoOrcamento);
}

function listarOrcamentos(req, res) {
  const orcamentos = lerOrcamentos();
  return res.json(orcamentos);
}

function gerarPdfOrcamento(req, res) {
  const { id } = req.params;

  const orcamentos = lerOrcamentos();
  const orcamento = orcamentos.find(item => item.id === Number(id));

  if (!orcamento) {
    return res.status(404).json({
      mensagem: 'Orçamento não encontrado.'
    });
  }

  gerarPdf(orcamento, lerEmpresa(), res);
}

function gerarReciboPdf(req, res) {
  const { id } = req.params;

  const orcamentos = lerOrcamentos();
  const orcamento = orcamentos.find(item => item.id === Number(id));

  if (!orcamento) {
    return res.status(404).json({
      mensagem: 'Orçamento não encontrado.'
    });
  }

  gerarRecibo(orcamento, lerEmpresa(), res);
}

function excluirOrcamento(req, res) {
  const { id } = req.params;

  const orcamentos = lerOrcamentos();
  const orcamentoExiste = orcamentos.some(item => item.id === Number(id));

  if (!orcamentoExiste) {
    return res.status(404).json({
      mensagem: 'Orçamento não encontrado.'
    });
  }

  const orcamentosAtualizados = orcamentos.filter(
    item => item.id !== Number(id)
  );

  salvarOrcamentos(orcamentosAtualizados);

  return res.json({
    mensagem: 'Orçamento excluído com sucesso.'
  });
}

function atualizarObservacoes(req, res) {
  const { id } = req.params;
  const { observacoes } = req.body;

  const orcamentos = lerOrcamentos();
  const index = orcamentos.findIndex(item => item.id === Number(id));

  if (index === -1) {
    return res.status(404).json({
      mensagem: 'Orçamento não encontrado.'
    });
  }

  orcamentos[index].observacoes = observacoes || '';

  salvarOrcamentos(orcamentos);

  return res.json({
    mensagem: 'Observações atualizadas com sucesso.',
    orcamento: orcamentos[index]
  });
}

module.exports = {
  criarOrcamento,
  listarOrcamentos,
  gerarPdfOrcamento,
  gerarReciboPdf,
  excluirOrcamento,
  atualizarObservacoes
};
