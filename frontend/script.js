const API_ORCAMENTOS = '/orcamentos';
const API_EMPRESA = '/empresa';

let servicos = [];
let empresaAtual = null;
let novoLogoDataUrl;

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function escaparHtml(valor) {
  const elemento = document.createElement('div');
  elemento.textContent = String(valor || '');
  return elemento.innerHTML;
}

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
  const notificacao = document.getElementById('notificacao');
  notificacao.textContent = mensagem;
  notificacao.className = `notificacao visivel ${tipo}`;

  clearTimeout(mostrarNotificacao.timer);
  mostrarNotificacao.timer = setTimeout(() => {
    notificacao.className = 'notificacao';
  }, 3500);
}

function iniciais(nome) {
  return String(nome || 'OrçaFácil')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toUpperCase();
}

function aplicarEmpresa(empresa) {
  empresaAtual = empresa;
  const nome = empresa.nomeFantasia || 'Configure sua empresa';
  const atividade = empresa.atividade || 'Orçamentos profissionais em poucos minutos';
  const cor = /^#[0-9a-f]{6}$/i.test(empresa.corPrimaria || '')
    ? empresa.corPrimaria
    : '#176b5b';

  document.documentElement.style.setProperty('--cor-empresa', cor);
  document.getElementById('nomeEmpresa').textContent = nome;
  document.getElementById('atividadeEmpresa').textContent = atividade;
  document.getElementById('logoEmpresaIniciais').textContent = iniciais(nome);
  document.title = `${nome} | OrçaFácil`;

  const imagem = document.getElementById('logoEmpresaImagem');
  const iniciaisElemento = document.getElementById('logoEmpresaIniciais');

  if (empresa.temLogo) {
    imagem.src = `${API_EMPRESA}/logo?v=${Date.now()}`;
    imagem.hidden = false;
    iniciaisElemento.hidden = true;
    imagem.onerror = () => {
      imagem.hidden = true;
      iniciaisElemento.hidden = false;
    };
  } else {
    imagem.removeAttribute('src');
    imagem.hidden = true;
    iniciaisElemento.hidden = false;
  }
}

async function carregarEmpresa() {
  const resposta = await fetch(API_EMPRESA);

  if (!resposta.ok) {
    throw new Error('Não foi possível carregar os dados da empresa.');
  }

  const empresa = await resposta.json();
  aplicarEmpresa(empresa);

  if (!empresa.configurada) {
    abrirConfiguracoes(true);
  }
}

function preencherFormularioEmpresa() {
  const empresa = empresaAtual || {};
  document.getElementById('empresaNomeFantasia').value = empresa.nomeFantasia || '';
  document.getElementById('empresaRazaoSocial').value = empresa.razaoSocial || '';
  document.getElementById('empresaDocumento').value = empresa.documento || '';
  document.getElementById('empresaTelefone').value = empresa.telefone || '';
  document.getElementById('empresaEmail').value = empresa.email || '';
  document.getElementById('empresaAtividade').value = empresa.atividade || '';
  document.getElementById('empresaEndereco').value = empresa.endereco || '';
  document.getElementById('empresaPagamento').value = empresa.dadosPagamento || '';
  document.getElementById('empresaRodape').value = empresa.rodape || '';
  document.getElementById('empresaCor').value = empresa.corPrimaria || '#176b5b';
  document.getElementById('empresaLogo').value = '';
  novoLogoDataUrl = undefined;
}

function abrirConfiguracoes(primeiroAcesso = false) {
  preencherFormularioEmpresa();
  const dialog = document.getElementById('empresaDialog');
  dialog.dataset.obrigatorio = primeiroAcesso ? 'true' : 'false';
  document.getElementById('tituloConfiguracao').textContent = primeiroAcesso
    ? 'Vamos configurar sua empresa'
    : 'Dados da empresa';
  document.getElementById('fecharConfiguracoes').hidden = primeiroAcesso;
  document.getElementById('cancelarConfiguracoes').hidden = primeiroAcesso;
  dialog.showModal();
}

function fecharConfiguracoes() {
  const dialog = document.getElementById('empresaDialog');

  if (dialog.dataset.obrigatorio !== 'true') {
    dialog.close();
  }
}

