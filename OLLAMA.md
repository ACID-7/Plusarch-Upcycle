# Free local AI with Ollama

Use a free local model for chat. The app combines live product data from Supabase with the prepared FAQ dataset from `data/ai-training`.

## 1. Install Ollama

- Windows / Mac / Linux: [ollama.com](https://ollama.com)
- Ollama serves an OpenAI-compatible API at `http://localhost:11434/v1`

## 2. Pull a model

```bash
ollama pull llama3.2:3b
```

Other small options:

- `ollama pull phi3:mini`
- `ollama pull mistral:7b-instruct`
- `ollama pull gemma2:2b`

## 3. Prepare the dataset

From the project root:

```bash
npm run ai:prepare
```

This creates a cleaned dataset and model-ready JSONL exports. The app will automatically prefer `faq-dataset.cleaned.json` at runtime.

## 4. Configure the app

Set these in `.env.local` or `.env`:

```env
AI_PROVIDER_BASE_URL=http://localhost:11434/v1
AI_PROVIDER_MODEL=llama3.2:3b
```

Do not set `AI_PROVIDER_API_KEY` for Ollama.

## 5. Run the app

```bash
npm run dev
```

## How it works

- FAQ and support answers use the cleaned dataset when available
- Product answers stay grounded in the live Supabase catalog
- Order updates still require support lookup instead of model hallucination

## Important note

Ollama by itself is not doing full supervised fine-tuning here. The repository now prepares proper training files, but local runtime still uses retrieval plus prompting unless you separately fine-tune a model and point the app to it.
