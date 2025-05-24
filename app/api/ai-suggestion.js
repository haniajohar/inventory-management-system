export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).end();
    }
  
    const { category } = req.body;
  
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `Suggest business ideas or product recommendations for the category: ${category}. Keep it short and interesting.`,
          },
        ],
      });
  
      const suggestion = completion.data.choices[0].message.content;
  
      res.status(200).json({ suggestion });
    } catch (error) {
      console.error('Error during OpenAI request:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: "Something went wrong with the OpenAI API" });
    }
  }
  