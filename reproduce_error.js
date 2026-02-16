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
          image_url: { url: "https://example.com/image.png" },
        },
      ],
    },
  ];

  try {
    // We don't actually need to call the API, just see if it fails validation during request prep
    // (though validation usually happens inside the .complete method)
    await client.chat.complete({
      model: "pixtral-12b-2409",
      messages: messages,
    });
  } catch (error) {
    console.log("Error type:", typeof error);
    console.log("Error message:", error.message);
    if (error.stack) console.log("Stack trace:", error.stack);
  }
}

test();
