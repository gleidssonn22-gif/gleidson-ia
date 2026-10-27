const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
});

async function handleChat(request, env) {
    if (request.method !== "POST") {
        return json({ detail: "Método não permitido." }, 405);
    }
    if (!env.GEMINI_API_KEY) {
        return json({ detail: "O serviço de IA ainda não foi configurado." }, 503);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ detail: "Envie uma mensagem válida." }, 400);
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 12000) {
        return json({ detail: "A mensagem deve ter entre 1 e 12.000 caracteres." }, 400);
    }

    const endpoint = new URL("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent");
    endpoint.searchParams.set("key", env.GEMINI_API_KEY);

    try {
        const result = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: "Você é o assistente oficial do Clube Wins. Responda em português do Brasil de forma clara, útil e respeitosa." }]
                },
                contents: [{ role: "user", parts: [{ text: message }] }],
                generationConfig: { temperature: 0.3 }
            })
        });

        if (!result.ok) {
            console.error("Gemini API respondeu com status", result.status);
            return json({ detail: "Não foi possível gerar uma resposta agora." }, 502);
        }

        const data = await result.json();
        const answer = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            return json({ detail: "A IA não retornou uma resposta." }, 502);
        }
        return json({ status: "success", response: answer });
    } catch (error) {
        console.error("Falha ao conectar com Gemini:", error?.message || "erro desconhecido");
        return json({ detail: "Não foi possível conectar ao assistente agora." }, 502);
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
