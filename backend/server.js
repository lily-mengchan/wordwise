import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const app = express();
const PORT = process.env.PORT || 8000;
const OPENAI_PROXY_URL = process.env.OPENAI_PROXY_URL;

const cityAssistantSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    days: { type: "string" },
    budget: { type: "string" },
    style: { type: "string" },
    highlights: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["summary", "days", "budget", "style", "highlights"],
};

function getConversationContext(messages = []) {
  if (!Array.isArray(messages)) return "No previous conversation.";

  const context = messages
    .slice(-8)
    .map((message) => {
      const role = message?.role === "assistant" ? "Assistant" : "User";
      const text = String(message?.text || "").trim();
      return text ? `${role}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");

  return context || "No previous conversation.";
}

function createOpenAIClient() {
  const proxyAgent = OPENAI_PROXY_URL
    ? new ProxyAgent(OPENAI_PROXY_URL)
    : undefined;

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    fetch: (url, init) =>
      undiciFetch(url, {
        ...init,
        dispatcher: proxyAgent,
      }),
  });
}

function getAIErrorMessage(error) {
  return error?.status === 429 || error?.code === "insufficient_quota"
    ? "Your OpenAI API quota is exhausted. Check Billing and usage limits in your OpenAI account."
    : error?.name === "APIConnectionTimeoutError"
      ? "The AI server could not reach OpenAI. Check your proxy or network settings and try again."
      : error?.name === "APIConnectionError"
        ? "The AI server could not connect through the configured proxy. Verify Clash is running and OPENAI_PROXY_URL matches its local port."
        : "Unable to get AI suggestions right now. Please try again later.";
}

app.use(cors());
app.use(express.json());

app.post("/api/city-assistant", async (req, res) => {
  const { city, question, messages } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Missing OPENAI_API_KEY. Add it to your environment before starting the AI server.",
    });
  }

  if (!question?.trim()) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    const cityName = city?.cityName || "Unknown city";
    const country = city?.country || "Unknown country";
    const conversationContext = getConversationContext(messages);
    const client = createOpenAIClient();

    const response = await client.responses.create({
      model: "gpt-5",
      instructions:
        "You are a concise travel assistant. Answer only with valid JSON that matches the provided schema. Keep recommendations practical, safe, and beginner-friendly.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `City: ${cityName}\nCountry: ${country}\nPrevious conversation:\n${conversationContext}\n\nCurrent user question: ${question}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "city_assistant_response",
          strict: true,
          schema: cityAssistantSchema,
        },
      },
    });

    const parsedResponse = JSON.parse(response.output_text);
    res.json(parsedResponse);
  } catch (error) {
    console.error("OpenAI request failed:", error);
    res.status(500).json({
      error: getAIErrorMessage(error),
    });
  }
});

app.post("/api/city-assistant/stream", async (req, res) => {
  const { city, question, messages } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Missing OPENAI_API_KEY. Add it to your environment before starting the AI server.",
    });
  }

  if (!question?.trim()) {
    return res.status(400).json({ error: "Question is required." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  function sendEvent(type, payload = {}) {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  try {
    const cityName = city?.cityName || "Unknown city";
    const country = city?.country || "Unknown country";
    const conversationContext = getConversationContext(messages);
    const client = createOpenAIClient();

    const stream = await client.responses.create({
      model: "gpt-5",
      stream: true,
      instructions:
        "You are a concise travel assistant. Reply in friendly plain text. Keep recommendations practical, safe, and beginner-friendly.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `City: ${cityName}\nCountry: ${country}\nPrevious conversation:\n${conversationContext}\n\nCurrent user question: ${question}`,
            },
          ],
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        sendEvent("delta", { text: event.delta });
      }

      if (event.type === "response.completed") {
        sendEvent("done");
      }

      if (event.type === "error") {
        sendEvent("error", {
          error: event.message || "Unable to get AI suggestions right now.",
        });
      }
    }
  } catch (error) {
    console.error("OpenAI stream failed:", error);
    sendEvent("error", { error: getAIErrorMessage(error) });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`AI server is running at http://localhost:${PORT}`);
});
