const fs = require('fs');
const path = require('path');
const { gerarPdf } = require('../services/pdf.service');

const arquivoOrcamentos = path.join(__dirname, '../database/orcamentos.json');

function lerOrcamentos() {
  if (!fs.existsSync(arquivoOrcamentos)) {
    fs.writeFileSync(arquivoOrcamentos, JSON.stringify([]));
  }

  const dados = fs.readFileSync(arquivoOrcamentos);
  return JSON.parse(dados);
}

function salvarOrcamentos(orcamentos) {
  fs.writeFileSync(arquivoOrcamentos, JSON.stringify(orcamentos, null, 2));
}

function criarOrcamento(req, res) {
  const {
    cliente,
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
    telefone,
    endereco,
    validade: validade || '7 dias',
    observacoes:
      observacoes ||
      '',
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

  gerarPdf(orcamento, res);
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
  excluirOrcamento,
  atualizarObservacoes
};