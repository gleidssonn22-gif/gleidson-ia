const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("enviar-btn");
const statusLabel = document.getElementById("status-label");
const statusDot = document.getElementById("status-dot");
const quickActions = document.getElementById("quick-actions");
const dailyChallengeButton = document.getElementById("daily-challenge-btn");
const personalPoints = document.getElementById("personal-points");
const clearChatButton = document.getElementById("clear-chat-btn");
const ageGate = document.getElementById("age-gate");
const ageConfirmButton = document.getElementById("age-confirm-btn");
const chatWrapper = document.querySelector(".chat-wrapper");
const inputFooter = document.querySelector(".input-footer");
const conversationHistory = [];
const MAX_HISTORY_MESSAGES = 12;
const MAX_CONVERSATION_LENGTH = 24000;
const POINTS_STORAGE_KEY = "gleidson-ia-personal-points-v1";
const DAILY_QUIZ_STORAGE_PREFIX = "gleidson-ia-daily-quiz-v1-";
const QUIZ_THEMES = ["conhecimentos gerais", "tecnologia", "ciência", "esportes"];

const QUICK_PROMPTS = {
    "club-faq": "O que você sabe sobre o Clube Wins? Use somente informações oficiais confirmadas e diga claramente quando não souber.",
    "post-draft": "Quero criar uma publicação para a comunidade. Pergunte o tema e o tom que prefiro e depois me entregue um rascunho para eu revisar.",
    "poll-draft": "Quero montar uma enquete para a comunidade. Pergunte o assunto e depois sugira uma pergunta clara com opções de resposta.",
    summary: "Resuma os principais pontos da nossa conversa até agora. Se esta for a primeira mensagem, me peça o conteúdo que quero resumir."
};

function readLocalJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveLocalJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getPersonalStats() {
    const saved = readLocalJson(POINTS_STORAGE_KEY, {});
    return {
        points: Number.isSafeInteger(saved.points) && saved.points >= 0 ? saved.points : 0,
        correctAnswers: Number.isSafeInteger(saved.correctAnswers) && saved.correctAnswers >= 0 ? saved.correctAnswers : 0,
        streak: Number.isSafeInteger(saved.streak) && saved.streak >= 0 ? saved.streak : 0,
        lastCompletedDay: typeof saved.lastCompletedDay === "string" ? saved.lastCompletedDay : ""
    };
}

function updatePersonalPoints() {
    const stats = getPersonalStats();
    personalPoints.textContent = `Pontos pessoais: ${stats.points}`;
}

function setStatus(label, online = false) {
    statusLabel.textContent = label;
    statusDot.style.backgroundColor = online ? "#10b981" : "#f59e0b";
}

async function submitFeedback(rating, feature, buttons, status) {
    buttons.forEach((button) => {
        button.disabled = true;
    });

    try {
        const response = await fetch("/chat/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ rating, feature })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(typeof data.detail === "string" ? data.detail : "Não foi possível enviar sua avaliação.");
        }

        buttons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.rating === rating));
        });
        status.textContent = "Obrigado! Avaliação enviada sem o texto da conversa.";
    } catch (error) {
        buttons.forEach((button) => {
            button.disabled = false;
        });
        status.textContent = error instanceof TypeError
            ? "Sem conexão. Tente enviar sua avaliação novamente."
            : error.message || "Não foi possível enviar sua avaliação.";
    }
}

function addFeedbackControls(container, feature) {
    const controls = document.createElement("div");
    controls.className = "message-tools";

    const positive = document.createElement("button");
    positive.type = "button";
    positive.className = "message-tool-button";
    positive.dataset.rating = "positive";
    positive.setAttribute("aria-label", "Avaliar esta resposta como útil");
    positive.setAttribute("aria-pressed", "false");
    positive.textContent = "👍 Ajudou";

    const negative = document.createElement("button");
    negative.type = "button";
    negative.className = "message-tool-button";
    negative.dataset.rating = "negative";
    negative.setAttribute("aria-label", "Avaliar esta resposta como não útil");
    negative.setAttribute("aria-pressed", "false");
    negative.textContent = "👎 Não ajudou";

    const status = document.createElement("span");
    status.className = "feedback-status";
    status.setAttribute("aria-live", "polite");

    const buttons = [positive, negative];
    for (const button of buttons) {
        button.addEventListener("click", () => submitFeedback(button.dataset.rating, feature, buttons, status));
        controls.appendChild(button);
    }
    controls.appendChild(status);
    container.appendChild(controls);
}

