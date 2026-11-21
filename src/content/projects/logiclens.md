---
title: 'LogicLens: multi-stage LLM fine-tuning for contradiction detection in long dialogues'
summary: Fine-tuned Mistral-7B (QLoRA, LoRA, DoRA) in four stages to find contradictions in 950 to 1,500-turn dialogues. Built the data engine, training and evaluation.
status: being-improved
featured: true
order: 1
hidden: false
period: { start: '2026-05', end: '2026-08' }
kind: internship
organisation:
  name: Central Narcotics Bureau (CNB)
  logo:
    src: /images/internship-logo.png
    alt: Central Narcotics Bureau logo
    width: 288
    height: 288
role: AI Research Project Intern. Designed and built the whole system end to end, from the synthetic data engine to custom training code, inference and evaluation, and presented it to senior management.
tags: [llm, nlp, fine-tuning, evaluation]
stack: [Python, PyTorch, Hugging Face Transformers, TRL, PEFT, bitsandbytes, Gemini API]
highlights:
  - title: 7B LLM on one T4 GPU
    detail: '4-bit QLoRA, LoRA, then DoRA; 43.3M trainable parameters'
  - title: Synthetic data engine
    detail: '45 dialogues of up to 1,500 turns; a 12-key API pipeline'
  - title: Custom weighted loss
    detail: 'Extended TRL to weight the quoted evidence 2x'
  - title: Evaluation audit
    detail: 'Found a train/test leak and two benchmark shortcuts'
results:
  - label: Zero-shot Mistral-7B-Instruct
    value: '0.69'
    metric: accuracy
    level: window level
    n: 39 windows from 6 held-out dialogues
    highlight: true
  - label: Fine-tuned (v2)
    value: '1.00'
    metric: accuracy
    level: window level
    n: 39 windows from 6 held-out dialogues
    note: A rule that reads no text also scores 1.00 on these windows (see Limitations).
    highlight: true
  - label: 'Reference: rule that reads no text (window length)'
    value: '1.00'
    metric: accuracy
    level: window level
    n: 39 windows from 6 held-out dialogues
  - label: Zero-shot Mistral-7B-Instruct
    value: '0.14'
    metric: F1 on contradiction turns
    level: turn level
    n: 32 contradiction turns among 1,696 turn rows
    note: precision 0.12, recall 0.19
    highlight: true
  - label: Fine-tuned (v2)
    value: '0.35'
    metric: F1 on contradiction turns
    level: turn level
    n: 32 contradiction turns among 1,696 turn rows
    note: precision 0.27, recall 0.50
    highlight: true
  - label: 'Reference: rule that reads no text (flag the turn 20 in from each edge)'
    value: '0.86'
    metric: F1 on contradiction turns
    level: turn level
    n: 32 contradiction turns among 1,696 turn rows
limitations:
  - Trained and tested on synthetic dialogues from one generator. The 6 test dialogues were never seen in training but come from the same generator, so this says nothing yet about real dialogues.
  - The test set is small. It has 39 windows from 6 dialogues, and one dialogue holds 27 of the 32 contradiction turns. 39 of 39 correct has a 95% lower bound of 0.91 if windows are treated as independent, and 0.54 when counted by dialogue (6 of 6).
  - The way the windows were cut leaves shortcuts. Every clean window is exactly 42 turns and no window with a contradiction is, so a rule that reads no text also classifies all 39 test windows correctly. Every contradiction sits at least 20 turns from a window edge, and flagging the turn 20 in from each edge scores turn-level F1 0.86. Whether the model uses these cues is not yet tested.
  - Overlapping windows leave some real contradictions unlabelled, so some of the model's extra flags may be correct and turn-level precision is understated by an unknown amount.
  - The model still flags turns next to a real contradiction.
  - One training run and one seed.
  - Inference is slow on a single T4. It averages about 120 seconds per window (4,772 s for 39 windows), and windows with contradictions take far longer than clean ones.
nextSteps:
  - 'Build a test without the shortcuts: equal-length windows at random positions over whole test dialogues, every contradiction labelled, and clean windows taken from dialogues that do contain contradictions.'
  - If the model relies on the shortcuts, cut the training windows the same way and retrain.
  - Add a plain-LoRA baseline and a no-curriculum ablation.
  - Re-run the unweighted variant on the same split.
evidence:
  [
    'claude/logiclens-internship.md (Claude Project doc)',
    'claude/logiclens-v2-site-brief.md (Claude Project doc)',
  ]
