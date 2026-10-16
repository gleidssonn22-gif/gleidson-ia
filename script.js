const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');

let conversationHistory = [];

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage('user', message);
    input.value = '';
    
    const typingId = showTyping();

    try {
        const response = await getAIResponse(message);
        hideTyping(typingId);
        addMessage('bot', response);
    } catch (error) {
        hideTyping(typingId);
        addMessage('bot', 'Desculpe, tive um problema. Tente novamente em instantes.');
        console.error(error);
    }
});

function addMessage(type, text) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerHTML = `
        <span class="avatar">${type === 'bot' ? '🤖' : '👤'}</span>
        <div class="text">${escapeHtml(text)}</div>
    `;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTyping() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message bot typing';
    div.id = id;
    div.innerHTML = `
        <span class="avatar">🤖</span>
        <div class="text">Pensando</div>
    `;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return id;
}

function hideTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

async function getAIResponse(message) {
    conversationHistory.push({ role: 'user', content: message });

    // Aqui conecta com a API do seu backend / IA
    // Por enquanto retorna resposta de demonstração
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const responses = [
        "Entendi! Vou ajudar você com isso. No ClubeWins buscamos sempre as melhores soluções.",
        "Ótima pergunta! Deixe-me explicar de forma clara e objetiva...",
        "Estou analisando as informações. Aqui está o que encontrei para você:",
        "Claro! Fico feliz em poder auxiliar. Vamos lá:"
    ];

    const respostaBase = responses[Math.floor(Math.random() * responses.length)];
    conversationHistory.push({ role: 'assistant', content: respostaBase });
    
    return `${respostaBase}\n\nVocê disse: "${message}"\n\nEm breve conectarei com inteligência completa! 🚀`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}