function appendMessage(text, sender, options = {}) {
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

    if (sender === "ai" && options.controls !== false) {
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "message-tool-button";
        copyButton.textContent = "Copiar resposta";
        copyButton.setAttribute("aria-label", "Copiar resposta do assistente");
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(text);
                copyButton.textContent = "Copiado";
            } catch {
                copyButton.textContent = "Selecione e copie o texto";
            }
        });

        const tools = document.createElement("div");
        tools.className = "message-tools";
        tools.appendChild(copyButton);
        content.appendChild(tools);
        addFeedbackControls(content, options.feature || "chat");
    }

    message.appendChild(content);
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return message;
}

function showTypingIndicator() {
    const indicator = appendMessage("Gleidson IA está digitando...", "ai", { controls: false });
    indicator.id = "typing-indicator";
    indicator.setAttribute("aria-label", "Aguardando resposta do assistente");
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    const feature = chatForm.dataset.feature || "chat";
    chatForm.dataset.feature = "chat";
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
        appendMessage(data.response, "ai", { feature });
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
        appendMessage(message, "ai", { feature });
        console.error("Falha ao consultar o assistente:", error);
    } finally {
        document.getElementById("typing-indicator")?.remove();
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
});

quickActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !QUICK_PROMPTS[button.dataset.action] || sendButton.disabled) return;

    chatForm.dataset.feature = button.dataset.action;
    userInput.value = QUICK_PROMPTS[button.dataset.action];
    chatForm.requestSubmit();
});

function todayTheme(dayKey) {
    const [year, month, day] = dayKey.split("-").map(Number);
    const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
    return QUIZ_THEMES[dayNumber % QUIZ_THEMES.length];
}

function displayQuizResult(card, quiz, theme, isCorrect, pointsEarned, explanation) {
    const result = document.createElement("p");
    result.className = "quiz-result";
    result.textContent = isCorrect
        ? `Resposta certa! Você ganhou ${pointsEarned} pontos pessoais. ${explanation}`
        : `A resposta correta era: ${quiz.options[quiz.correctIndex]}. ${explanation}`;
    card.appendChild(result);

    const note = document.createElement("p");
    note.className = "quiz-note";
    note.textContent = "A pontuação fica neste navegador e não altera o ranking oficial. Questões geradas por IA podem conter erros.";
    card.appendChild(note);

    const stats = getPersonalStats();
    const shareButton = document.createElement("button");
    shareButton.type = "button";
    shareButton.className = "quiz-share-button";
    shareButton.textContent = "Copiar resultado";
    shareButton.addEventListener("click", async () => {
        const shareText = `Completei o desafio diário do Gleidson IA. Acertos: ${stats.correctAnswers}. Pontos pessoais: ${stats.points}.`;
        try {
            await navigator.clipboard.writeText(shareText);
            shareButton.textContent = "Resultado copiado";
        } catch {
            shareButton.textContent = "Não foi possível copiar";
        }
    });
    card.appendChild(shareButton);
    addFeedbackControls(card, "daily-quiz");
}