---

## What it does

Given a window of a long multi-speaker dialogue, the model lists every contradiction it finds as structured output: the turn, the verbatim line, and a one-sentence explanation. If it finds none, it says so. It is meant for reviewing long dialogues after they happen, where a person would otherwise read more than a thousand turns by hand.

## At a glance

- **Fine-tuned a 7B LLM on free hardware.** A four-stage curriculum for Mistral-7B-Instruct-v0.3 with QLoRA (4-bit NF4, double quantisation), LoRA and DoRA, merging each stage's adapter into the model before the next. The final DoRA stage trains 43.3M parameters (0.59%) across all seven projection layers on a single 16 GB T4.
- **Built the training data from scratch.** No labelled data existed, so I built a synthetic data engine on the Gemini API: 45 dialogues of 950 to 1,500 turns, with and without planted contradictions (1 to 5 per dialogue) at controlled distances (usually 50 to 70 turns apart, with 20% outliers).
- **Made an external-API pipeline survive real limits.** Rotation across 12 API keys, retries that tell daily quotas apart from per-minute limits, a checkpoint after every 100-turn block, and JSON repair with schema validation.
- **Cleaned the labels before training.** An audit removed 89 of 445 flags (20%) that sat on the wrong speaker, replaced a placeholder explanation with one written for each flag, and caught label leakage in an early prototype.
- **Extended the training library.** TRL's completion masking only switches tokens on or off (I checked its source), so I wrote a custom collator and `SFTTrainer` subclass for per-token loss weights, counting the quoted evidence twice and verifying every weighted span by decoding it back.
- **Rebuilt the evaluation.** Version 2 splits the data by dialogue instead of by window, adds a zero-shot baseline, and audits the benchmark for shortcuts. On 6 held-out dialogues the model classified all 39 windows correctly (zero-shot: 0.69) and raised turn-level F1 from 0.14 to 0.35.
- **Made training faster and reproducible.** Pinned every library version and switched to gradient-equivalent batching, checked numerically, which made training about 17% faster per example.
- **Took it to stakeholders.** Presented the work to senior management and received recognition; other departments then asked for details, seeing uses in their own work. Wrote an engineering design document proposing architectures for running the model in a real-time pipeline.

## How it evolved

Each version fixed something the previous one revealed.

1. **Prototype: a yes-or-no classifier on short dialogues.** Reviewing its training data turned up label leakage, which would have inflated every score after it. I fixed it before building anything on top.
2. **A curriculum instead of one big jump.** The model learns in stages: yes or no on short dialogues (Stage 1), then the structured output format and five contradiction types on short dialogues (Stage 2), then long dialogues (Stage 4, trained on the data Stage 3 generates). Each stage's adapter is merged in before the next. The format and the basic skill are cheaper to learn on short inputs.
3. **Long dialogues ran out of GPU memory.** A full dialogue does not fit on a T4, so I cut 41 to 61-turn windows around each flagged turn: 20 turns either side, merged when flags are within 15 turns, capped at 60. That gave 295 windows and 356 flags from 36 dialogues.
4. **The generated labels were wrong in places.** One flag in five sat on the speaker who pointed out a contradiction instead of the one who made it, and every flag shared the same placeholder explanation. I filtered the first and had each explanation rewritten from its own window.
5. **The loss treated the key evidence like any other token.** Standard fine-tuning weights every output token equally, but the quoted line is what makes an answer checkable. I extended TRL so those tokens count twice.
6. **The first scores were too good to trust.** Version 1 reported 0.93 window accuracy, but 29 of the 30 test windows came from dialogues also used in training, and there was no baseline. Version 2 splits by dialogue and compares against the untrained model.
7. **Version 2 scored perfectly, so I checked the benchmark itself.** Every clean window is exactly 42 turns long, so a rule that never reads the text also scores perfectly. The next version tests the model on windows without that cue.

## What this shows

- Building training data when no labelled data exists, with control over difficulty.
- Training a 7B model on a free 16 GB GPU with quantisation, adapters and resumable runs inside 12-hour session limits.
- Making external-API pipelines reliable under quotas and failures.
- Auditing data quality before modelling, not after.
- Reading library source code and extending it where it falls short.
- Distrusting good numbers: leakage checks, baselines, shortcut audits and confidence bounds.
- Explaining technical work to non-technical managers and a non-technical supervisor.

## Status

Version 2 splits the data by dialogue and adds a zero-shot baseline. The next step is a test without the shortcuts described under Limitations.
