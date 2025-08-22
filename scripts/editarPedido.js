// ../scripts/editarPedido.js

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const pedidoId = params.get('id');

  if (!pedidoId) {
    alert('ID do pedido não informado na URL.');
    return;
  }

  // DOM refs
  const nomeClienteEl = document.getElementById('nomeCliente');
  const dataEntregaEl = document.getElementById('dataEntrega');
  const observacaoEl = document.getElementById('observacao');
  const pagoEl = document.getElementById('pago');
  const entregueEl = document.getElementById('entregue');

  const listaProdutosPedidoEl = document.getElementById('listaProdutosPedido');
  const listaProdutosAdicionarEl = document.getElementById('listaProdutosAdicionar');

  const selectProdutoAddEl = document.getElementById('selectProdutoAdd');
  const inputQuantidadeAddEl = document.getElementById('inputQuantidadeAdd');
  const btnAddProdutoEl = document.getElementById('btnAddProduto');

  const formEl = document.getElementById('form-pedido');
  const mensagemEl = document.getElementById('mensagem');

  // Estado em memória
  let pedidoAtual = null;
  let produtosDisponiveis = []; // de /produtos
  let produtosParaRemover = new Set(); // guarda idProduto (ou idProdutoPedido quando sua API aceitar)
  let produtosParaAdicionar = []; // { idProduto, nome, quantidade }

  // Helpers
  const toDatetimeLocal = (iso) => {
    if (!iso) return '';
    // Garante yyyy-MM-ddThh:mm
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  const renderMensagem = (texto, tipo = 'success') => {
    mensagemEl.innerHTML = `<div class="alert alert-${tipo}">${texto}</div>`;
    setTimeout(() => (mensagemEl.innerHTML = ''), 4000);
  };

  // Carrega tudo
  Promise.all([
    fetch(`http://localhost:8080/pedido/${pedidoId}`).then(r => r.json()),
    fetch('http://localhost:8080/produto').then(r => r.json())
  ])
  .then(([pedido, produtos]) => {
    pedidoAtual = pedido;
    produtosDisponiveis = produtos.content;
    // Cabeçalho
    nomeClienteEl.value = pedido.nomeCliente || '';
    observacaoEl.value = pedido.observacao || '';
    dataEntregaEl.value = toDatetimeLocal(pedido.dataEntrega);

    // Select de produtos disponíveis
    selectProdutoAddEl.innerHTML = '<option value="">Selecione um produto</option>';
    produtosDisponiveis.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome;
      selectProdutoAddEl.appendChild(opt);
    });

  })
  .catch(err => {
    console.error(err);
    renderMensagem('Erro ao carregar dados do pedido/produtos.', 'danger');
  });

  // Renderiza lista dos produtos do pedido com checkbox para remover
  function renderListaProdutosPedido(itens) {
    listaProdutosPedidoEl.innerHTML = '';
    (itens || []).forEach(item => {
      // item:
      // { idProdutoPedido, produtoPedido: { id, nome, valorSugerido, quantidade } }
      const idItem = item.idProdutoPedido;
      const idProduto = item.produtoPedido?.id;
      const nome = item.produtoPedido?.nome ?? 'Produto';
      const qtde = item.produtoPedido?.quantidade ?? 0;
      const valor = item.produtoPedido?.valorSugerido ?? 0;

      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';

      const esquerda = document.createElement('div');
      esquerda.innerHTML = `
        <div class="fw-semibold">${nome}</div>
        <small class="text-muted">Qtd: ${qtde} • Valor: R$ ${Number(valor).toFixed(2)}</small>
      `;

      const direita = document.createElement('div');
      direita.className = 'd-flex align-items-center gap-2';

      const label = document.createElement('label');
      label.className = 'form-check-label me-2';
      label.textContent = 'Remover';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'form-check-input';
      // Guardamos o idProduto (o DELETE atual da sua API usa idProduto+quantidade)
      chk.dataset.produtoId = idProduto;
      chk.checked = produtosParaRemover.has(idProduto);

      chk.addEventListener('change', () => {
        if (chk.checked) produtosParaRemover.add(idProduto);
        else produtosParaRemover.delete(idProduto);
      });

      direita.appendChild(label);
      direita.appendChild(chk);

      li.appendChild(esquerda);
      li.appendChild(direita);
      listaProdutosPedidoEl.appendChild(li);
    });
  }

  // Render da lista de itens a adicionar
  function renderListaProdutosAdicionar() {
    listaProdutosAdicionarEl.innerHTML = '';
    if (produtosParaAdicionar.length === 0) return;

    produtosParaAdicionar.forEach((p, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <div>
          <div class="fw-semibold">${p.nome}</div>
          <small class="text-muted">Qtd: ${p.quantidade}</small>
        </div>
      `;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-danger';
      btn.textContent = 'Remover';
      btn.addEventListener('click', () => {
        produtosParaAdicionar.splice(idx, 1);
        renderListaProdutosAdicionar();
      });

      li.appendChild(btn);
      listaProdutosAdicionarEl.appendChild(li);
    });
  }

  // Adicionar item na lista temporária (não chama API ainda)
  btnAddProdutoEl.addEventListener('click', () => {
    const idProduto = parseInt(selectProdutoAddEl.value, 10);
    const quantidade = parseInt(inputQuantidadeAddEl.value, 10);

    if (!idProduto || !quantidade || quantidade < 1) {
      renderMensagem('Selecione um produto e informe uma quantidade válida.', 'warning');
      return;
    }

    const nome = produtosDisponiveis.find(p => p.id === idProduto)?.nome || `Produto #${idProduto}`;

    // Se já existir na lista de adição, soma quantidades
    const existente = produtosParaAdicionar.find(p => p.idProduto === idProduto);
    if (existente) existente.quantidade += quantidade;
    else produtosParaAdicionar.push({ idProduto, nome, quantidade });

    // Reset leve
    inputQuantidadeAddEl.value = 1;
    selectProdutoAddEl.value = '';

    renderListaProdutosAdicionar();
  });

  // Submit: salva tudo que mudou
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1) Atualiza dados base do pedido
    const bodyPUT = {
      observacao: observacaoEl.value || null,
      dataEntrega: dataEntregaEl.value || null,
      // Mantive os dois abaixo porque estavam no JSON do pedido (se o PUT aceitar)
      pago: pagoEl.checked,
      entregue: entregueEl.checked
    };

    try {
      // PUT /pedido/{id}
      let resp = await fetch(`http://localhost:8080/pedido/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPUT)
      });
      if (!resp.ok) throw new Error('Falha ao atualizar dados do pedido');

      // 2) Se tiver itens para adicionar → POST /produtosPedido/pedido/{id}
      if (produtosParaAdicionar.length > 0) {
        const bodyPOST = {
          produtosPedidos: produtosParaAdicionar.map(p => ({
            idProduto: p.idProduto,
            quantidade: p.quantidade
          }))
        };
        resp = await fetch(`http://localhost:8080/produtosPedido/pedido/${pedidoId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPOST)
        });
        if (!resp.ok) throw new Error('Falha ao adicionar produtos');
      }

      // 3) Se tiver itens marcados para remover → DELETE /produtosPedido/pedido/{id}
      if (produtosParaRemover.size > 0) {
        const bodyDELETE = {
          produtosPedidos: Array.from(produtosParaRemover).map(idProduto => ({
            idProduto,
            quantidade: 1 // ajuste aqui se sua remoção for por quantidade
          }))
        };
        resp = await fetch(`http://localhost:8080/produtosPedido/pedido/${pedidoId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyDELETE)
        });
        if (!resp.ok) throw new Error('Falha ao remover produtos');
      }

      renderMensagem('Pedido atualizado com sucesso! ✅', 'success');
      // Opcional: recarregar a página para refletir as mudanças do backend
      setTimeout(() => window.location.reload(), 800);

    } catch (err) {
      console.error(err);
      renderMensagem(err.message || 'Erro ao salvar alterações.', 'danger');
    }
  });
});
