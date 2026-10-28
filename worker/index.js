const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
});

const MAX_MESSAGES = 13;
const MAX_MESSAGE_LENGTH = 12000;
const MAX_CONVERSATION_LENGTH = 24000;
const SYSTEM_INSTRUCTION = [
    "Você é Gleidson IA, um assistente de propósito geral disponível no site Clube Wins.",
    "Ajude com perguntas, escrita, ideias, estudos e tarefas do dia a dia. Responda em português do Brasil por padrão e acompanhe o idioma usado pela pessoa.",
    "Seja claro, respeitoso e honesto sobre incertezas. Não diga que pesquisou na internet ou executou ações que não fez.",
    "Sobre o Clube Wins, use apenas informações confirmadas nesta conversa ou fornecidas por uma fonte oficial. Não invente regras, prêmios, pagamentos, recursos, contatos, afiliações ou políticas. Se não tiver informação confirmada, diga isso claramente e peça uma fonte ou detalhe."
].join(" ");

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

async function handleChat(request, env) {
    if (request.method !== "POST") {
        return json({ detail: "Método não permitido." }, 405);
    }
    if (!env.GEMINI_API_KEY) {
        return json({ detail: "O serviço de IA ainda não foi configurado." }, 503);
    }
    if (env.CHAT_LIMITER) {
        const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
        try {
            const { success } = await env.CHAT_LIMITER.limit({ key: clientIp });
            if (!success) {
                return json({ detail: "Você enviou mensagens muito rápido. Aguarde um minuto e tente novamente." }, 429);
            }
        } catch (error) {
            console.error("Não foi possível verificar o limite do chat:", error?.message || "erro desconhecido");
            return json({ detail: "O assistente está temporariamente indisponível. Tente novamente em instantes." }, 503);
        }
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ detail: "Envie uma mensagem válida." }, 400);
    }

    const conversation = readConversation(body);
    if (conversation.error) {
        return json({ detail: conversation.error }, 400);
    }

    const endpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";

    try {
        const result = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
                model: "gemini-3.5-flash-lite",
                system_instruction: SYSTEM_INSTRUCTION,
                input: conversation.input,
                store: false
            })
        });

        if (!result.ok) {
            console.error("Gemini API respondeu com status", result.status);
            if (result.status === 429) {
                return json({ detail: "O limite temporário de uso do assistente foi atingido. Tente novamente em alguns minutos." }, 429);
            }
            if (result.status === 401 || result.status === 403) {
                return json({ detail: "A conexão do assistente precisa de atenção. Tente novamente mais tarde." }, 503);
            }
            return json({ detail: "Não foi possível gerar uma resposta agora. Tente novamente em instantes." }, 503);
        }

        const data = await result.json();
        const answer = data.steps
            ?.filter((step) => step.type === "model_output")
            .flatMap((step) => step.content || [])
            .filter((part) => part.type === "text")
            .map((part) => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            return json({ detail: "A IA não retornou uma resposta." }, 502);
        }
        return json({ status: "success", response: answer });
    } catch (error) {
        console.error("Falha ao conectar com Gemini:", error?.message || "erro desconhecido");
        return json({ detail: "Não foi possível conectar ao assistente agora. Tente novamente em instantes." }, 503);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === "/chat" || url.pathname === "/chat/") {
            return handleChat(request, env);
        }
        return env.ASSETS.fetch(request);
    }
};
