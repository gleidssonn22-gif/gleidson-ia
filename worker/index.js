const MAX_MESSAGES = 13;
const MAX_MESSAGE_LENGTH = 12000;
const MAX_CONVERSATION_LENGTH = 24000;
const QUIZ_THEMES = new Set(["conhecimentos gerais", "tecnologia", "ciência", "esportes"]);
const FEEDBACK_FEATURES = new Set(["chat", "club-faq", "post-draft", "poll-draft", "summary", "daily-quiz"]);
const CHAT_PAGE_ASSETS = new Map([
    ["/chat/", "/chat/index.html"],
    ["/chat/index.html", "/chat/index.html"],
    ["/chat/style.css", "/style.css"],
    ["/chat/script.js", "/script.js"]
]);
const CHAT_PAGE_ASSET_VERSION = "2026-10-28-assistant-ui";

const SYSTEM_INSTRUCTION = [
    "Você é Gleidson IA, um assistente de propósito geral disponível na página do Clube Wins.",
    "Ajude com perguntas, escrita, ideias, estudos, resumos, rascunhos de publicações e enquetes.",
    "Responda em português do Brasil por padrão e acompanhe o idioma usado pela pessoa. Seja claro, respeitoso e honesto sobre incertezas.",
    "Informações confirmadas nesta página: o assistente se chama Gleidson IA, ajuda com perguntas, textos, ideias e estudos, e pode cometer erros.",
    "Não há uma fonte oficial conectada com regras, cadastro, prêmios, pagamentos ou pontuação oficial do Clube Wins. Não invente esses dados; diga que não tem confirmação e peça uma fonte oficial.",
    "Você só prepara rascunhos. Não diga que publicou, votou, alterou uma conta ou executou uma ação externa. Se pedirem uma ação, mostre uma prévia e aguarde a confirmação direta da pessoa antes de qualquer ação disponível.",
    "Não diga que pesquisou na internet ou executou ações que não fez."
].join(" ");

const QUIZ_SCHEMA = {
    type: "object",
    properties: {
        question: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        correctIndex: { type: "integer" },
        explanation: { type: "string" }
    },
    required: ["question", "options", "correctIndex", "explanation"]
};

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
});

function readConversation(body) {
    if (!body || typeof body !== "object") {
        return { error: "Envie uma mensagem válida." };
    }

    const messages = Array.isArray(body.messages)
        ? body.messages
        : typeof body.message === "string"
            ? [{ role: "user", content: body.message }]
            : null;

    if (!messages || messages.length === 0 || messages.length > MAX_MESSAGES || messages.length % 2 !== 1) {
        return { error: "Envie a conversa atual em um formato válido." };
    }

    let totalLength = 0;
    for (let index = 0; index < messages.length; index += 1) {
        const message = messages[index];
        const expectedRole = index % 2 === 0 ? "user" : "assistant";
        if (!message || message.role !== expectedRole || typeof message.content !== "string") {
            return { error: "As mensagens da conversa estão em um formato inválido." };
        }

        message.content = message.content.trim();
        if (!message.content || message.content.length > MAX_MESSAGE_LENGTH) {
            return { error: "Cada mensagem deve ter entre 1 e 12.000 caracteres." };
        }

        totalLength += message.content.length;
    }

    if (messages.at(-1)?.role !== "user" || totalLength > MAX_CONVERSATION_LENGTH) {
        return { error: "A conversa ultrapassou o tamanho permitido. Inicie uma nova sessão." };
    }

    return {
        input: messages.map(({ role, content }) => ({
            type: role === "user" ? "user_input" : "model_output",
            content: [{ type: "text", text: content }]
        }))
    };
}

async function enforceRateLimit(request, env) {
    if (!env.CHAT_LIMITER) return null;

    const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
    try {
        const { success } = await env.CHAT_LIMITER.limit({ key: clientIp });
        if (!success) {
            return json({ detail: "Você enviou mensagens muito rápido. Aguarde um minuto e tente novamente." }, 429);
        }
    } catch (error) {
        console.error("Não foi possível verificar o limite do assistente:", error?.message || "erro desconhecido");
        return json({ detail: "O assistente está temporariamente indisponível. Tente novamente em instantes." }, 503);
    }

    return null;
}

function upstreamError(status) {
    console.error("Gemini API respondeu com status", status);
    if (status === 429) {
        return json({ detail: "O limite temporário de uso do assistente foi atingido. Tente novamente em alguns minutos." }, 429);
    }
    if (status === 401 || status === 403) {
        return json({ detail: "A conexão do assistente precisa de atenção. Tente novamente mais tarde." }, 503);
    }
    return json({ detail: "Não foi possível gerar uma resposta agora. Tente novamente em instantes." }, 503);
}

async function generateWithGemini(env, payload) {
    try {
        const result = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!result.ok) return { error: upstreamError(result.status) };
        return { data: await result.json() };
    } catch (error) {
        console.error("Falha ao conectar com Gemini:", error?.message || "erro desconhecido");
        return { error: json({ detail: "Não foi possível conectar ao assistente agora. Tente novamente em instantes." }, 503) };
    }
}

function modelText(data) {
    return data.steps
        ?.filter((step) => step.type === "model_output")
        .flatMap((step) => step.content || [])
        .filter((part) => part.type === "text")
        .map((part) => part.text || "")
        .join("")
        .trim();
}

