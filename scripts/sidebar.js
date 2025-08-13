fetch('sidebar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-container').innerHTML = data;

        // Depois que o HTML foi injetado, marca o link ativo
        const links = document.querySelectorAll('#sidebar-container .nav-link');
        const currentPage = window.location.pathname.split('/').pop(); // pega o nome do arquivo .html

        links.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    });