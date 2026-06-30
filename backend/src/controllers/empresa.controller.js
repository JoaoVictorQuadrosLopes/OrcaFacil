const {
  lerEmpresa,
  salvarEmpresa,
  obterLogo
} = require('../services/empresa.service');

function buscarEmpresa(req, res) {
  const empresa = lerEmpresa();

  return res.json({
    ...empresa,
    logoDataUrl: undefined,
    temLogo: Boolean(empresa.logoDataUrl || empresa.usarLogoPadrao)
  });
}

function atualizarEmpresa(req, res) {
  try {
    const empresa = salvarEmpresa(req.body || {});

    return res.json({
      ...empresa,
      logoDataUrl: undefined,
      temLogo: Boolean(empresa.logoDataUrl || empresa.usarLogoPadrao)
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

function buscarLogo(req, res) {
  const logo = obterLogo();

  if (!logo) {
    return res.status(404).end();
  }

  res.setHeader('Content-Type', logo.contentType);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(logo.buffer);
}

module.exports = {
  buscarEmpresa,
  atualizarEmpresa,
  buscarLogo
};
