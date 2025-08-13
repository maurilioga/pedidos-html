document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cliente');
  const mensagem = document.getElementById('mensagem');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.replace(/\D/g, ''); // só números
    const observacao = document.getElementById('observacao').value.trim();

    const json = {
      nome: nome,
      telefone: telefone,
      observacao: observacao === '' ? null : observacao
    };

    fetch('http://localhost:8080/cliente', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(json)
    })
    .then(res => {
      if (res.ok) {
        mensagem.innerHTML = `<div class="alert alert-success">Cliente cadastrado com sucesso! ✅</div>`;
        form.reset();
      } else {
        return res.text().then(texto => {
          throw new Error(texto || 'Erro ao cadastrar cliente');
        });
      }
    })
    .catch(error => {
      mensagem.innerHTML = `<div class="alert alert-danger">Erro: ${error.message}</div>`;
    });
  });
});