async function salvarEmpresa(event) {
  event.preventDefault();

  const dados = {
    nomeFantasia: document.getElementById('empresaNomeFantasia').value,
    razaoSocial: document.getElementById('empresaRazaoSocial').value,
    documento: document.getElementById('empresaDocumento').value,
    telefone: document.getElementById('empresaTelefone').value,
    email: document.getElementById('empresaEmail').value,
    atividade: document.getElementById('empresaAtividade').value,
    endereco: document.getElementById('empresaEndereco').value,
    dadosPagamento: document.getElementById('empresaPagamento').value,
    rodape: document.getElementById('empresaRodape').value,
    corPrimaria: document.getElementById('empresaCor').value
  };

  if (novoLogoDataUrl !== undefined) {
    dados.logoDataUrl = novoLogoDataUrl;
  }

  try {
    const resposta = await fetch(API_EMPRESA, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const empresa = await resposta.json();

    if (!resposta.ok) {
      mostrarNotificacao(empresa.mensagem || 'Erro ao salvar a empresa.', 'erro');
      return;
    }

    aplicarEmpresa(empresa);
    document.getElementById('empresaDialog').close();
    mostrarNotificacao('Dados da empresa atualizados.');
  } catch (error) {
    console.error(error);
    mostrarNotificacao('Erro ao conectar com o servidor.', 'erro');
  }
}

function lerLogo(event) {
  const arquivo = event.target.files[0];

  if (!arquivo) {
    return;
  }

  if (arquivo.size > 2 * 1024 * 1024) {
    event.target.value = '';
    mostrarNotificacao('Escolha uma imagem de até 2 MB.', 'erro');
    return;
  }

  const leitor = new FileReader();
  leitor.onload = () => {
    novoLogoDataUrl = leitor.result;
    mostrarNotificacao('Logo selecionado. Salve para aplicar.');
  };
  leitor.readAsDataURL(arquivo);
}

function adicionarServico() {
  const descricao = document.getElementById('descricaoServico').value.trim();
  const quantidade = Number(document.getElementById('quantidadeServico').value);
  const valor = Number(document.getElementById('valorServico').value);

  if (!descricao || quantidade <= 0 || valor <= 0) {
    mostrarNotificacao('Informe descrição, quantidade e valor do item.', 'erro');
    return;
  }

  servicos.push({
    descricao,
    quantidade,
    valor,
    subtotal: quantidade * valor
  });

  document.getElementById('descricaoServico').value = '';
  document.getElementById('quantidadeServico').value = 1;
  document.getElementById('valorServico').value = '';
  atualizarListaServicos();
}

function atualizarListaServicos() {
  const lista = document.getElementById('listaServicos');
  const total = servicos.reduce((soma, servico) => soma + servico.subtotal, 0);

  lista.innerHTML = servicos.map((servico, index) => `
    <li>
      <div class="item-info">
        <strong>${escaparHtml(servico.descricao)}</strong>
        <span>
          ${servico.quantidade} × ${formatarMoeda(servico.valor)}
        </span>
      </div>
      <div class="item-total">
        <strong>${formatarMoeda(servico.subtotal)}</strong>
        <button type="button" class="btn-remover" data-remover-item="${index}">
          Remover
        </button>
      </div>
    </li>
  `).join('');

  document.getElementById('total').textContent = formatarMoeda(total);
}

async function criarOrcamento(event) {
  event.preventDefault();

  if (servicos.length === 0) {
    mostrarNotificacao('Adicione pelo menos um item ao orçamento.', 'erro');
    return;
  }

  const dados = {
    cliente: document.getElementById('cliente').value.trim(),
    documentoCliente: document.getElementById('documentoCliente').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    endereco: document.getElementById('endereco').value.trim(),
    validade: document.getElementById('validade').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim(),
    servicos
  };

  try {
    const resposta = await fetch(API_ORCAMENTOS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const orcamento = await resposta.json();

    if (!resposta.ok) {
      mostrarNotificacao(orcamento.mensagem || 'Erro ao salvar orçamento.', 'erro');
      return;
    }

    servicos = [];
    atualizarListaServicos();
    event.target.reset();
    document.getElementById('quantidadeServico').value = 1;
    mostrarNotificacao('Orçamento salvo com sucesso.');
    await carregarOrcamentos();
  } catch (error) {
    console.error(error);
    mostrarNotificacao('Erro ao conectar com o servidor.', 'erro');
  }
}

async function carregarOrcamentos() {
  const container = document.getElementById('listaOrcamentos');

  try {
    const resposta = await fetch(API_ORCAMENTOS);
    const orcamentos = await resposta.json();
    document.getElementById('resumoOrcamentos').textContent =
      `${orcamentos.length} ${orcamentos.length === 1 ? 'registro' : 'registros'}`;

    if (orcamentos.length === 0) {
      container.innerHTML = `
        <div class="estado-vazio">
          <strong>Nenhum orçamento por aqui</strong>
          <p>Os novos registros aparecerão nesta lista.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = [...orcamentos].reverse().map(orcamento => `
      <article class="orcamento-item">
        <div class="orcamento-cabecalho">
          <div>
            <strong>${escaparHtml(orcamento.cliente)}</strong>
            <span>${escaparHtml(orcamento.data)}</span>
          </div>
          <span class="status">${escaparHtml(orcamento.status || 'Pendente')}</span>
        </div>
        <dl>
          <div><dt>Documento</dt><dd>${escaparHtml(orcamento.documentoCliente || 'Não informado')}</dd></div>
          <div><dt>Validade</dt><dd>${escaparHtml(orcamento.validade || '7 dias')}</dd></div>
          <div><dt>Total</dt><dd>${formatarMoeda(orcamento.total)}</dd></div>
        </dl>
        <label class="campo-observacao">
          Observações
          <textarea id="obs-${orcamento.id}">${escaparHtml(orcamento.observacoes || '')}</textarea>
        </label>
        <div class="acoes">
          <a class="btn-link" href="${API_ORCAMENTOS}/${orcamento.id}/pdf" target="_blank">
            Orçamento PDF
          </a>
          <a class="btn-link btn-recibo" href="${API_ORCAMENTOS}/${orcamento.id}/recibo" target="_blank">
            Recibo
          </a>
          <button type="button" class="btn-secundario" data-salvar="${orcamento.id}">
            Salvar observação
          </button>
          <button type="button" class="btn-excluir" data-excluir="${orcamento.id}">
            Excluir
          </button>
        </div>
      </article>
    `).join('');
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="estado-vazio erro">Erro ao carregar orçamentos.</div>';
  }
}

async function salvarObservacoes(id) {
  const observacoes = document.getElementById(`obs-${id}`).value;

  try {
    const resposta = await fetch(`${API_ORCAMENTOS}/${id}/observacoes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes })
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarNotificacao(dados.mensagem || 'Erro ao salvar observação.', 'erro');
      return;
    }

    mostrarNotificacao('Observação atualizada.');
  } catch (error) {
    console.error(error);
    mostrarNotificacao('Erro ao conectar com o servidor.', 'erro');
  }
}