function renderQuizCard(quiz, theme, dayKey, selectedIndex = null) {
    document.getElementById("daily-challenge-card")?.remove();

    const card = document.createElement("section");
    card.id = "daily-challenge-card";
    card.className = "quiz-card";
    card.setAttribute("aria-label", "Desafio diário de múltipla escolha");

    const heading = document.createElement("h2");
    heading.textContent = `Desafio do dia · ${theme}`;
    card.appendChild(heading);

    const question = document.createElement("p");
    question.className = "quiz-question";
    question.textContent = quiz.question;
    card.appendChild(question);

    const options = document.createElement("div");
    options.className = "quiz-options";
    options.setAttribute("role", "group");
    options.setAttribute("aria-label", "Escolha uma resposta");

    const dailyKey = `${DAILY_QUIZ_STORAGE_PREFIX}${dayKey}`;
    const savedQuiz = readLocalJson(dailyKey, {});
    const completed = savedQuiz.completed === true;
    const buttons = [];

    quiz.options.forEach((option, index) => {
        const answer = document.createElement("button");
        answer.type = "button";
        answer.className = `quiz-option${selectedIndex === index || (completed && savedQuiz.answerIndex === index) ? " is-selected" : ""}`;
        answer.setAttribute("aria-pressed", String(selectedIndex === index || (completed && savedQuiz.answerIndex === index)));
        answer.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
        if (completed) {
            answer.disabled = true;
        } else {
            answer.addEventListener("click", () => {
                selectedIndex = index;
                buttons.forEach((button, buttonIndex) => {
                    const isSelected = buttonIndex === index;
                    button.classList.toggle("is-selected", isSelected);
                    button.setAttribute("aria-pressed", String(isSelected));
                });
                confirmButton.disabled = false;
            });
        }
        buttons.push(answer);
        options.appendChild(answer);
    });
    card.appendChild(options);

    if (completed) {
        const isCorrect = savedQuiz.answerIndex === quiz.correctIndex;
        displayQuizResult(card, quiz, theme, isCorrect, isCorrect ? 5 : 0, quiz.explanation);
    } else {
        const confirmButton = document.createElement("button");
        confirmButton.type = "button";
        confirmButton.className = "quiz-confirm-button";
        confirmButton.textContent = "Confirmar resposta";
        confirmButton.disabled = selectedIndex === null;
        confirmButton.addEventListener("click", () => {
            if (!Number.isInteger(selectedIndex)) return;

            const isCorrect = selectedIndex === quiz.correctIndex;
            const stats = getPersonalStats();
            const priorDay = new Date(`${dayKey}T12:00:00`);
            priorDay.setDate(priorDay.getDate() - 1);
            const yesterdayKey = getLocalDateKey(priorDay);
            stats.points += isCorrect ? 5 : 0;
            stats.correctAnswers += isCorrect ? 1 : 0;
            stats.streak = isCorrect
                ? (stats.lastCompletedDay === yesterdayKey ? stats.streak + 1 : 1)
                : 0;
            stats.lastCompletedDay = dayKey;
            saveLocalJson(POINTS_STORAGE_KEY, stats);
            saveLocalJson(dailyKey, { ...quiz, theme, completed: true, answerIndex: selectedIndex });
            updatePersonalPoints();
            renderQuizCard(quiz, theme, dayKey);
        });
        card.appendChild(confirmButton);

        const note = document.createElement("p");
        note.className = "quiz-note";
        note.textContent = "Escolha uma opção e confirme. Você tem uma tentativa por dia; os pontos são pessoais e ficam neste navegador.";
        card.appendChild(note);
    }

    chatMessages.appendChild(card);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function startDailyChallenge() {
    if (dailyChallengeButton.disabled) return;
    const dayKey = getLocalDateKey();
    const dailyKey = `${DAILY_QUIZ_STORAGE_PREFIX}${dayKey}`;
    const cachedQuiz = readLocalJson(dailyKey, null);
    if (cachedQuiz && Array.isArray(cachedQuiz.options)) {
        renderQuizCard(cachedQuiz, cachedQuiz.theme || todayTheme(dayKey), dayKey);
        return;
    }

    dailyChallengeButton.disabled = true;
    const loading = document.createElement("section");
    loading.id = "daily-challenge-card";
    loading.className = "quiz-card";
    loading.setAttribute("aria-live", "polite");
    loading.textContent = "Preparando seu desafio diário…";
    document.getElementById("daily-challenge-card")?.remove();
    chatMessages.appendChild(loading);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const theme = todayTheme(dayKey);
        const response = await fetch("/chat/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ theme })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.quiz) {
            throw new Error(typeof data.detail === "string" ? data.detail : "Não foi possível preparar o desafio. Tente novamente.");
        }

        const quiz = { ...data.quiz, theme };
        saveLocalJson(dailyKey, quiz);
        setStatus("Online", true);
        renderQuizCard(quiz, theme, dayKey);
    } catch (error) {
        loading.textContent = error instanceof TypeError
            ? "Não consegui conectar ao desafio. Verifique sua conexão e tente novamente."
            : error.message || "Não foi possível preparar o desafio. Tente novamente.";
        setStatus("Indisponível");
    } finally {
        dailyChallengeButton.disabled = false;
    }
}

dailyChallengeButton.addEventListener("click", startDailyChallenge);

clearChatButton.addEventListener("click", () => {
    if (window.confirm("Iniciar uma nova conversa? O histórico desta página será apagado.")) {
        window.location.reload();
    }
});

updatePersonalPoints();

ageConfirmButton.addEventListener("click", () => {
    ageGate.hidden = true;
    chatWrapper.hidden = false;
    inputFooter.hidden = false;
    userInput.focus();
});
