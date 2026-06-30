const fs = require('fs');
const path = require('path');

const dataDir =
  process.env.ORCAFACIL_DATA_DIR ||
  process.env.JGL_DATA_DIR ||
  path.join(__dirname, '../database');
const arquivoEmpresa = path.join(dataDir, 'empresa.json');

const EMPRESA_VAZIA = {
  configurada: false,
  nomeFantasia: '',
  razaoSocial: '',
  documento: '',
  telefone: '',
  email: '',
  endereco: '',
  atividade: '',
  dadosPagamento: '',
  rodape: '',
  corPrimaria: '#176b5b',
  logoDataUrl: '',
  usarLogoPadrao: false
};

function garantirDiretorio() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function garantirArquivoEmpresa() {
  garantirDiretorio();

  if (!fs.existsSync(arquivoEmpresa)) {
    fs.writeFileSync(
      arquivoEmpresa,
      JSON.stringify(EMPRESA_VAZIA, null, 2),
      'utf8'
    );
  }
}

function lerEmpresa() {
  garantirArquivoEmpresa();

  const dados = JSON.parse(fs.readFileSync(arquivoEmpresa, 'utf8'));
  return {
    ...EMPRESA_VAZIA,
    ...dados
  };
}

function normalizarTexto(valor, limite = 300) {
  return String(valor || '').trim().slice(0, limite);
}

function normalizarCor(valor) {
  const cor = normalizarTexto(valor, 7);
  return /^#[0-9a-f]{6}$/i.test(cor) ? cor : EMPRESA_VAZIA.corPrimaria;
}

function normalizarLogo(valor) {
  const logo = String(valor || '');

  if (!logo) {
    return '';
  }

  if (!/^data:image\/(png|jpe?g);base64,/i.test(logo)) {
    throw new Error('Use uma imagem PNG ou JPG para o logo.');
  }

  if (logo.length > 3_000_000) {
    throw new Error('O logo deve ter no máximo 2 MB.');
  }

  return logo;
}

function salvarEmpresa(dados) {
  const nomeFantasia = normalizarTexto(dados.nomeFantasia, 100);

  if (!nomeFantasia) {
    throw new Error('Informe o nome da empresa ou do profissional.');
  }

  const empresaAtual = lerEmpresa();
  const empresa = {
    configurada: true,
    nomeFantasia,
    razaoSocial: normalizarTexto(dados.razaoSocial, 140),
    documento: normalizarTexto(dados.documento, 30),
    telefone: normalizarTexto(dados.telefone, 30),
    email: normalizarTexto(dados.email, 120),
    endereco: normalizarTexto(dados.endereco, 220),
    atividade: normalizarTexto(dados.atividade, 140),
    dadosPagamento: normalizarTexto(dados.dadosPagamento, 300),
    rodape: normalizarTexto(dados.rodape, 240),
    corPrimaria: normalizarCor(dados.corPrimaria),
    logoDataUrl:
      dados.logoDataUrl === undefined
        ? empresaAtual.logoDataUrl
        : normalizarLogo(dados.logoDataUrl),
    usarLogoPadrao:
      dados.logoDataUrl === undefined
        ? empresaAtual.usarLogoPadrao
        : false
  };

  garantirDiretorio();
  fs.writeFileSync(arquivoEmpresa, JSON.stringify(empresa, null, 2), 'utf8');
  return empresa;
}

function obterLogo() {
  const empresa = lerEmpresa();

  if (empresa.logoDataUrl) {
    const correspondencia = empresa.logoDataUrl.match(
      /^data:image\/(png|jpe?g);base64,(.+)$/i
    );

    if (correspondencia) {
      return {
        buffer: Buffer.from(correspondencia[2], 'base64'),
        contentType: correspondencia[1].toLowerCase() === 'png'
          ? 'image/png'
          : 'image/jpeg'
      };
    }
  }

  if (empresa.usarLogoPadrao) {
    const logoPadrao = path.join(__dirname, '../assets/logo-jgl.png');

    if (fs.existsSync(logoPadrao)) {
      return {
        buffer: fs.readFileSync(logoPadrao),
        contentType: 'image/png'
      };
    }
  }

  return null;
}

module.exports = {
  lerEmpresa,
  salvarEmpresa,
  obterLogo
};
