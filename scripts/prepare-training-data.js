/**
 * Prepare a cleaner support dataset and model-ready JSONL files.
 *
 * Outputs:
 * - data/ai-training/faq-dataset.cleaned.json
 * - data/ai-training/fine-tune-train.jsonl
 * - data/ai-training/fine-tune-valid.jsonl
 * - data/ai-training/training-report.json
 *
 * Run:
 *   node scripts/prepare-training-data.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data', 'ai-training');
const RAW_DATASET_PATH = path.join(DATA_DIR, 'faq-dataset.json');
const CLEAN_DATASET_PATH = path.join(DATA_DIR, 'faq-dataset.cleaned.json');
const TRAIN_JSONL_PATH = path.join(DATA_DIR, 'fine-tune-train.jsonl');
const VALID_JSONL_PATH = path.join(DATA_DIR, 'fine-tune-valid.jsonl');
const REPORT_PATH = path.join(DATA_DIR, 'training-report.json');

const SYSTEM_PROMPT =
  'You are Plus Arch Upcycle customer support. Answer clearly, briefly, and accurately. ' +
  'Use only established store policy. Never invent live product availability, prices, shipping progress, or order status. ' +
  'For live catalog questions, direct the user to the catalog or support. For order updates, ask for the order details in support chat.';

const FINE_TUNE_EXCLUDED_INTENTS = new Set(['product']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function repairMojibake(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (!/[ÃÂâ€™â€œâ€]/.test(trimmed)) {
    return trimmed;
  }

  try {
    const repaired = Buffer.from(trimmed, 'latin1').toString('utf8');
    const before = (trimmed.match(/[ÃÂâ€™â€œâ€]/g) || []).length;
    const after = (repaired.match(/[ÃÂâ€™â€œâ€]/g) || []).length;
    return after < before ? repaired.trim() : trimmed;
  } catch {
    return trimmed;
  }
}

function cleanText(text) {
  return repairMojibake(String(text || ''))
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeQuestion(question) {
  return cleanText(question)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[?!.]+$/g, '')
    .trim();
}

function normalizeAnswer(answer) {
  return cleanText(answer)
    .replace(/\s+/g, ' ')
    .trim();
}

function isLowQualitySyntheticQuestion(question) {
  const q = normalizeQuestion(question);

  if (!q) return true;

  const badPatterns = [
    /\babout plus arch\b/,
    /\bfor plus arch\b/,
    /\bplus arch$/,
    /\bavailable\? please\b/,
    /\bshow me .* about plus arch\b/,
    /\bsearching for .* about plus arch\b/,
    /\btell me about your .* about plus arch\b/,
    /\bhi! there\b/,
    /\bhello! there\b/,
  ];

  return badPatterns.some((pattern) => pattern.test(q));
}

function shouldDropPair(pair) {
  if (!pair || typeof pair !== 'object') {
    return 'invalid';
  }

  const intent = cleanText(pair.intent || '').toLowerCase();
  const question = cleanText(pair.question || '');
  const answer = cleanText(pair.answer || '');

  if (!intent || !question || !answer) {
    return 'missing_fields';
  }

  if (isLowQualitySyntheticQuestion(question)) {
    return 'synthetic_noise';
  }

  return null;
}

function comparePairQuality(a, b) {
  const aAnswerLen = normalizeAnswer(a.answer).length;
  const bAnswerLen = normalizeAnswer(b.answer).length;
  const aQuestionLen = normalizeQuestion(a.question).length;
  const bQuestionLen = normalizeQuestion(b.question).length;

  if (aAnswerLen !== bAnswerLen) {
    return bAnswerLen - aAnswerLen;
  }

  return bQuestionLen - aQuestionLen;
}

function buildCleanDataset(rawPairs) {
  const dropped = {
    invalid: 0,
    missing_fields: 0,
    synthetic_noise: 0,
    duplicate_question: 0,
  };

  const bestByKey = new Map();

  for (const rawPair of rawPairs) {
    const dropReason = shouldDropPair(rawPair);
    if (dropReason) {
      dropped[dropReason] += 1;
      continue;
    }

    const pair = {
      intent: cleanText(rawPair.intent).toLowerCase(),
      question: cleanText(rawPair.question),
      answer: cleanText(rawPair.answer),
    };

    const key = `${pair.intent}|${normalizeQuestion(pair.question)}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, pair);
      continue;
    }

    const preferred = comparePairQuality(existing, pair) <= 0 ? existing : pair;
    const discarded = preferred === existing ? pair : existing;
    if (discarded) {
      dropped.duplicate_question += 1;
    }
    bestByKey.set(key, preferred);
  }

  const pairs = Array.from(bestByKey.values()).sort((a, b) => {
    if (a.intent !== b.intent) return a.intent.localeCompare(b.intent);
    return a.question.localeCompare(b.question);
  });

  return { pairs, dropped };
}

function createExamples(pairs) {
  return pairs
    .filter((pair) => !FINE_TUNE_EXCLUDED_INTENTS.has(pair.intent))
    .map((pair) => ({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: pair.question },
        { role: 'assistant', content: pair.answer },
      ],
      metadata: { intent: pair.intent },
    }));
}

function deterministicShuffle(items) {
  const cloned = [...items];
  cloned.sort((a, b) => {
    const aKey = `${a.metadata.intent}|${a.messages[1].content}`;
    const bKey = `${b.metadata.intent}|${b.messages[1].content}`;
    return aKey.localeCompare(bKey);
  });
  return cloned;
}

function splitExamples(examples, validationRatio) {
  const ordered = deterministicShuffle(examples);
  const total = ordered.length;
  const validationCount = Math.max(1, Math.round(total * validationRatio));
  const trainCount = Math.max(1, total - validationCount);
  return {
    train: ordered.slice(0, trainCount),
    valid: ordered.slice(trainCount),
  };
}

function writeJsonl(filePath, rows) {
  const lines = rows.map((row) => JSON.stringify(row));
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function countByIntent(pairs) {
  return pairs.reduce((acc, pair) => {
    acc[pair.intent] = (acc[pair.intent] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  const raw = readJson(RAW_DATASET_PATH);
  const rawPairs = Array.isArray(raw.pairs) ? raw.pairs : [];

  const { pairs, dropped } = buildCleanDataset(rawPairs);
  const examples = createExamples(pairs);
  const { train, valid } = splitExamples(examples, 0.1);

  const cleanDataset = {
    description:
      'Cleaned Plus Arch Upcycle support dataset for retrieval and fine-tuning preparation. Product intent is retained for retrieval but excluded from fine-tune exports.',
    source: 'faq-dataset.json',
    system_prompt: SYSTEM_PROMPT,
    excluded_from_fine_tune: Array.from(FINE_TUNE_EXCLUDED_INTENTS),
    intents: Array.from(new Set(pairs.map((pair) => pair.intent))),
    pairs,
  };

  const report = {
    generated_at: new Date().toISOString(),
    source_file: path.relative(ROOT, RAW_DATASET_PATH),
    cleaned_file: path.relative(ROOT, CLEAN_DATASET_PATH),
    train_file: path.relative(ROOT, TRAIN_JSONL_PATH),
    valid_file: path.relative(ROOT, VALID_JSONL_PATH),
    raw_pairs: rawPairs.length,
    cleaned_pairs: pairs.length,
    fine_tune_examples: examples.length,
    train_examples: train.length,
    valid_examples: valid.length,
    dropped,
    pair_counts_by_intent: countByIntent(pairs),
    fine_tune_counts_by_intent: countByIntent(
      pairs.filter((pair) => !FINE_TUNE_EXCLUDED_INTENTS.has(pair.intent))
    ),
  };

  writeJson(CLEAN_DATASET_PATH, cleanDataset);
  writeJsonl(TRAIN_JSONL_PATH, train);
  writeJsonl(VALID_JSONL_PATH, valid);
  writeJson(REPORT_PATH, report);

  console.log(`Prepared ${pairs.length} cleaned pairs from ${rawPairs.length} raw pairs.`);
  console.log(`Fine-tune examples: ${examples.length} (${train.length} train / ${valid.length} valid).`);
  console.log(`Wrote ${path.relative(ROOT, CLEAN_DATASET_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, TRAIN_JSONL_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, VALID_JSONL_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);
}

main();
