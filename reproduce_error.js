const { Mistral } = require("@mistralai/mistralai");

async function test() {
  const client = new Mistral({ apiKey: "dummy" });

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: "What is in this image?" },
        {
          type: "image_url",
          imageUrl: { url: "https://example.com/image.png" },
        },
      ],
    },
    {
      role: "assistant",
      content: "I see a sample image.",
    },
    {
      role: "user",
      content: "Thank you.",
    },
  ];

  try {
    await client.chat.complete({
      model: "pixtral-12b-2409",
      messages: messages,
    });
  } catch (error) {
    console.log("Error type:", typeof error);
    console.log("Error message:", error.message);
    // if (error.errors) console.log("Zod errors:", JSON.stringify(error.errors, null, 2));
  }
}

test();
