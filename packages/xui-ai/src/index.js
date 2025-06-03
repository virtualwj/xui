// src/index.js
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import dotenv from "dotenv";

import { OpenAI } from "langchain/llms/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

dotenv.config(); // 读取 .env

const app = new Koa();
const router = new Router();

// ------------------------------
// 1. 初始化 LangChain 的 LLM 实例
// ------------------------------
const openai = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: "gpt-3.5-turbo", // 或 "gpt-4" 等
});

// 这里我们直接使用 LLMChain 组织一个简单的 QA 流程
// 你也可以根据需求选择 ChatOpenAI、或者更复杂的链式结构

// 构造一个简单的 Prompt Template
const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    HumanMessagePromptTemplate.fromTemplate(
        "以下是用户提出的问题，请你使用专业的语言进行回答：\n\n“{question}”\n\n回答："
    ),
]);

// LLMChain：封装模型 + Prompt，用来执行推理
const qaChain = new LLMChain({
    llm: openai,
    prompt: chatPrompt,
});

// ------------------------------
// 2. 设置路由：/qa，接收用户提问并返回 AI 回答
// ------------------------------
router.post("/qa", async (ctx) => {
    try {
        const { question } = ctx.request.body || {};
        if (!question || typeof question !== "string" || question.trim().length === 0) {
            ctx.status = 400;
            ctx.body = { error: "请求体必须包含非空的 question 字段" };
            return;
        }

        // 调用 LangChain 链，传入用户问题
        const chainResponse = await qaChain.call({ question: question.trim() });
        // chainResponse 里一般是一个对象，默认 key 是 "text"，代表模型回答
        const answer = chainResponse.text;

        ctx.status = 200;
        ctx.body = {
            question: question.trim(),
            answer: answer.trim(),
        };
    } catch (err) {
        console.error("调用 AI 发生错误：", err);
        ctx.status = 500;
        ctx.body = { error: "内部服务器错误，AI 调用失败" };
    }
});

// ------------------------------
// 3. 注册中间件并启动服务
// ------------------------------
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AI 问答服务已启动，监听端口 ${PORT}`);
});