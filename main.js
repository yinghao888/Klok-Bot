import "dotenv/config";
import { ethers } from "ethers";
import fetch from "node-fetch";
import crypto from "crypto";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// 聊天用的随机问题
const questions = [
  "What are the latest updates in Ethereum?",
  "How does proof of stake work?",
  "What are the best DeFi protocols?",
  "Explain smart contract security",
  "What is the current state of Layer 2 solutions?",
  "How do rollups work?",
  "What are the benefits of Web3?",
  "Explain blockchain interoperability",
  "What are the trending NFT projects?",
  "How does tokenomics work?",
  "What is the future of DAOs?",
  "Explain MEV in blockchain",
];

class KlokappBot {
  constructor() {
    this.baseUrl = "https://api1-pp.klokapp.ai/v1";
    this.wallet = null;
    this.sessionToken = null;
    this.running = true; // 保持脚本运行的标志
  }

  async start() {
    try {
      // 初始设置
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
      console.log("🔑 钱包已初始化:", this.wallet.address);

      // 无限运行
      while (this.running) {
        try {
          // 如果需要，连接钱包
          if (!this.sessionToken) {
            await this.connectWallet();
          }

          // 执行可用聊天
          await this.performChats();

          // 聊天完成后，等待一段时间后再检查
          console.log(
            "😴 机器人将休息5分钟，然后检查新消息..."
          );
          await delay(5 * 60 * 1000); // 默认5分钟检查间隔
        } catch (error) {
          console.error("❌ 会话错误:", error.message);
          console.log("🔄 1分钟后重新连接...");
          this.sessionToken = null; // 清除token以强制重新连接
          await delay(60000); // 等待1分钟后重试
        }
      }
    } catch (error) {
      console.error("❌ 严重错误:", error);
      console.log(
        "⚠️ 由于严重错误，机器人已停止。请手动重启。"
      );
    }
  }

