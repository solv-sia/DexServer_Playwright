import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const prompt = process.argv.slice(2).join(" ");

const result = await model.generateContent(prompt);
console.log(result.response.text());