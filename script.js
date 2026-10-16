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

async function getAIResponse(message) {
    conversationHistory.push({ role: 'user', content: message });

    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));

    const lowerMsg = message.toLowerCase();
    let resposta = '';

    if (lowerMsg.includes('olá') || lowerMsg.includes('oi') || lowerMsg.includes('bom dia') || lowerMsg.includes('boa tarde') || lowerMsg.includes('boa noite')) {
        resposta = `Olá! 🎯 Bem-vindo ao **ClubeWins**! Sou o Gleidson IA, seu assistente inteligente.\n\nEstou aqui para ajudar com tudo relacionado ao nosso universo. Como posso colaborar com você hoje?`;
    } 
    else if (lowerMsg.includes('quem é você') || lowerMsg.includes('seu nome') || lowerMsg.includes('quem te criou')) {
        resposta = `Sou o **Gleidson IA**, a inteligência artificial oficial do **ClubeWins**! 🚀\n\nFui desenvolvido para trazer agilidade, respostas precisas e a melhor experiência para nossa comunidade. Estou em constante evolução!`;
    }
    else if (lowerMsg.includes('clube') || lowerMsg.includes('vantagem') || lowerMsg.includes('benefício') || lowerMsg.includes('sobre o clube')) {
        resposta = `O **ClubeWins** é feito para você! 🎯\n\n✅ Conteúdo exclusivo\n✅ Comunidade engajada\n✅ Atualizações constantes\n✅ Foco em resultados\n\nFique sempre por dentro das novidades! Tem algo específico que quer saber?`;
    }
    else if (lowerMsg.includes('obrigado') || lowerMsg.includes('valeu') || lowerMsg.includes('agradeço')) {
        resposta = `De nada! É um prazer ajudar! 💛\n\nVolte sempre que precisar — estamos crescendo juntos no ClubeWins! 🚀`;
    }
    else if (lowerMsg.includes('ajuda') || lowerMsg.includes('comandos') || lowerMsg.includes('o que você faz')) {
        resposta = `Claro! Aqui está o que posso fazer:\n\n🎯 Apresentar o ClubeWins\n💬 Responder suas dúvidas\n🧠 Lembrar do que conversamos\n✨ Evoluir a cada dia\n\nÉ só perguntar! Estou à disposição!`;
    }
    else {
        const respostasGerais = [
            `Entendi! Vou analisar isso para você. No **ClubeWins** buscamos sempre a excelência.\n\nSua mensagem foi: "${message}"\n\nEstou conectando com a base de conhecimento... Em breve terei respostas ainda mais completas! 🧠✨`,
            `Ótima pergunta! 🎯\n\nNo ClubeWins valorizamos clareza e resultado. Sobre "${message}", aqui está o que encontrei:\n\n→ Estou em fase de aprendizado e evolução contínua! Em breve trarei respostas ainda mais detalhadas.`,
            `Recebido! 📝\n\nEstou processando sua solicitação: "${message}"\n\nO ClubeWins evolui a cada dia — obrigado por fazer parte dessa jornada comigo! 💪🚀`
        ];
        resposta = respostasGerais[Math.floor(Math.random() * respostasGerais.length)];
    }

    conversationHistory.push({ role: 'assistant', content: resposta });

    if (conversationHistory.length > 12) {
        conversationHistory = conversationHistory.slice(-10);
    }

    return resposta;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}