async function excluirOrcamento(id) {
  if (!confirm('Tem certeza que deseja excluir este orçamento?')) {
    return;
  }

  try {
    const resposta = await fetch(`${API_ORCAMENTOS}/${id}`, { method: 'DELETE' });
    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarNotificacao(dados.mensagem || 'Erro ao excluir orçamento.', 'erro');
      return;
    }

    mostrarNotificacao('Orçamento excluído.');
    await carregarOrcamentos();
  } catch (error) {
    console.error(error);
    mostrarNotificacao('Erro ao conectar com o servidor.', 'erro');
  }
}

document.getElementById('adicionarServico').addEventListener('click', adicionarServico);
document.getElementById('formOrcamento').addEventListener('submit', criarOrcamento);
document.getElementById('formEmpresa').addEventListener('submit', salvarEmpresa);
document.getElementById('abrirConfiguracoes').addEventListener('click', () => abrirConfiguracoes(false));
document.getElementById('fecharConfiguracoes').addEventListener('click', fecharConfiguracoes);
document.getElementById('cancelarConfiguracoes').addEventListener('click', fecharConfiguracoes);
document.getElementById('empresaLogo').addEventListener('change', lerLogo);
document.getElementById('removerLogo').addEventListener('click', () => {
  novoLogoDataUrl = '';
  document.getElementById('empresaLogo').value = '';
  mostrarNotificacao('O logo será removido quando você salvar.');
});

document.getElementById('listaServicos').addEventListener('click', event => {
  const botao = event.target.closest('[data-remover-item]');
  if (!botao) return;
  servicos.splice(Number(botao.dataset.removerItem), 1);
  atualizarListaServicos();
});

document.getElementById('listaOrcamentos').addEventListener('click', event => {
  const salvar = event.target.closest('[data-salvar]');
  const excluir = event.target.closest('[data-excluir]');
  if (salvar) salvarObservacoes(Number(salvar.dataset.salvar));
  if (excluir) excluirOrcamento(Number(excluir.dataset.excluir));
});

document.getElementById('empresaDialog').addEventListener('cancel', event => {
  if (event.currentTarget.dataset.obrigatorio === 'true') {
    event.preventDefault();
  }
});

Promise.all([carregarEmpresa(), carregarOrcamentos()]).catch(error => {
  console.error(error);
  mostrarNotificacao(error.message || 'Erro ao iniciar o aplicativo.', 'erro');
});
