document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-produto');
  const mensagem = document.getElementById('mensagem');

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Não recarrega a página

    const nome = document.getElementById('nome').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const quantidade = parseInt(document.getElementById('quantidade').value);

    const json = {
      nome: nome,
      valorSugerido: valor,
      quantidade: quantidade
    };

    fetch('http://localhost:8080/produto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(json)
    })
    .then(res => {
      if (res.ok) {
        mensagem.innerHTML = `<div class="alert alert-success">Produto cadastrado com sucesso! ✅</div>`;
        form.reset();
      } else {
        return res.text().then(texto => {
          throw new Error(texto || 'Erro ao cadastrar produto');
        });
      }
    })
    .catch(error => {
      mensagem.innerHTML = `<div class="alert alert-danger">Erro: ${error.message}</div>`;
    });
  });
});
