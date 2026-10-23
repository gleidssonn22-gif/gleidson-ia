document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.querySelector('input[type="text"]') || document.querySelector('textarea') || document.getElementById('user-input');
    const sendBtn = document.querySelector('button');
    const chatContainer = document.querySelector('.chat-container') || document.body;

    if (!sendBtn) return;

    sendBtn.addEventListener('click', () => processarMensagem());
    if (inputEl) {
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') processarMensagem();
        });
    }

    function processarMensagem() {
        const texto = inputEl ? inputEl.value.trim() : '';
        if (!texto) return;

        // Adiciona a mensagem do usuário na tela
        adicionarMensagem(texto, 'user');
        if (inputEl) inputEl.value = '';

        // Resposta dinâmica baseada no comando
        setTimeout(() => {
            let resposta = "Entendi sua solicitação! Como posso ajudar a implementar isso no código?";
            const t = texto.toLowerCase();
            
            if (t.includes('site') || t.includes('pagina')) {
                resposta = "Para criar o seu site, posso estruturar o HTML, CSS e JavaScript necessários. Quer começar pela estrutura básica?";
            } else if (t.includes('ola') || t.includes('oi')) {
                resposta = "Fala, Gleidson! Como posso ajudar no ClubeWins hoje?";
            }

            adicionarMensagem(resposta, 'bot');
        }, 800);
    }

    function adicionarMensagem(texto, remetente) {
        const msgDiv = document.createElement('div');
        msgDiv.className = mensagem \;
        msgDiv.style.margin = '10px 0';
        msgDiv.style.padding = '10px';
        msgDiv.style.borderRadius = '8px';
        msgDiv.style.background = remetente === 'user' ? '#f39c12' : '#2c3e50';
        msgDiv.style.color = '#fff';
        msgDiv.textContent = texto;
        
        // Tenta achar onde injetar a mensagem no chat
        const targetArea = document.querySelector('.chat-history') || chatContainer;
        targetArea.appendChild(msgDiv);
        targetArea.scrollTop = targetArea.scrollHeight;
    }
});
