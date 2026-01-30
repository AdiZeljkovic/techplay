# 🤖 TechPlay Discord Bot - Recommendations & Analysis

Based on the analysis of the TechPlay ecosystem (Next.js Frontend + Laravel Backend), here is the proposed architecture and feature set for the official Discord bot.

## 🏗 Technology Stack
We will use a stack consistent with the frontend to ensure maintainability:
- **Language:** TypeScript (Node.js)
- **Library:** `discord.js` (Industry standard, v14+)
- **HTTP Client:** `axios` (For communicating with TechPlay API)
- **Deployment:** Docker / PM2 (Same as frontend)

## 💡 Recommended Features

### Phase 1: Content & Information (Read-Only)
These features use public API endpoints and don't require user authentication.

1.  **📰 automated News Feed**
    -   **Function:** Polls `/api/v1/news` and `/api/v1/reviews` every 10 minutes.
    -   **Action:** Posts beautiful embeds to configured Discord channels (e.g., `#gaming-news`, `#reviews`).
    -   **Benefit:** Keeps the Discord community engaged with website content automatically.

2.  **🔍 Slash Commands**
    -   `/search [query]`: Search for articles/reviews using `/api/v1/search/articles`.
    -   `/latest [category]`: Fetch the latest 5 items from a category.
    -   `/status`: Checks `/api/v1/system/status` to report if the website is online/maintenance.

3.  **📊 Server Stats**
    -   Bot status can rotate: "Watching TechPlay.gg | /help"

### Phase 2: Community Integration (Requires Auth)
These features deepen the integration but require OAuth2 or token linking.

1.  **🔗 Account Linking**
    -   Users can link their Discord ID to their TechPlay profile.
    -   **Sync Roles:** If a user subscribes on the site (Subscribers Plan), they automatically get a "Supporter" role in Discord.

2.  **💬 Forum Notifications**
    -   Notify when a user receives a reply on the forum (via DM or notification channel).

## 📂 Project Structure
I propose the following structure for the `discord` folder:

```
discord/
├── src/
│   ├── commands/       # Slash command definitions
│   ├── events/         # Event handlers (ready, interactionCreate)
│   ├── services/       # API wrappers (ApiService.ts)
│   ├── utils/          # Helpers (embed builders)
│   ├── config/         # Configuration
│   └── index.ts        # Entry point
├── .env                # Token & API URL
├── package.json
└── tsconfig.json
```

## 🚀 Next Steps
If you agree with this plan, I can immediately:
1.  Initialize the Node.js project.
2.  Install `discord.js`, `typescript`, `axios`.
3.  Set up the basic bot structure (boilerplate).
4.  Implement the **`/status`** and **`/search`** commands as a proof of concept.

**Do you want me to proceed with initializing the project structure?**
