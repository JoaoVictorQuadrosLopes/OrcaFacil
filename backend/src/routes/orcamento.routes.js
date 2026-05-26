const express = require('express');
const router = express.Router();

const {
  criarOrcamento,
  listarOrcamentos,
  gerarPdfOrcamento,
  excluirOrcamento,
  atualizarObservacoes,
  gerarReciboPdf
} = require('../controllers/orcamento.controller');

router.post('/', criarOrcamento);
router.get('/', listarOrcamentos);
router.get('/:id/pdf', gerarPdfOrcamento);
router.get('/:id/recibo', gerarReciboPdf);
router.delete('/:id', excluirOrcamento);
router.patch('/:id/observacoes', atualizarObservacoes);

module.exports = router;