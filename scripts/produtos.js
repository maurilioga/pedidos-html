document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8080/produto?size=99999')
    .then(response => response.json())
    .then(dados => {
      console.log('Retorno da API:', dados);
      const produtos = dados.content;
      const tbody = document.getElementById('lista-produtos');

      produtos.forEach(produto => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
          <td>${produto.nome}</td>
          <td>${formatarPreco(produto.valorSugerido)}</td>
          <td>${produto.quantidade}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" data-id="${produto.id}" data-action="editar">✏️ Editar</button>
            <button class="btn btn-sm btn-outline-danger" data-id="${produto.id}" data-action="remover">❌ Remover</button>
          </td>
        `;

        tbody.appendChild(tr);
      });

      // Eventos dos botões
      document.querySelectorAll('#lista-produtos button').forEach(botao => {
        botao.addEventListener('click', (event) => {
          const idProduto = event.target.getAttribute('data-id');
          const acao = event.target.getAttribute('data-action');

          if (acao === 'editar') {
            alert(`Editar produto com ID ${idProduto}`);
            // Aqui você pode abrir modal ou redirecionar para tela de edição
          }

          if (acao === 'remover') {
            alert(`Remover produto com ID ${idProduto}`);
            // Aqui você pode fazer a chamada DELETE ou abrir confirmação
          }
        });
      });
    })
    .catch(error => {
      console.error('Erro ao buscar produtos:', error);
    });
});

function formatarPreco(valor) {
  if (valor == null) return '';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
