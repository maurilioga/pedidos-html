let pedidoAtual = null;
let pedidoEmEdicao = null;

const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarPedido'));

document.addEventListener('DOMContentLoaded', () => {

  fetch('http://localhost:8080/pedido/pendentes/contagem')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const msgEntregar = `Você tem (${data.pendenteEntrega}) pedidos para entregar`;
      const msgReceber = `Você tem (${data.pendentePagamento}) pedidos para receber`;

      // Exibe no console
      console.log(msgEntregar);
      console.log(msgReceber);

      // Se quiser mostrar no HTML:
      document.getElementById('msgEntregar').textContent = msgEntregar;
      document.getElementById('msgReceber').textContent = msgReceber;
    })
    .catch(error => console.error('Erro:', error));

  // Instancia o modal uma vez só
  const modalEl = document.getElementById('confirmModal');
  const bsModal = new bootstrap.Modal(modalEl);
  const confirmMsg = document.getElementById('confirmModalMessage');
  const confirmBtn = document.getElementById('confirmModalBtn');

  // Função que abre modal e espera confirmação
  function abrirConfirmacao(mensagem, callback) {
    confirmMsg.innerText = mensagem;

    // Remove event listener antigo (pra evitar acumular chamadas)
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    const newConfirmBtn = document.getElementById('confirmModalBtn');

    newConfirmBtn.addEventListener('click', () => {
      bsModal.hide();
      callback();
    });

    bsModal.show();
  }

  // Cria botão toggle com confirmação e PATCH
  function criarBotaoToggle(id, texto, ativo, cor, idPedido) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'btn-check';
    input.id = id;
    input.autocomplete = 'off';
    if (ativo) input.checked = true;

    const endpoint = texto === 'Pago' ? 'pagar' :
      texto === 'Entregue' ? 'entregar' : '';

    const label = document.createElement('label');
    label.className = `btn w-100 btn-lg fw-bolder ${ativo ? 'btn-' + cor : 'btn-outline-' + cor}`;
    label.htmlFor = id;
    label.innerText = texto;

    input.addEventListener('change', (e) => {
      e.preventDefault();  // previne toggle automático
      input.checked = ativo; // mantém estado original até confirmação

      abrirConfirmacao(`Tem certeza que deseja marcar como ${texto.toLowerCase()}?`, () => {
        fetch(`http://localhost:8080/pedido/${idPedido}/${endpoint}`, {
          method: 'PATCH'
        })
          .then(response => {
            if (!response.ok) throw new Error('Erro na requisição');
            // Atualiza visual
            input.checked = !ativo;
            label.className = `btn w-100 btn-lg fw-bolder ${!ativo ? 'btn-' + cor : 'btn-outline-' + cor}`;
            ativo = !ativo; // atualiza o estado
            location.reload(); // ou só atualiza o conteúdo na tela se preferir
          })
          .catch(err => {
            console.error(err);
            alert('Erro ao atualizar o pedido.');
          });
      });
    });

    return { input, label };
  }

  // Busca pedidos e monta a tela
  fetch('http://localhost:8080/pedido/pendentes')
    .then(response => response.json())
    .then(dados => {
      const pedidos = dados;
      const container = document.getElementById('lista-pedidos');
      container.innerHTML = ''; // limpa

      pedidos.forEach(pedido => {
        const div = document.createElement('div');
        div.classList.add('card', 'mb-4', 'rounded-3', 'shadow-sm', 'border-primary');

        const header = document.createElement('div');
        header.classList.add('card-header', 'py-3', 'text-bg-primary', 'border-primary', 'd-flex', 'justify-content-between', 'align-items-center');

        const titulo = document.createElement('h2');
        titulo.classList.add('my-0', 'fw-normal');
        titulo.innerText = `Pedido #${pedido.id}`;

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-sm btn-light';
        btnEditar.innerHTML = '✏️ Editar';
        btnEditar.addEventListener('click', () => abrirModalEditarPedido(pedido));

        header.appendChild(titulo);
        header.appendChild(btnEditar);
        div.appendChild(header);

        const body = document.createElement('div');
        body.classList.add('card-body');

        const cliente = document.createElement('h5');
        cliente.classList.add('card-title');
        let observacao = pedido.observacaoCliente ? ` (${pedido.observacaoCliente})` : '';
        cliente.innerText = `Cliente: ${pedido.nomeCliente}${observacao}`;
        body.appendChild(cliente);

        const ul = document.createElement('ul');
        ul.classList.add('list-unstyled', 'my-0');

        pedido.produtosPedido.forEach(produto => {
          ul.innerHTML += `<li>Produto: ${produto.nome} - (${produto.quantidade})</li>`;
        });

        const valorTotal = pedido.produtosPedido.reduce((total, prod) => {
          return total + (prod.valorSugerido * prod.quantidade);
        }, 0);
        ul.innerHTML += `<li><strong>Valor total:</strong> R$ ${valorTotal.toFixed(2)}</li>`;

        ul.innerHTML += `
          <li>Data de criação: ${formatarDataBrasileira(pedido.dataCriacao)}</li>
          <li>Data de entrega: ${formatarDataBrasileira(pedido.dataEntrega)}</li>
        `;

        // Botões Pago / Entregue
        const pagoId = `btnPago-${pedido.id}`;
        const entregueId = `btnEntregue-${pedido.id}`;

        const { input: pagoCheck, label: pagoLabel } = criarBotaoToggle(pagoId, 'Pago', pedido.pago, 'warning', pedido.id);
        const { input: entregueCheck, label: entregueLabel } = criarBotaoToggle(entregueId, 'Entregue', pedido.entregue, 'success', pedido.id);

        const row = document.createElement('div');
        row.className = 'row py-4';

        const colPago = document.createElement('div');
        colPago.className = 'col';
        colPago.appendChild(pagoCheck);
        colPago.appendChild(pagoLabel);

        const colEntregue = document.createElement('div');
        colEntregue.className = 'col';
        colEntregue.appendChild(entregueCheck);
        colEntregue.appendChild(entregueLabel);

        row.appendChild(colPago);
        row.appendChild(colEntregue);

        ul.appendChild(row);
        body.appendChild(ul);
        div.appendChild(body);
        container.appendChild(div);
      });
    })
    .catch(error => console.error('Erro ao buscar pedidos:', error));
});

