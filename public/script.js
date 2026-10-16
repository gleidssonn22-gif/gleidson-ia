// Elementos da interface
const inputElement = document.getElementById('user-input');
const sendButton = document.getElementById('enviar-btn');
const messagesContainer = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');

// ⚠️ NUNCA coloque tokens reais aqui — ficam públicos!
// Configure no painel do Cloudflare Pages: Variáveis de Ambiente
const API_URL = 'https://clubewins.com.br/api/chat';

// Estado
let isProcessing = false;

// ===== Funções Principais =====

async function enviarMensagem(event) {
    event?.preventDefault();
    
    const texto = inputElement.value.trim();
    if (!texto || isProcessing) return;

    // Trava o envio enquanto processa
    isProcessing = true;
    inputElement.disabled = true;
    sendButton.disabled = true;

    // Adiciona mensagem do usuário
    adicionarMensagem(texto, 'user');
    inputElement.value = '';

    // Mostra indicador "digitando..."
    const idDigitando = mostrarDigitando();

    try {
        // Monta cabeçalhos — sem token exposto!
        const headers = {
            'Content-Type': 'application/json'
        };

        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ message: texto })
        });

        removerDigitando(idDigitando);

        if (!resposta.ok) {
            throw new Error(`Servidor respondeu com erro: ${resposta.status}`);
        }

        const dados = await resposta.json();
        const respostaTexto = dados.reply || dados.resposta || "Resposta recebida!";
        adicionarMensagem(respostaTexto, 'ai');

    } catch (erro) {
        removerDigitando(idDigitando);
        console.error('❌ Erro:', erro);
        adicionarMensagem(
            `⚠️ Ops! Não consegui conectar.\n\nDetalhe: ${erro.message}\n\nTente novamente em instantes.`, 
            'ai'
        );
    } finally {
        // Libera a interface
        isProcessing = false;
        inputElement.disabled = false;
        sendButton.disabled = false;
        inputElement.focus();
    }
}

function adicionarMensagem(texto, remetente) {
    const div = document.createElement('div');
    div.classList.add('message', `${remetente}-message`);

    if (remetente === 'ai') {
        div.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">${formatarTexto(texto)}</div>
        `;
    } else {
        div.innerHTML = `
            <div class="message-content">${formatarTexto(texto)}</div>
            <div class="message-avatar">👤</div>
        `;
    }

    messagesContainer.appendChild(div);
    rolarParaBaixo();
}

function mostrarDigitando() {
    const id = `digitando-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.classList.add('message', 'ai-message', 'typing-indicator');
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content typing-dots">
            <span></span><span></span><span></span>
        </div>
    `;
    messagesContainer.appendChild(div);
    rolarParaBaixo();
    return id;
}

function removerDigitando(id) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.remove();
}

function formatarTexto(texto) {
    // Converte quebras de linha em <br> e mantém texto seguro
    const seguro = escapeHtml(texto);
    return seguro.replace(/\n/g, '<br>');
}

function escapeHtml(texto) {
    // Previne injeção de código malicioso
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function rolarParaBaixo() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===== Eventos =====

chatForm.addEventListener('submit', enviarMensagem);
inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
    }
});

// Foca automaticamente na entrada ao carregar
document.addEventListener('DOMContentLoaded', () => {
    inputElement.focus();
});
