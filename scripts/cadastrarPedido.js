document.addEventListener('DOMContentLoaded', () => {
  const clientesSelect = document.getElementById('cliente');
  const produtosSelectsContainer = document.getElementById('produtos-container');
  const adicionarProdutoBtn = document.getElementById('adicionar-produto');
  const formPedido = document.getElementById('form-pedido');
  const mensagem = document.getElementById('mensagem');
  let produtosList = [];

  // Função pra popular selects de clientes
  fetch('http://localhost:8080/cliente?size=99999')
    .then(res => res.json())
    .then(data => {
      data.content.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        clientesSelect.appendChild(option);
      });
    });

  // Função pra carregar produtos e popular todos selects de produtos
  function carregarProdutos() {
    fetch('http://localhost:8080/produto?size=99999')
      .then(res => res.json())
      .then(data => {
        produtosList = data.content;
        atualizarTodosSelectsProdutos();
      });
  }

  // Atualiza todas as opções dos selects de produto
  function atualizarTodosSelectsProdutos() {
    const selects = document.querySelectorAll('.produto-select');
    selects.forEach(select => {
      const valorAtual = select.value;  // salva o valor selecionado
      // limpa as opções, mantendo o placeholder
      select.innerHTML = '<option value="">Selecione um produto</option>';
      produtosList.forEach(prod => {
        const option = document.createElement('option');
        option.value = prod.id;
        option.textContent = prod.nome;
        select.appendChild(option);
      });
      select.value = valorAtual;  // tenta restaurar o valor selecionado
    });
  }


  // Adicionar novo grupo produto+quantidade
  adicionarProdutoBtn.addEventListener('click', () => {
    const div = document.createElement('div');
    div.classList.add('mb-3', 'produto-item');
    div.innerHTML = `
      <div class="mb-3 d-flex gap-3 align-items-end">
        <div class="flex-grow-1 col-8">
          <label class="form-label">Produto</label>
          <select class="form-select produto-select border border-secondary" required>
            <option value="">Selecione um produto</option>
          </select>
        </div>
        <div>
          <label class="form-label mt-2">Quantidade</label>
          <input type="number" class="form-control quantidade-input text-center border border-secondary" min="1" value="1" required>
          </div>
        </div>
    `;
    produtosSelectsContainer.appendChild(div);
    atualizarTodosSelectsProdutos();
  });

  // Submit do form
  formPedido.addEventListener('submit', (e) => {
    e.preventDefault();

    const idCliente = clientesSelect.value;
    const observacao = document.getElementById('observacao').value;
    const dataEntrega = document.getElementById('dataEntrega').value;

    // Montar array produtos
    const produtosItens = document.querySelectorAll('.produto-item');
    const produtosPayload = [];

    for (const item of produtosItens) {
      const prodSelect = item.querySelector('.produto-select');
      const qtdInput = item.querySelector('.quantidade-input');

      if (prodSelect.value && qtdInput.value > 0) {
        produtosPayload.push({
          idProduto: Number(prodSelect.value),
          quantidade: Number(qtdInput.value)
        });
      }
    }

    if (produtosPayload.length === 0) {
      alert('Adicione pelo menos um produto válido.');
      return;
    }

    const pedido = {
      idCliente: Number(idCliente),
      observacao: observacao || null,
      dataEntrega: dataEntrega,
      produtos: produtosPayload
    };

    fetch('http://localhost:8080/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    })
      .then(() => {
        document.getElementById('mensagem').innerText = 'Pedido cadastrado com sucesso!';
        formPedido.reset();
        // Resetar produtos para um só
        produtosSelectsContainer.innerHTML = `
        <div class="mb-3 produto-item d-flex gap-3 align-items-end">
        <div class="flex-grow-1 col-8">
          <label class="form-label">Produto</label>
          <select class="form-select produto-select border border-secondary" required>
            <option value="">Selecione um produto</option>
          </select>
          </div>
          <div>
          <label class="form-label mt-2">Quantidade</label>
          <input type="number" class="form-control quantidade-input" min="1" value="1" required>
        </div>
      `;
        atualizarTodosSelectsProdutos();
      })
      .then(() => {
        mensagem.innerHTML = `<div class="alert alert-success">Pedido cadastrado com sucesso! ✅</div>`;
        formPedido.reset();
      })
      .catch(err => {
        mensagem.innerText = 'Erro ao cadastrar pedido: ' + err.message;
      });
  });

  carregarProdutos();
});
