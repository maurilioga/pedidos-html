document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8080/cliente/pendencias')
    .then(response => response.json())
    .then(dados => {
      console.log('Retorno da API:', dados);
      const clientes = dados;
      const tbody = document.getElementById('lista-clientes');

      clientes.forEach(cliente => {
        const tr = document.createElement('tr');

        const nome = cliente.nome;
        const observacao = cliente.observacao ? ` (${cliente.observacao})` : '';
        const nomeCompleto = `${nome}${observacao}`;
        const telefone = formatarTelefone(cliente.telefone);
        const isPago = badgeStatus(cliente.isPago);
        const valorTotal = formatarMoeda(cliente.valorTotal);

        tr.innerHTML = `
          <td>${nomeCompleto}</td>
          <td>${telefone}</td>
          <td>${isPago}</td>
          <td>${valorTotal}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" data-id="${cliente.id}">✏️ Editar</button>
          </td>
        `;

        tbody.appendChild(tr);
      });

      // Evento dos botões
      document.querySelectorAll('.btn[data-id]').forEach(botao => {
        botao.addEventListener('click', (event) => {
          const idCliente = event.target.getAttribute('data-id');
          console.log('Editar cliente com ID:', idCliente);
          alert(`Você clicou pra editar o cliente com ID ${idCliente}`);
        });
      });
    })
    .catch(error => {
      console.error('Erro ao buscar clientes:', error);
    });
});

function formatarTelefone(telefone) {
  if (!telefone) return '';

  const numeros = telefone.replace(/\D/g, '');

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return telefone;
}

function formatarMoeda(valor) {
  if (valor == null) return "-";
  return valor.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
}

function badgeStatus(status) {
  if (status === false) return `<span class="badge bg-danger">Pendente</span>`;

  return "-";
}