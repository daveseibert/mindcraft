Not the real one. See [kolbytn/mindcraft](https://github.com/kolbytn/mindcraft)

This repo will focus on dockerization and running a server for the bot to join.

- [X] Add server container
- [X] Get secrets from env vars (it was already like this)
- [X] Get host/port from env vars (there was an env var for port, but not host)
- [X] Add a second model (Claude; works great, much better than GPT)
- [X] Add a third model (Gemini; logs in, great attitude, keeps disconnecting)
- [X] Move bots to individual containers
- [X] Run Minecraft servers on Raspberry Pi
- [ ] Run agents on Raspberry Pi (it's not building for arm64 for reasons unknown, at this time)
- [X] Move API calls to FastAPI container
- [X] Cache embeddings in Redis
- [X] Cache completions in Redis
- [X] Move Mindserver to separate container