function abrirModalEditarPedido(pedido) {
  pedidoEmEdicao = pedido;

  // Preenche campos
  document.getElementById('modalEditarPedidoLabel').textContent = `Editar Pedido #${pedido.id}`;
  document.getElementById('editObservacao').value = pedido.observacao || '';
  document.getElementById('editDataEntrega').value = pedido.dataEntrega ? pedido.dataEntrega.substring(0, 16) : '';

  carregarListaProdutos(pedido.produtosPedido);
  carregarProdutosDisponiveis();

  modalEditar.show();
}

function carregarListaProdutos(produtos) {
  const lista = document.getElementById('listaProdutosPedido');
  lista.innerHTML = '';

  produtos.forEach(prod => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.textContent = `${prod.nome} (${prod.quantidade})`;

    const btnRemover = document.createElement('button');
    btnRemover.className = 'btn btn-danger btn-sm';
    btnRemover.textContent = '❌';
    btnRemover.addEventListener('click', () => removerProdutoDoPedido(prod.idProduto, prod.quantidade));

    li.appendChild(btnRemover);
    lista.appendChild(li);
  });
}

function carregarProdutosDisponiveis() {
  fetch('http://localhost:8080/produto') // endpoint que lista todos os produtos
    .then(res => res.json())
    .then(produtos => {
      const select = document.getElementById('selectProduto');
      select.innerHTML = '';
      produtos.content.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        select.appendChild(opt);
      });
    });
}

function removerProdutoDoPedido(idProduto, quantidade) {
  fetch(`http://localhost:8080/produtosPedido/pedido/${pedidoEmEdicao.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produtosPedidos: [{ idProduto: idProduto, quantidade: quantidade }] })
  }).then(() => {
    // Atualiza lista
    pedidoEmEdicao.produtosPedido = pedidoEmEdicao.produtosPedido.filter(p => p.idProduto !== idProduto);
    carregarListaProdutos(pedidoEmEdicao.produtosPedido);
  });
}

document.getElementById('btnAdicionarProduto').addEventListener('click', () => {
  const idProduto = parseInt(document.getElementById('selectProduto').value);
  const quantidade = parseInt(document.getElementById('inputQuantidade').value);

  fetch(`http://localhost:8080/produtosPedido/pedido/${pedidoEmEdicao.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produtosPedidos: [{ idProduto, quantidade }] })
  }).then(() => {
    // Adiciona localmente também
    pedidoEmEdicao.produtosPedido.push({ idProduto, nome: document.querySelector(`#selectProduto option[value="${idProduto}"]`).textContent, quantidade });
    carregarListaProdutos(pedidoEmEdicao.produtosPedido);
  });
});

document.getElementById('btnSalvarAlteracoes').addEventListener('click', () => {
  const observacao = document.getElementById('editObservacao').value;
  const dataEntrega = document.getElementById('editDataEntrega').value;

  fetch(`http://localhost:8080/pedido/${pedidoEmEdicao.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacao, dataEntrega })
  }).then(() => {
    modalEditar.hide();
    location.reload();
  });
});

function formatarDataBrasileira(dataISO) {
  if (!dataISO) return 'Sem data';
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR');
}
