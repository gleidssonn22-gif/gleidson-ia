const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');

let conversationHistory = [];
const API_KEY = "";

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage('user', message);
    input.value = '';
    input.disabled = true;
    
    const typingId = showTyping();

    try {
        const response = await getAIResponse(message);
        hideTyping(typingId);
        addMessage('bot', response);
    } catch (error) {
        hideTyping(typingId);
        addMessage('bot', 'Desculpe, tive um problema. Tente novamente em instantes.');
        console.error(error);
    } finally {
        input.disabled = false;
        input.focus();
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

async function getAIResponse(mensagem) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const historico = conversationHistory.slice(-6).map(turn => 
        `${turn.role === 'user' ? 'Usuário' : 'Assistente'}: ${turn.content}`
    ).join('\n');

    const corpo = {
        contents: [{
            parts: [{
                text: "Você é o Gleidson IA, assistente oficial do Clube Wins. Responda de forma amigável, direta e profissional.\nHistórico da conversa:\n" + historico + "\n\nPergunta: " + mensagem
            }]
        }]
    };

    conversationHistory.push({ role: 'user', content: mensagem });

    const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
        const erro = await resposta.json();
        console.error(erro);
        return `Erro: ${erro.error?.message || resposta.statusText}`;
    }

    const dados = await resposta.json();
    const texto = dados.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!texto) return "Não consegui gerar resposta.";

    conversationHistory.push({ role: 'assistant', content: texto });
    return texto;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}
