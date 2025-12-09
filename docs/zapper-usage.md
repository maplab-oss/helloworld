# Working with Long-Running Processes (zap.yaml Projects)

## TL;DR for AI Agents

This project runs background processes via `zap.yaml` config. **Processes persist after commands exit.**

**Your workflow:**
1. Check status: `zap status`
2. If already running → Edit code (hot reload works)
3. If not running → Start: `zap up`
4. View logs: `zap logs <service> --no-follow`
5. If broken → Restart: `zap restart <service>`

**Never run `zap up` without checking `zap status` first.** Duplicate processes cause port conflicts.

## Common Mistakes When Adding Features

1. **Forgetting to add the service to `zap.yaml`** - Add it under `bare_metal` or `docker`, then run `zap up servicename`

2. **Forgetting environment variables (more common)** - Add the variable to `.env` (or appropriate env file), then whitelist it in the service's `env:` array in `zap.yaml` so it gets passed to that service

---

For complete documentation, see: https://zapper.felixsebastian.dev