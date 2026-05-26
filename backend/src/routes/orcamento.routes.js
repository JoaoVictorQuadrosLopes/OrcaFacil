const express = require('express');
const router = express.Router();

const {
  criarOrcamento,
  listarOrcamentos,
  gerarPdfOrcamento,
  excluirOrcamento,
  atualizarObservacoes
} = require('../controllers/orcamento.controller');

router.post('/', criarOrcamento);
router.get('/', listarOrcamentos);
router.get('/:id/pdf', gerarPdfOrcamento);
router.delete('/:id', excluirOrcamento);
router.patch('/:id/observacoes', atualizarObservacoes);

module.exports = router;