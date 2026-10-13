const inputElement = document.getElementById('user-input');
const sendButton = document.getElementById('enviar-btn');
const messagesContainer = document.getElementById('chat-messages');

// Substitua pelo seu token válido da Cloudflare caso precise autenticar na API
const SEU_TOKEN = "SEU_TOKEN_AQUI"; 

async function enviarMensagem() {
    const texto = inputElement.value.trim();
    if (!texto) return;

    adicionarMensagem(texto, 'user');
    inputElement.value = '';

    try {
        const resposta = await fetch('https://clubewins.com.br/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SEU_TOKEN}`
            },
            body: JSON.stringify({ message: texto })
        });

        if (!resposta.ok) throw new Error('Erro na resposta da API');

        const dados = await resposta.json();
        adicionarMensagem(dados.reply || "Resposta recebida com sucesso!", 'ai');

    } catch (erro) {
        console.error("Erro ao enviar:", erro);
        adicionarMensagem("⚠️ Erro ao enviar a mensagem. Verifique a conexão ou o console.", 'ai');
    }
}

function adicionarMensagem(texto, remetente) {
    const div = document.createElement('div');
    div.classList.add('message', remetente);
    div.textContent = texto;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

sendButton.addEventListener('click', enviarMensagem);

inputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        enviarMensagem();
    }
});