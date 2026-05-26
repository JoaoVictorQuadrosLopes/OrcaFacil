const API_URL = 'http://localhost:3000/orcamentos';

let servicos = [];

function formatarMoeda(valor) {
  return Number(valor || 0).toFixed(2);
}

function adicionarServico() {
  const descricao = document.getElementById('descricaoServico').value.trim();
  const quantidade = Number(document.getElementById('quantidadeServico').value);
  const valor = Number(document.getElementById('valorServico').value);

  if (!descricao || quantidade <= 0 || valor <= 0) {
    alert('Informe a descrição, quantidade e valor unitário do item.');
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
  const totalSpan = document.getElementById('total');

  lista.innerHTML = '';

  let total = 0;

  servicos.forEach((servico, index) => {
    total += servico.subtotal;

    const li = document.createElement('li');

    li.innerHTML = `
      <div class="item-info">
        <strong>${servico.descricao}</strong><br>
        <small>
          Qtd: ${servico.quantidade} |
          Unitário: R$ ${formatarMoeda(servico.valor)} |
          Subtotal: R$ ${formatarMoeda(servico.subtotal)}
        </small>
      </div>

      <button type="button" class="btn-remover" onclick="removerServico(${index})">
        Remover
      </button>
    `;

    lista.appendChild(li);
  });

  totalSpan.textContent = formatarMoeda(total);
}

function removerServico(index) {
  servicos.splice(index, 1);
  atualizarListaServicos();
}

document.getElementById('formOrcamento').addEventListener('submit', async function(event) {
  event.preventDefault();

  const cliente = document.getElementById('cliente').value.trim();
  const documentoCliente = document.getElementById('documentoCliente').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const endereco = document.getElementById('endereco').value.trim();
  const validade = document.getElementById('validade').value.trim();
  const observacoes = document.getElementById('observacoes').value.trim();

  if (servicos.length === 0) {
    alert('Adicione pelo menos um item ao orçamento.');
    return;
  }

  const dados = {
    cliente,
    documentoCliente,
    telefone,
    endereco,
    validade,
    observacoes,
    servicos
  };

  try {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    const orcamento = await resposta.json();

    if (!resposta.ok) {
      alert(orcamento.mensagem || 'Erro ao gerar orçamento.');
      return;
    }

    alert('Orçamento gerado com sucesso!');

    servicos = [];
    atualizarListaServicos();

    document.getElementById('formOrcamento').reset();
    document.getElementById('quantidadeServico').value = 1;

    carregarOrcamentos();

  } catch (error) {
    console.error(error);
    alert('Erro ao conectar com o servidor.');
  }
});

async function carregarOrcamentos() {
  const container = document.getElementById('listaOrcamentos');

  try {
    const resposta = await fetch(API_URL);
    const orcamentos = await resposta.json();

    container.innerHTML = '';

    if (orcamentos.length === 0) {
      container.innerHTML = '<p>Nenhum orçamento gerado ainda.</p>';
      return;
    }

    orcamentos.reverse().forEach(orcamento => {
      const div = document.createElement('div');
      div.classList.add('orcamento-item');

      div.innerHTML = `
        <strong>${orcamento.cliente}</strong>

        <p>CPF/CNPJ: ${orcamento.documentoCliente || 'Não informado'}</p>
        <p>Data: ${orcamento.data}</p>
        <p>Validade: ${orcamento.validade || '7 dias'}</p>
        <p>Status: ${orcamento.status || 'Pendente'}</p>
        <p>Total: R$ ${formatarMoeda(orcamento.total)}</p>

        <textarea id="obs-${orcamento.id}">${orcamento.observacoes || ''}</textarea>

        <div class="acoes">
          <a class="btn-link btn-pdf" href="${API_URL}/${orcamento.id}/pdf" target="_blank">
            Baixar PDF
          </a>

          <a class="btn-link btn-recibo" href="${API_URL}/${orcamento.id}/recibo" target="_blank">
            Recibo / Pré-nota
          </a>

          <button class="btn-salvar" onclick="salvarObservacoes(${orcamento.id})">
            Salvar observação
          </button>

          <button class="btn-excluir" onclick="excluirOrcamento(${orcamento.id})">
            Excluir
          </button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = '<p>Erro ao carregar orçamentos.</p>';
  }
}

async function salvarObservacoes(id) {
  const observacoes = document.getElementById(`obs-${id}`).value;

  try {
    const resposta = await fetch(`${API_URL}/${id}/observacoes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ observacoes })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.mensagem || 'Erro ao salvar observação.');
      return;
    }

    alert('Observação atualizada com sucesso!');
    carregarOrcamentos();

  } catch (error) {
    console.error(error);
    alert('Erro ao conectar com o servidor.');
  }
}

async function excluirOrcamento(id) {
  const confirmar = confirm('Tem certeza que deseja excluir este orçamento?');

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.mensagem || 'Erro ao excluir orçamento.');
      return;
    }

    alert('Orçamento excluído com sucesso!');
    carregarOrcamentos();

  } catch (error) {
    console.error(error);
    alert('Erro ao conectar com o servidor.');
  }
}

carregarOrcamentos();