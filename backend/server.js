import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

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

app.use(cors());
app.use(express.json());

app.post("/api/city-assistant", async (req, res) => {
  const { city, question } = req.body;

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
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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
              text: `City: ${cityName}\nCountry: ${country}\nUser question: ${question}`,
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
      error: "Unable to get AI suggestions right now. Please try again later.",
    });
  }
});

app.listen(8000, () => {
  console.log("AI server is running at http://localhost:8000");
});
