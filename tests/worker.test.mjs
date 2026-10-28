import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerSource = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(workerSource).toString("base64")}`);

function makeRequest(messages) {
    return new Request("https://clubewins.com.br/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.10" },
        body: JSON.stringify({ messages })
    });
}

function makeEnvironment(overrides = {}) {
    return {
        GEMINI_API_KEY: "test-key",
        CHAT_LIMITER: { limit: async () => ({ success: true }) },
        ...overrides
    };
}

test("sends recent turns to Gemini without storing the conversation", async () => {
    const originalFetch = globalThis.fetch;
    let geminiRequest;
    globalThis.fetch = async (_url, options) => {
        geminiRequest = JSON.parse(options.body);
        return Response.json({ steps: [{ type: "model_output", content: [{ type: "text", text: "Lembro, sim." }] }] });
    };

    try {
        const response = await worker.fetch(makeRequest([
            { role: "user", content: "Meu nome é Ana." },
            { role: "assistant", content: "Prazer, Ana." },
            { role: "user", content: "Qual é meu nome?" }
        ]), makeEnvironment());
        const data = await response.json();

        assert.equal(response.status, 200);
        assert.equal(data.response, "Lembro, sim.");
        assert.equal(geminiRequest.store, false);
        assert.deepEqual(geminiRequest.input.map((step) => step.type), ["user_input", "model_output", "user_input"]);
        assert.match(geminiRequest.system_instruction, /propósito geral/);
        assert.match(geminiRequest.system_instruction, /Não invente regras/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("returns a clear rate limit response without calling Gemini", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
        throw new Error("Gemini should not be called when the limiter rejects the request");
    };

    try {
        const environment = makeEnvironment({ CHAT_LIMITER: { limit: async () => ({ success: false }) } });
        const response = await worker.fetch(makeRequest([{ role: "user", content: "Oi" }]), environment);
        const data = await response.json();

        assert.equal(response.status, 429);
        assert.match(data.detail, /Aguarde um minuto/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("maps Gemini throttling to an understandable 429 response", async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    globalThis.fetch = async () => new Response("{}", { status: 429 });
    console.error = () => {};

    try {
        const response = await worker.fetch(makeRequest([{ role: "user", content: "Oi" }]), makeEnvironment());
        const data = await response.json();

        assert.equal(response.status, 429);
        assert.match(data.detail, /Tente novamente em alguns minutos/);
    } finally {
        globalThis.fetch = originalFetch;
        console.error = originalConsoleError;
    }
});

test("rejects malformed and oversized conversation histories", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
        throw new Error("Gemini should not be called for invalid conversation history");
    };

    try {
        const badOrder = await worker.fetch(makeRequest([
            { role: "user", content: "Oi" },
            { role: "user", content: "Outra mensagem" }
        ]), makeEnvironment());
        const tooLong = await worker.fetch(makeRequest([
            { role: "user", content: "x".repeat(12001) }
        ]), makeEnvironment());
        const invalidBody = await worker.fetch(new Request("https://clubewins.com.br/chat/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "null"
        }), makeEnvironment());

        assert.equal(badOrder.status, 400);
        assert.equal(tooLong.status, 400);
        assert.equal(invalidBody.status, 400);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
