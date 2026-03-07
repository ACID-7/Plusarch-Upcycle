# Free local AI with Ollama

Use a **free local model** (no API key, no cost) for the chat. The app sends your **FAQ dataset** as context so the model answers with Plus Arch knowledge.

## 1. Install Ollama

- **Windows / Mac / Linux:** [ollama.com](https://ollama.com) → download and install.
- After install, Ollama runs in the background and serves an OpenAI-compatible API at `http://localhost:11434/v1`.

## 2. Pull a model

Open **any terminal** (PowerShell, Command Prompt, or Windows Terminal). The folder does not matter—Ollama works from any path.

```bash
ollama pull llama3.2:3b
```

Other small, fast options:

- `ollama pull phi3:mini`
- `ollama pull mistral:7b-instruct`
- `ollama pull gemma2:2b`

Use a 3B or 7B model for best balance of speed and quality on a normal PC.

## 3. Configure the app

Create or edit `.env` in the project root:

```env
AI_PROVIDER_BASE_URL=http://localhost:11434/v1
AI_PROVIDER_MODEL=llama3.2:3b
```

Do **not** set `AI_PROVIDER_API_KEY` (Ollama does not use it).

## 4. Run the app

```bash
npm run dev
```

Open the site and use the chat.

**How it works**

- **Ollama + dataset for Q&A:** The app uses your **FAQ dataset** (`data/ai-training/faq-dataset.json`) for answers about shipping, returns, materials, care, contact, greetings, etc. Those answers are either chosen directly from the dataset or sent as context to Ollama so the model replies in line with your content.
- **Products: catalog only:** For product questions (e.g. “Do you have rings?”, “Show necklaces”), the app **only checks** the live product catalog (Supabase). It does not use the dataset for product answers—so what you see (names, prices, availability) always comes from your actual catalog.
- No training step and no API key; the dataset is used for FAQ-style Q&A and the catalog is used for product checks.

## Summary

| Step        | Action |
|------------|--------|
| Install    | Ollama from [ollama.com](https://ollama.com) |
| Pull model | `ollama pull llama3.2:3b` |
| .env       | `AI_PROVIDER_BASE_URL=http://localhost:11434/v1`, `AI_PROVIDER_MODEL=llama3.2:3b` |
| Run        | `npm run dev` |

The chat uses your FAQ dataset as context with the free local model.

## Troubleshooting: "AI chatbot not working"

1. **Use the AI Chat tab**  
   In the chat window, switch to **"AI Chat"** (not "Live Chat"). Only the AI tab calls the local model.

2. **Ollama must be running**  
   After installing Ollama, it usually runs in the background. If you closed it:
   - **Windows:** Start "Ollama" from the Start menu, or run `ollama serve` in a terminal.
   - **Mac/Linux:** Run `ollama serve` in a terminal.

3. **Model must be pulled**  
   If you see a generic reply or "Ollama did not respond", pull the model:
   ```bash
   ollama pull llama3.2:3b
   ```
   Wait until it finishes, then try the chat again.

4. **.env location and restart**  
   Put `AI_PROVIDER_BASE_URL` and `AI_PROVIDER_MODEL` in `.env` or `.env.local` in the **project root** (same folder as `package.json`). Restart the dev server (`npm run dev`) after changing env.

5. **Check the terminal**  
   When you send an AI message, the Next.js dev server talks to Ollama. If Ollama is not running, you may see connection errors in the terminal where `npm run dev` is running.