  async connectWallet() {
    try {
      const headers = {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.5",
        "cache-control": "no-cache",
        "content-type": "application/json",
        origin: "https://klokapp.ai",
        pragma: "no-cache",
        referer: "https://klokapp.ai/",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      };

      const nonce = ethers.hexlify(ethers.randomBytes(48)).substring(2);
      const messageToSign = [
        `klokapp.ai希望您使用以太坊账户登录:`,
        this.wallet.address,
        ``,
        ``,
        `URI: https://klokapp.ai/`,
        `版本: 1`,
        `链ID: 1`,
        `随机数: ${nonce}`,
        `签发时间: ${new Date().toISOString()}`,
      ].join("\n");

      console.log("📝 签署认证消息...");
      const signature = await this.wallet.signMessage(messageToSign);

      const verifyBody = {
        signedMessage: signature,
        message: messageToSign,
        referral_code: null,
      };

      console.log("🔐 验证钱包...");
      const verifyResponse = await fetch(`${this.baseUrl}/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify(verifyBody),
      });

      const responseText = await verifyResponse.text();

      if (!verifyResponse.ok) {
        throw new Error(
          `验证失败: ${verifyResponse.status} - ${responseText}`
        );
      }

      let verifyData;
      try {
        verifyData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`无效的JSON响应: ${responseText}`);
      }

      if (!verifyData.session_token) {
        throw new Error("验证响应中没有session_token");
      }

      this.sessionToken = verifyData.session_token;
      console.log("✅ 钱包连接成功!");
    } catch (error) {
      console.error("❌ 钱包连接错误:", error.message);
      throw error;
    }
  }

  async sendMessage(threadId, message) {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "x-session-token": this.sessionToken,
          Origin: "https://klokapp.ai",
          Referer: "https://klokapp.ai/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          "sec-fetch-site": "same-site",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
        },
        body: JSON.stringify({
          id: threadId,
          title: "",
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          sources: [],
          model: "llama-3.3-70b-instruct",
          created_at: new Date().toISOString(),
          language: "english",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `发送消息失败: ${response.status} - ${errorText}`
        );
      }

      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText);

        if (
          data.choices &&
          data.choices.length > 0 &&
          data.choices[0].message
        ) {
          return data.choices[0].message;
        } else if (data.message) {
          return { content: data.message };
        }
      } catch (e) {}

      return { content: responseText };
    } catch (error) {
      console.error("❌ 发送消息错误:", error.message);
      throw error;
    }
  }

  async getUserLimits() {
    try {
      const response = await fetch(`${this.baseUrl}/rate-limit`, {
        method: "GET",
        headers: {
          Accept: "*/*",
          "x-session-token": this.sessionToken,
          Origin: "https://klokapp.ai",
          Referer: "https://klokapp.ai/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          "sec-fetch-site": "same-site",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `获取速率限制失败: ${response.status} - ${errorText}`
        );
      }

      const rateLimitData = await response.json();

      return {
        remainingMessages: rateLimitData.remaining || 0,
        totalMessages: rateLimitData.limit || 0,
        isPremium: rateLimitData.limit > 10,
        resetTime: rateLimitData.reset_time || null,
      };
    } catch (error) {
      console.error("❌ 获取速率限制错误:", error.message);
      return {
        remainingMessages: 10,
        totalMessages: 10,
        isPremium: false,
        resetTime: null,
      };
    }
  }

  async performChats() {
    try {
      console.log("🚀 开始聊天会话...");

      let userLimits = await this.getUserLimits();
      console.log(
        `👤 账户状态: ${userLimits.isPremium ? "⭐ 高级版" : "🔄 免费版"}`
      );
      console.log(
        `💬 可用消息数: ${userLimits.remainingMessages}/${userLimits.totalMessages}`
      );

      if (userLimits.resetTime) {
        const resetTime =
          typeof userLimits.resetTime === "number"
            ? new Date(Date.now() + userLimits.resetTime * 1000)
            : new Date(userLimits.resetTime);

        console.log(
          `⏰ 消息限制将在以下时间重置: ${resetTime.toLocaleString()}`
        );

        const now = new Date();
        const timeUntilReset = resetTime - now;

        if (timeUntilReset > 0) {
          console.log(
            `⏳ 距离重置时间还有: ${Math.floor(timeUntilReset / 60000)} 分钟`
          );
        }
      }

      let chatCount = Math.min(10, userLimits.remainingMessages);

      if (chatCount <= 0) {
        console.log("❗ 没有剩余的聊天消息。将稍后再次检查。");
        return;
      }

      console.log(
        `🎯 将根据剩余限制执行 ${chatCount} 次聊天会话。`
      );

      let completedChats = 0;

      while (completedChats < chatCount) {
        if (completedChats > 0) {
          userLimits = await this.getUserLimits();
          if (userLimits.remainingMessages <= 0) {
            console.log(
              "⛔ 没有剩余消息。停止聊天会话。"
            );
            break;
          }
        }

        const threadId = crypto.randomUUID();
        console.log(
          `\n📝 聊天 ${completedChats + 1}/${chatCount} 已开始，线程ID: ${threadId}`
        );

        const question =
          questions[Math.floor(Math.random() * questions.length)];
        console.log(`❓ 问题: ${question}`);

        const response = await this.sendMessage(threadId, question);
        console.log(
          `✅ 收到回复: ${response.content.substring(0, 100)}...`
        );

        completedChats++;

        console.log(`📊 进度: ${completedChats}/${chatCount} 已完成`);
        console.log(
          `💬 剩余: 约${userLimits.remainingMessages - completedChats} 条消息`
        );

        if (completedChats < chatCount) {
          console.log(`⏳ 在下一次聊天前等待5秒...`);
          await delay(5000);
        }
      }

      console.log("\n🎉 所有聊天会话已完成!");

      userLimits = await this.getUserLimits();
      console.log(
        `💬 最终剩余消息数: ${userLimits.remainingMessages}`
      );
    } catch (error) {
      console.error("❌ 聊天会话错误:", error.message);
      throw error;
    }
  }
}

// 创建并启动机器人
const bot = new KlokappBot();
bot.start().catch((error) => {
  console.error("❌ 致命错误:", error);
  process.exit(1);
});

// 处理优雅关闭
process.on("SIGINT", () => {
  console.log("\n👋 机器人正在关闭...");
  bot.running = false;
  setTimeout(() => process.exit(0), 1000);
});
