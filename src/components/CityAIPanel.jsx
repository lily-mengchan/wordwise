import { useState } from "react";

const PRESET_QUESTIONS = [
  "How many days is this city worth?",
  "Is this city expensive?",
  "What type of traveler is this city best for?",
];
const AI_API_BASE_URL =
  import.meta.env.VITE_AI_API_BASE_URL || "http://localhost:8000";

function getErrorMessage(error) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return `Cannot reach AI server at ${AI_API_BASE_URL}. Start it with "npm run ai" and check your VITE_AI_API_BASE_URL setting.`;
  }

  if (error instanceof SyntaxError) {
    return "The AI server returned an invalid response. Check the backend logs for details.";
  }

  return (
    error.message ||
    "Unable to get suggestions right now. Please try again later."
  );
}

function getPresetLabel(question) {
  if (question === PRESET_QUESTIONS[0]) return "How many days?";
  if (question === PRESET_QUESTIONS[1]) return "Budget";
  return "Best for who?";
}

function getAssistantMessageText(message) {
  if (message.error) return `Error: ${message.error}`;
  if (message.text) return message.text;
  if (!message.answer) return "";

  const highlights = message.answer.highlights?.length
    ? ` Highlights: ${message.answer.highlights.join(", ")}.`
    : "";

  return `Summary: ${message.answer.summary}. Suggested stay: ${message.answer.days}. Budget: ${message.answer.budget}. Style: ${message.answer.style}.${highlights}`;
}

function readSSEEvents(value) {
  const lines = value.split("\n");
  let eventType = "message";
  let eventData = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      eventData += line.slice(5).trim();
    }
  }

  if (!eventData) return null;

  return {
    type: eventType,
    data: JSON.parse(eventData),
  };
}

function getConversationContext(messages) {
  return messages
    .slice(-8)
    .map((message) => ({
      role: message.role,
      text:
        message.role === "user"
          ? message.text
          : getAssistantMessageText(message),
    }))
    .filter((message) => message.text);
}

function CityAIPanel({ city }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  async function handleAsk(question) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmedQuestion,
    };

    const aiMessageId = crypto.randomUUID();

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      setMessages((current) => [
        ...current,
        {
          id: aiMessageId,
          role: "assistant",
          text: "",
        },
      ]);

      const res = await fetch(`${AI_API_BASE_URL}/api/city-assistant/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city,
          question: trimmedQuestion,
          messages: getConversationContext(messages),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Request failed");
      }

      if (!res.body) {
        throw new Error("The AI server did not return a stream.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventValue of events) {
          const event = readSSEEvents(eventValue);
          if (!event) continue;

          if (event.type === "delta") {
            setMessages((current) =>
              current.map((message) =>
                message.id === aiMessageId
                  ? { ...message, text: `${message.text}${event.data.text}` }
                  : message,
              ),
            );
          }

          if (event.type === "error") {
            throw new Error(event.data.error);
          }
        }
      }
    } catch (err) {
      setMessages((current) =>
        current.map((message) =>
          message.id === aiMessageId
            ? { ...message, error: getErrorMessage(err) }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedQuestion = customQuestion.trim();
    if (!trimmedQuestion) return;

    handleAsk(trimmedQuestion);
    setCustomQuestion("");
  }

  if (!city?.cityName) return null;

  return (
    <div
      style={{
        marginTop: "2rem",
        padding: "1.2rem",
        border: "1px solid #444",
        borderRadius: "12px",
      }}
    >
      <h4 style={{ marginBottom: "0.8rem" }}>AI City Assistant</h4>

      <p style={{ marginBottom: "0.4rem" }}>
        <strong>Current city: </strong>
        {city.cityName}
      </p>

      <p style={{ marginBottom: "1rem" }}>
        <strong>Country: </strong>
        {city.country}
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        {PRESET_QUESTIONS.map((question) => (
          <button key={question} onClick={() => handleAsk(question)}>
            {getPresetLabel(question)}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "0.8rem",
          alignItems: "stretch",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Ask a simple question about this city..."
          style={{
            flex: "1 1 240px",
            minHeight: "3.8rem",
            padding: "0.8rem 1rem",
            borderRadius: "8px",
            border: "1px solid #666",
            backgroundColor: "#2d3439",
            color: "#fff",
          }}
        />
        <button type="submit" disabled={isLoading || !customQuestion.trim()}>
          Ask AI
        </button>
      </form>

      <p style={{ margin: "0 0 1rem", color: "#b7c3cc", fontSize: "1.3rem" }}>
        Ask through preset prompts, type your own question, or continue the
        chat below.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {messages.map((message) =>
          message.role === "user" ? (
            <div
              key={message.id}
              style={{
                alignSelf: "flex-end",
                maxWidth: "85%",
                padding: "0.9rem 1rem",
                borderRadius: "12px 12px 4px 12px",
                backgroundColor: "#3b82f6",
                color: "#fff",
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.4rem" }}>
                You
              </strong>
              <p style={{ margin: 0 }}>{message.text}</p>
            </div>
          ) : (
            <div
              key={message.id}
              style={{
                alignSelf: "flex-start",
                width: "100%",
                padding: "1rem",
                border: "1px solid #666",
                borderRadius: "12px 12px 12px 4px",
                backgroundColor: "#2d3439",
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.6rem" }}>
                AI Assistant
              </strong>

              {message.error ? (
                <p style={{ margin: 0, color: "#ffb4b4" }}>{message.error}</p>
              ) : message.text !== undefined ? (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {message.text || "AI Assistant is thinking..."}
                </p>
              ) : (
                <>
                  <p style={{ marginTop: 0 }}>
                    <strong>Summary: </strong>
                    {message.answer.summary}
                  </p>
                  <p>
                    <strong>Suggested stay: </strong>
                    {message.answer.days}
                  </p>
                  <p>
                    <strong>Budget: </strong>
                    {message.answer.budget}
                  </p>
                  <p>
                    <strong>Style: </strong>
                    {message.answer.style}
                  </p>

                  {message.answer.highlights.length > 0 && (
                    <div>
                      <strong>Highlights:</strong>
                      <ul style={{ marginBottom: 0 }}>
                        {message.answer.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          ),
        )}

      </div>
    </div>
  );
}

export default CityAIPanel;
