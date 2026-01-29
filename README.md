<div align="center">
  <h1>🍿 TG Stream Bot</h1>
  <p><b>A Professional-Grade Telegram Proxy & Streaming Engine for Cloudflare Workers</b></p>

  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MTProto-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="MTProto" />
</div>

---

## 🚀 Overview

**TG Stream Bot** is a high-performance Telegram file streaming engine designed to run on the **Cloudflare Edge**. By leveraging the power of **MTProto** and **WebAssembly (WASM)**, it allows users to stream or download Telegram files up to **4GB** with maximum efficiency and native speed.

### ✨ Key Features
- 💎 **High-Speed MTProto**: Powered by GramJS for low-latency data fetching.
- 🎬 **4GB Support**: Seamlessly handles documents, videos, and audio of any size.
- 🧱 **Range-Resilient**: Integrated support for `Range` requests ensures downloads never fail and can be resumed.
- 🛡️ **Privacy Shield**: Operates as a transparent proxy, keeping your bot token secure.
- 📦 **Automated Binning**: Automatically mirrors files to a private storage channel for persistence.

---

## ⚙️ Configuration Setup

> [!IMPORTANT]
> To ensure stability on the Cloudflare Free Tier, this bot is optimized for high-frequency yielding to prevent execution timeouts.

### 1. Cloudflare KV Namespaces
Create two KV namespaces in your Cloudflare dashboard and link them in your `wrangler.toml`:
- `SESSIONS`: 🔒 Stores encrypted MTProto session data.
- `FILE_MAP`: 🗺️ Stores high-speed file-to-message mapping.

### 2. Environment Variables & Secrets
Supply the following secrets using `npx wrangler secret put <NAME>`:

| Variable | Description |
| :--- | :--- |
| `API_ID` | Your Telegram API ID from [my.telegram.org](https://my.telegram.org). |
| `API_HASH` | Your Telegram API Hash from [my.telegram.org](https://my.telegram.org). |
| `BOT_TOKEN` | Your Telegram Bot Token from [@BotFather](https://t.me/BotFather). |
| `BIN_CHANNEL` | The ID of your private storage channel (e.g., `-100123456789`). |
| `WORKER_URL` | The public endpoint of your worker (e.g., `https://stream.yourname.workers.dev`). |

---

## �️ Installation & Deployment

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Wrangler Integration**:
   Update your IDs in `wrangler.toml`.

3. **Production Deployment**:
   ```bash
   npx wrangler deploy
   ```

---

## 📽️ Usage Instructions

1.  **Start Interaction**: Invoke `/start` in your Telegram Bot.
2.  **Upload Media**: Send any file (Video/Audio/Document) to the bot.
3.  **Instant Streaming**: The bot will return a **Direct Download Link**.
4.  **Playback**: Paste the link into browser, VLC, or power-users can use 1DM+/IDM for accelerated downloads.

---

<div align="center">
  <sub>Built with ❤️ by the community. Optimized for Cloudflare Edge.</sub>
</div>
