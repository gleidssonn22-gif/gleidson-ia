const MAX_MESSAGES = 13;
const MAX_MESSAGE_LENGTH = 12000;
const MAX_CONVERSATION_LENGTH = 24000;
const QUIZ_THEMES = new Set(["conhecimentos gerais", "tecnologia", "ciência", "esportes"]);
const FEEDBACK_FEATURES = new Set(["chat", "club-faq", "post-draft", "poll-draft", "summary", "daily-quiz"]);
const CHAT_PAGE_ASSETS = new Map([
    ["/chat/", "/chat/assistant.html"],
    ["/chat/index.html", "/chat/assistant.html"],
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

// Conteúdo editorial revisado do próprio site. Atualize estes documentos quando
// os recursos, guias ou políticas do Gleidson IA mudarem.
const KNOWLEDGE_BASE = [
    {
        title: "O que é o Gleidson IA",
        path: "/",
        keywords: ["gleidson ia", "assistente", "inteligencia artificial", "ajuda", "capacidades"],
        content: "O Gleidson IA é um assistente de inteligência artificial do site Clube Wins. Ajuda com perguntas gerais, explicações, escrita, ideias, estudos, resumos e rascunhos. Pode cometer erros; informações importantes devem ser conferidas em fontes confiáveis."
    },
    {
        title: "Como pedir ajuda ao assistente",
        path: "/guias/como-usar-gleidson-ia/",
        keywords: ["guia", "usar", "prompt", "pedido", "contexto", "revisar", "rascunho", "estudo"],
        content: "Um bom pedido diz o resultado desejado, o assunto, o público ou nível de conhecimento e o formato da resposta. Para melhorar uma resposta, peça um exemplo, um resumo ou outro nível de detalhe. Não envie senhas, documentos, dados financeiros, informações de saúde ou conteúdo confidencial. Revise fatos, nomes e números antes de usar ou compartilhar uma resposta."
    },
    {
        title: "Exemplos de prompts para estudar e escrever",
        path: "/guias/prompts-para-estudar-e-escrever/",
        keywords: ["exemplos", "prompts", "estudar", "escrever", "texto", "explicar", "revisar", "organizar"],
        content: "Para aprender: peça uma explicação adequada ao seu nível, um exemplo concreto e perguntas para praticar. Para estudar: informe o tempo disponível e os tópicos. Para revisar: peça clareza e gramática, preserve seu ponto de vista e não acrescente fatos. Para rascunhos: informe público, objetivo, tom e tamanho, e peça para sinalizar informações que faltam em vez de inventá-las. Os exemplos são sugestões e precisam ser conferidos."
    },
    {
        title: "Ferramentas e ações disponíveis no chat",
        path: "/chat/",
        keywords: ["atalhos", "ferramentas", "publicacao", "enquete", "resumo", "conversa", "acao", "votar"],
        content: "Os atalhos do chat ajudam a responder dúvidas, criar rascunhos de publicações, montar enquetes e resumir a conversa atual. O assistente prepara sugestões: não publica textos, não envia enquetes, não vota e não altera contas. O resumo usa o histórico recente da sessão aberta; recarregar a página ou iniciar uma nova conversa apaga esse histórico da página."
    },
    {
        title: "Desafio diário e pontuação pessoal",
        path: "/chat/",
        keywords: ["quiz", "desafio", "pontos", "pontuacao", "diario", "temas", "ranking"],
        content: "O desafio do dia é um quiz educativo de conhecimentos gerais, tecnologia, ciência ou esportes. Uma resposta correta soma cinco pontos pessoais, guardados no armazenamento local deste navegador. Esses pontos não são enviados ao Clube Wins e não alteram ranking, resultados ou prêmios oficiais."
    },
    {
        title: "Informações oficiais do Clube Wins",
        path: "/",
        keywords: ["clube wins", "regras", "premios", "pagamentos", "cadastro", "ranking oficial", "pontuacao oficial"],
        content: "O Gleidson IA não tem uma fonte oficial conectada para confirmar regras, cadastro, prêmios, pagamentos ou ranking do Clube Wins. Não invente nem deduza essas informações. Informe que não há confirmação disponível no assistente e recomende consultar os canais oficiais do Clube Wins."
    },
    {
        title: "Privacidade e dados enviados ao assistente",
        path: "/privacidade/",
        keywords: ["privacidade", "dados", "mensagens", "armazenamento", "google", "gemini", "cookies", "avaliacao"],
        content: "As mensagens e o histórico recente enviados no chat são processados pela API Gemini do Google para gerar respostas. O site solicita que a interação não seja armazenada pela API, mas isso não garante retenção zero pelo provedor. A política de privacidade descreve o tratamento e recomenda não enviar informações confidenciais. Avaliações registram somente o tipo de avaliação, o recurso e o horário, sem o texto da conversa. O quiz e os pontos pessoais ficam no armazenamento local do navegador. As páginas editoriais podem exibir anúncios; a tela de conversa não carrega anúncios."
    },
    {
        title: "Contato do site",
        path: "/privacidade/",
        keywords: ["contato", "email", "e-mail", "falar", "privacidade", "solicitacao"],
        content: "Para dúvidas sobre a Política de Privacidade ou pedidos relacionados ao tratamento de informações pelo site, escreva para gleidssonn22@gmail.com. A página de privacidade explica quais informações podem ser tratadas e como fazer pedidos."
    },
    {
        title: "Público do assistente",
        path: "/chat/",
        keywords: ["idade", "maior", "18 anos", "menor", "publico", "gemini"],
        content: "O chat do Gleidson IA é destinado somente a pessoas com 18 anos ou mais. A página pede que a pessoa confirme essa idade antes de conversar, conforme os termos aplicáveis ao uso da API Gemini."
    }
];

const KNOWLEDGE_STOP_WORDS = new Set([
    "a", "as", "ao", "aos", "com", "da", "das", "de", "do", "dos", "e", "em", "eu", "me", "o", "os", "ou", "para", "por", "que", "qual", "quais", "um", "uma"
]);

function normalizeKnowledgeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");
}

function findKnowledge(message) {
    const normalizedQuery = normalizeKnowledgeText(message);
    const terms = [...new Set(normalizedQuery.match(/[a-z0-9]{3,}/g) || [])]
        .filter((term) => !KNOWLEDGE_STOP_WORDS.has(term));
    if (terms.length === 0) return [];

    return KNOWLEDGE_BASE.map((document) => {
        const title = normalizeKnowledgeText(document.title);
        const keywords = normalizeKnowledgeText(document.keywords.join(" "));
        const content = normalizeKnowledgeText(document.content);
        let score = 0;
        for (const term of terms) {
            if (keywords.includes(term)) score += 4;
            if (title.includes(term)) score += 3;
            if (content.includes(term)) score += 1;
        }
        if (normalizedQuery.length >= 7 && keywords.includes(normalizedQuery)) score += 3;
        return { ...document, score };
    })
        .filter((document) => document.score >= 4)
        .sort((first, second) => second.score - first.score)
        .slice(0, 3);
}

function buildSystemInstruction(message) {
    const sources = findKnowledge(message);
    if (sources.length === 0) return SYSTEM_INSTRUCTION;

    const context = sources.map((source) =>
        `Fonte: ${source.title} (https://clubewins.com.br${source.path})\n${source.content}`
    ).join("\n\n");

    return `${SYSTEM_INSTRUCTION}\n\nBase de conhecimento do site, selecionada para esta pergunta:\n${context}\n\nUse estes trechos como referência para informações sobre o site. Não os extrapole. Se citar uma informação do site, inclua o link da fonte correspondente. Se a resposta não estiver na base, diga que não tem confirmação e indique os canais oficiais quando isso tratar do Clube Wins.`;
}

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
        system_instruction: buildSystemInstruction(conversation.input.at(-1).content[0].text),
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
