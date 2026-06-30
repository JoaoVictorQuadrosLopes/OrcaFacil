const express = require('express');
const {
  buscarEmpresa,
  atualizarEmpresa,
  buscarLogo
} = require('../controllers/empresa.controller');

const router = express.Router();

router.get('/', buscarEmpresa);
router.put('/', atualizarEmpresa);
router.get('/logo', buscarLogo);

module.exports = router;