async function readJsonBody(request) {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

async function handleChat(request, env) {
    if (request.method !== "POST") {
        return json({ detail: "Método não permitido." }, 405);
    }
    if (!env.GEMINI_API_KEY) {
        return json({ detail: "O serviço de IA ainda não foi configurado." }, 503);
    }

    const limited = await enforceRateLimit(request, env);
    if (limited) return limited;

    const body = await readJsonBody(request);
    if (!body) return json({ detail: "Envie uma mensagem válida." }, 400);

    const conversation = readConversation(body);
    if (conversation.error) return json({ detail: conversation.error }, 400);

    const generated = await generateWithGemini(env, {
        model: "gemini-3.5-flash-lite",
        system_instruction: SYSTEM_INSTRUCTION,
        input: conversation.input,
        store: false
    });
    if (generated.error) return generated.error;

    const answer = modelText(generated.data);
    if (!answer) return json({ detail: "A IA não retornou uma resposta." }, 502);
    return json({ status: "success", response: answer });
}

function validQuiz(quiz) {
    if (!quiz || typeof quiz !== "object") return null;
    if (typeof quiz.question !== "string" || quiz.question.trim().length < 10 || quiz.question.length > 360) return null;
    if (!Array.isArray(quiz.options) || quiz.options.length !== 4) return null;
    if (quiz.options.some((option) => typeof option !== "string" || !option.trim() || option.length > 180)) return null;
    if (new Set(quiz.options.map((option) => option.trim().toLocaleLowerCase("pt-BR"))).size !== 4) return null;
    if (!Number.isInteger(quiz.correctIndex) || quiz.correctIndex < 0 || quiz.correctIndex > 3) return null;
    if (typeof quiz.explanation !== "string" || !quiz.explanation.trim() || quiz.explanation.length > 600) return null;

    return {
        question: quiz.question.trim(),
        options: quiz.options.map((option) => option.trim()),
        correctIndex: quiz.correctIndex,
        explanation: quiz.explanation.trim()
    };
}

async function handleQuiz(request, env) {
    if (request.method !== "POST") {
        return json({ detail: "Método não permitido." }, 405);
    }
    if (!env.GEMINI_API_KEY) {
        return json({ detail: "O serviço de IA ainda não foi configurado." }, 503);
    }

    const limited = await enforceRateLimit(request, env);
    if (limited) return limited;

    const body = await readJsonBody(request);
    if (!body || !QUIZ_THEMES.has(body.theme)) {
        return json({ detail: "Escolha um tema de quiz válido." }, 400);
    }

    const generated = await generateWithGemini(env, {
        model: "gemini-3.5-flash-lite",
        system_instruction: "Crie questões educativas seguras e corretas, em português do Brasil. Não use fatos atuais, apostas ou informações do Clube Wins. Retorne só o objeto solicitado pelo formato JSON.",
        input: `Crie uma pergunta de múltipla escolha sobre ${body.theme}. Use quatro opções distintas e apenas uma resposta correta. O índice da opção correta começa em zero. Prefira um fato estável que possa ser explicado em uma frase.`,
        response_format: {
            type: "text",
            mime_type: "application/json",
            schema: QUIZ_SCHEMA
        },
        generation_config: { max_output_tokens: 500 },
        store: false
    });
    if (generated.error) return generated.error;

    let quiz;
    try {
        quiz = validQuiz(JSON.parse(modelText(generated.data) || "null"));
    } catch {
        quiz = null;
    }

    if (!quiz) {
        return json({ detail: "Não consegui preparar um quiz válido agora. Tente novamente." }, 502);
    }
    return json({ status: "success", theme: body.theme, quiz });
}

async function handleFeedback(request, env) {
    if (request.method !== "POST") {
        return json({ detail: "Método não permitido." }, 405);
    }

    const limited = await enforceRateLimit(request, env);
    if (limited) return limited;

    const body = await readJsonBody(request);
    if (!body || !["positive", "negative"].includes(body.rating) || !FEEDBACK_FEATURES.has(body.feature)) {
        return json({ detail: "A avaliação enviada não é válida." }, 400);
    }

    console.log(JSON.stringify({
        event: "assistant_feedback",
        rating: body.rating,
        feature: body.feature,
        createdAt: new Date().toISOString()
    }));
    return json({ status: "received" });
}

async function handleChatPageAsset(request, env, assetPath) {
    const assetUrl = new URL(assetPath, request.url);
    assetUrl.searchParams.set("assistant-ui", CHAT_PAGE_ASSET_VERSION);
    return env.ASSETS.fetch(new Request(assetUrl, request));
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (request.method === "GET" && CHAT_PAGE_ASSETS.has(url.pathname)) {
            return handleChatPageAsset(request, env, CHAT_PAGE_ASSETS.get(url.pathname));
        }
        if (url.pathname === "/chat/quiz" || url.pathname === "/chat/quiz/") {
            return handleQuiz(request, env);
        }
        if (url.pathname === "/chat/feedback" || url.pathname === "/chat/feedback/") {
            return handleFeedback(request, env);
        }
        if (url.pathname === "/chat" || url.pathname === "/chat/") {
            return handleChat(request, env);
        }
        return env.ASSETS.fetch(request);
    }
};
