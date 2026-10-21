// Histórico de mensagens melhorado para a IA
function appendMessage(text, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'ai' ? 'ai-msg' : 'user-msg');
    
    // Suporte a quebras de linha automáticas no texto da IA
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Indicador de "Digitando..."
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai-msg');
    typingDiv.id = 'typing-indicator';
    typingDiv.textContent = 'Gleidson IA está digitando...';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Funções do Chat do Gleidson IA
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');

function sendPrompt(text) {
    userInput.value = text;
    sendMessage();
}

function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Envia mensagem do usuário
    appendMessage(text, 'user');
    userInput.value = '';

    showTypingIndicator();

    // Cérebro atualizado do Gleidson IA
    setTimeout(() => {
        removeTypingIndicator();
        let reply = "Entendido! Como criador e mente por trás do Clube Wins, o Gleidson me programou para te ajudar com tudo por aqui. O que mais manda?";
        
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('o que é o clube wins') || lowerText.includes('site')) {
            reply = "?? O Clube Wins (clubewins.com.br) é a plataforma oficial de entretenimento, jogos e tecnologia criada por Gleidson Pereira de Souza.";
        } else if (lowerText.includes('quem é você') || lowerText.includes('gleidson ia')) {
            reply = "?? Eu sou o **Gleidson IA**, o assistente oficial do site! Fui desenvolvido para auxiliar visitantes, gerenciar interações e somar no ecossistema do Clube Wins.";
        } else if (lowerText.includes('jogos') || lowerText.includes('arcade')) {
            reply = "??? Acesse nossa seção de Arcade logo acima para testar seus reflexos e se divertir com os minijogos exclusivos da plataforma!";
        } else if (lowerText.includes('criador') || lowerText.includes('dono')) {
            reply = "O projeto foi idealizado e construído por **Gleidson Pereira de Souza** usando tecnologias modernas como Cloudflare Pages, Git e IA de ponta.";
        }

        appendMessage(reply, 'ai');
    }, 1000);
}

// Permitir envio com a tecla Enter
if (userInput) {
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}
