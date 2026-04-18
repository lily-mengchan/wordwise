import { useState } from "react";

const PRESET_QUESTIONS = [
  "How many days is this city worth?",
  "Is this city expensive?",
  "What type of traveler is this city best for?",
];

function formatAnswer(answer) {
  return {
    summary: answer.summary,
    days: answer.days,
    budget: answer.budget,
    style: answer.style,
    highlights: answer.highlights || [],
  };
}

function getPresetLabel(question) {
  if (question === PRESET_QUESTIONS[0]) return "How many days?";
  if (question === PRESET_QUESTIONS[1]) return "Budget";
  return "Best for who?";
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

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/city-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city,
          question: trimmedQuestion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        answer: formatAnswer(data),
      };

      setMessages((current) => [...current, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        error:
          err.message ||
          "Unable to get suggestions right now. Please try again later.",
      };

      setMessages((current) => [...current, errorMessage]);
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

        {isLoading && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "0.9rem 1rem",
              border: "1px solid #666",
              borderRadius: "12px 12px 12px 4px",
              backgroundColor: "#2d3439",
            }}
          >
            AI Assistant is thinking...
          </div>
        )}
      </div>
    </div>
  );
}

export default CityAIPanel;
