---
title: 'LogicLens: multi-stage LLM fine-tuning for contradiction detection in long dialogues'
summary: Fine-tuned a 7B LLM in four stages to find contradictions in 950 to 1,500-turn dialogues. I built the data generator, training code and inference pipeline.
status: being-improved
featured: true
order: 2
hidden: false
period: { start: '2026-05', end: '2026-08' }
kind: internship
role: AI Research Project Intern. Designed and built the pipeline end to end, from the synthetic data generator to training and inference.
tags: [llm, nlp, fine-tuning]
stack: [Python, PyTorch, Hugging Face Transformers, TRL, PEFT, Gemini API]
highlights:
  - { title: Short dialogues, detail: 'Stage 1: QLoRA, 4-bit' }
  - { title: Five flaw types, detail: 'Stage 2: LoRA on the merged model' }
  - { title: Long dialogues, detail: 'Stage 3: synthetic, 950 to 1,500 turns' }
  - { title: Windowed training, detail: 'Stage 4: DoRA, 41 to 61-turn windows' }
limitations:
  - No scores are shown yet. The current test split shares source dialogues with the training data and there are no baselines, so the evaluation is being redone.
  - The model tends to flag turns next to a real contradiction as well as the contradiction itself.
  - Inference is slow on a single T4 GPU, about 1,000 seconds for a window that contains a contradiction.
nextSteps:
  - Split the data by dialogue, not by window.
  - Add a zero-shot Mistral baseline and a plain-LoRA baseline.
  - Add a no-curriculum ablation.
  - Report turn-level metrics next to window-level ones.
  - Confirm which trained adapter each reported figure comes from.
evidence: ['claude/logiclens-internship.md (Claude Project doc)']
---

## What it does

Given a window of a long multi-speaker dialogue, the model lists the contradictions it finds as structured output: the turn, the verbatim line, and an explanation. If it finds none, it says so.

## Approach

- **Four-stage curriculum fine-tune** of Mistral-7B-Instruct-v0.3 with QLoRA (4-bit NF4, double quantisation), LoRA and DoRA, merging each stage's adapter before the next stage. Built with TRL and PEFT on free Kaggle T4 GPUs. The final stage is DoRA at rank 16 on all seven projection layers: 43.3M trainable parameters (0.59%), about 9 to 11.5 hours per run on one T4.
- **Synthetic data engine** for dialogues of 950 to 1,500 turns: speaker profiles, and planned contradictions with a controlled distance between a statement and the turn that contradicts it (usually 50 to 70 turns, with 20% outliers). Dialogues are generated in 100-turn blocks, with a 200-turn sliding window plus the exact earlier statements pinned into each prompt. The generator survives API limits: it rotates across 12 keys, tells daily limits from per-minute ones when retrying, checkpoints after every block, and repairs and validates the JSON it receives.
- **Data quality.** I audited the generated labels and removed 89 of 445 flags (20%) that sat on the wrong speaker, rewrote placeholder explanations flag by flag, and found and fixed label leakage in an early prototype.
- **Long inputs.** Out-of-memory failures on full-length dialogues led to a windowing scheme: windows of 41 to 61 turns around flagged turns (20 turns either side, merged when within 15 turns, capped at 60), giving 295 windows and 356 flags from 36 dialogues.
- **Custom training code.** The library's completion masking only switches tokens on or off (I checked its source), so I wrote a custom collator and an `SFTTrainer` subclass for per-token loss weights, weighting the quoted line's tokens 2x. Every weighted span's character-to-token mapping is checked by decoding it back. Training resumes cleanly inside the 12-hour GPU session limit.
- **Debugging.** Fixed a tokeniser span-boundary bug, a chat-template mismatch at inference, and adapter-merge ordering errors.
- **Design document.** Wrote an engineering design document proposing architectures for running the model inside a real-time pipeline.

## Status

Version 2 is in progress and focuses on the evaluation. Results will be published once it uses a split by dialogue and includes baselines.
