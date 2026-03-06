import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyBohD8FlJM4bp7z6Q2P_ncukIUp_oR7IA4");

async function test() {
  try {
    console.log("Testing gemini-2.0-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say hi!");
    console.log("Success with gemini-2.0-flash:", result.response.text());
  } catch (err) {
    console.error("Failed with gemini-2.0-flash:", err.message);
    try {
      console.log("Testing gemini-1.5-flash...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Say hi!");
      console.log("Success with gemini-1.5-flash:", result.response.text());
    } catch (err2) {
      console.error("Failed with gemini-1.5-flash:", err2.message);
    }
  }
}

test();
