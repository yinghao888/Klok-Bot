# KlokappAI 测试网机器人

一个用于自动参与 KlokappAI 测试网的 Node.js 机器人。

## 概述

这个机器人通过以下方式帮助自动化与 KlokappAI 平台的交互：
- 使用以太坊钱包连接到 KlokappAI API
- 自动发送聊天消息
- 管理速率限制
- 在不同的加密货币/区块链相关问题间轮换

## 前提条件

- Node.js 16.0.0 或更高版本
- 一个以太坊私钥

## 安装

1. 克隆仓库：
    ```
    git clone https://github.com/yinghao888/KlokappAi-Testnet-Bot.git
    cd KlokappAi-Testnet-Bot
    ```

2. 安装依赖：
    ```
    npm install
    ```

3. 在项目根目录创建一个 `.env` 文件，并填入你的以太坊私钥：
    ```
    PRIVATE_KEY=你的私钥
    ```

## 使用方法

启动机器人：
    ```
    npm start
    ```

机器人将：
1. 将你的钱包连接到 KlokappAI
2. 检查可用的消息限制
3. 发送聊天消息直到达到限制
4. 等待速率限制重置后再继续

## 功能

- 🔐 安全的钱包连接
- 🤖 自动消息发送
- ⏱️ 速率限制管理
- 🔄 错误时自动重新连接
- 💬 多样的问答集以实现自然交互

## 配置

你可以修改 `main.js` 中的 `questions` 数组来自定义机器人发送的消息。

## 优雅关闭

按 `Ctrl+C` 关闭机器人。

## 免责声明

此机器人仅用于教育目的。使用时需自担风险，并遵守 KlokappAI 的服务条款。

