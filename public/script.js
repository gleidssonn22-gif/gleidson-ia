const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("enviar-btn");
const statusLabel = document.getElementById("status-label");
const statusDot = document.getElementById("status-dot");
const conversationHistory = [];
const MAX_HISTORY_MESSAGES = 12;
const MAX_CONVERSATION_LENGTH = 24000;

function appendMessage(text, sender) {
    const message = document.createElement("div");
    message.className = `message ${sender === "ai" ? "ai-message" : "user-message"}`;

    if (sender === "ai") {
        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = "🤖";
        message.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.className = "message-content";
    text.split("\n").forEach((line, index) => {
        if (index) content.appendChild(document.createElement("br"));
        content.appendChild(document.createTextNode(line));
    });
    message.appendChild(content);
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return message;
}

function setStatus(label, online = false) {
    statusLabel.textContent = label;
    statusDot.style.backgroundColor = online ? "#10b981" : "#f59e0b";
}

function showTypingIndicator() {
    const indicator = appendMessage("Gleidson IA está digitando...", "ai");
    indicator.id = "typing-indicator";
    indicator.setAttribute("aria-label", "Aguardando resposta do assistente");
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    appendMessage(text, "user");
    userInput.value = "";
    sendButton.disabled = true;
    userInput.disabled = true;
    setStatus("Conectando…");
    showTypingIndicator();

    try {
        const recentHistory = [...conversationHistory];
        while (
            recentHistory.length >= MAX_HISTORY_MESSAGES + 1
            || recentHistory.reduce((length, message) => length + message.content.length, 0) + text.length > MAX_CONVERSATION_LENGTH
        ) {
            recentHistory.splice(0, 2);
        }
        const conversation = [...recentHistory, { role: "user", content: text }];
        const response = await fetch("/chat/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ messages: conversation })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(typeof data.detail === "string" ? data.detail : "O serviço de IA não conseguiu responder.");
            error.status = response.status;
            throw error;
        }
        if (typeof data.response !== "string" || !data.response.trim()) {
            throw new Error("O serviço de IA retornou uma resposta vazia.");
        }
        setStatus("Online", true);
        appendMessage(data.response, "ai");
        conversationHistory.push({ role: "user", content: text }, { role: "assistant", content: data.response });
        while (
            conversationHistory.length > MAX_HISTORY_MESSAGES
            || conversationHistory.reduce((length, message) => length + message.content.length, 0) > MAX_CONVERSATION_LENGTH
        ) {
            conversationHistory.splice(0, 2);
        }
    } catch (error) {
        const message = error instanceof TypeError
            ? "Não consegui conectar ao assistente. Verifique sua conexão e tente novamente."
            : error instanceof Error && error.message
                ? error.message
                : "Não consegui conectar ao assistente agora. Tente novamente em instantes.";
        setStatus(error?.status === 429 ? "Aguarde" : "Indisponível");
        appendMessage(message, "ai");
        console.error("Falha ao consultar o assistente:", error);
    } finally {
        document.getElementById("typing-indicator")?.remove();
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
});

try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
} catch (error) {
    console.info("O anúncio será exibido quando o AdSense estiver disponível.");
}
