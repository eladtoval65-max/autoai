module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "AI is not configured" });
  }
  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 800,
        system: body.system || "You are AutoAI, a helpful Israeli car-buying advisor.",
        messages: messages.slice(-8 )
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || "AI provider error" });
    }
    const reply = Array.isArray(data?.content)
      ? data.content.filter((item) => item.type === "text").map((item) => item.text).join("\n")
      : "מצטער, נסה שוב.";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AutoAI chat error", error);
    return res.status(500).json({ error: "Server error" });
  }
};
