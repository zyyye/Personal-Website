---
title: 'DeepWeeds: why a CNN scored below baseline, and how it was fixed'
summary: Team computer-vision project on 9 weed classes. I traced a below-baseline AlexNet to its causes (macro-F1 0.49 to 0.83) and benchmarked ConvNeXt and DINOv3.
status: complete
featured: true
order: 3
hidden: false
period: { start: '2026-01', end: '2026-04' }
kind: team
role: Built the team's AlexNet baseline, annotated about a quarter of all bounding boxes, worked on part of the YOLO and ResNet50 work, and co-wrote the report. Then ran a follow-up investigation that found and fixed the root causes of the AlexNet result.
tags: [computer-vision, deep-learning, experiment-design]
stack: [Python, PyTorch, timm, YOLO]
skills:
  - Computer vision
  - Transfer learning
  - CNNs and vision transformers
  - Ablation studies
  - Model evaluation
  - Statistical analysis (bootstrap confidence intervals)
  - Data annotation
deckSkills:
  - Computer vision
  - Transfer learning
  - CNNs and vision transformers
  - Ablation studies
  - Statistical analysis (bootstrap confidence intervals)
  - Data annotation
results:
  - label: Majority-class baseline
    value: '0.521'
    metric: test accuracy
    n: 1,750 test images
  - label: First AlexNet attempt
    value: '0.508'
    metric: test macro-F1
    n: 1,750 test images
    seeds: 1
    highlight: true
  - label: Reproduction of that recipe
    value: 0.487 ± 0.021
    metric: test macro-F1
    n: 1,750 test images
    seeds: 3
  - label: AlexNet, team-standard pipeline
    value: 0.834 ± 0.003
    metric: test macro-F1
    n: 1,750 test images
    seeds: 3
    highlight: true
  - label: AlexNet, team-standard pipeline
    value: 0.880 ± 0.002
    metric: test accuracy
    n: 1,750 test images
    seeds: 3
  - label: AlexNet (Improved pipeline)
    value: '0.870'
    metric: test macro-F1
    n: 1,750 test images
    seeds: 1
    note: 'Team-standard pipeline plus a modern recipe (AdamW, warmup and cosine decay, label smoothing, TrivialAugment, mixed precision). +0.036 over the team-standard AlexNet; 95% paired bootstrap interval +0.021 to +0.062.'
    highlight: true
  - label: AlexNet (Improved pipeline)
    value: '0.903'
    metric: test accuracy
    n: 1,750 test images
    seeds: 1
  - label: DINOv3 ViT-S/16, frozen features + linear head
    value: '0.882'
    metric: test macro-F1
    n: 1,750 test images
    seeds: 1
    highlight: true
  - label: DINOv3 ViT-S/16, fine-tuned
    value: '0.951'
    metric: test macro-F1
    n: 1,750 test images
    seeds: 1
  - label: ConvNeXt-Tiny, team-standard pipeline
    value: '0.960'
    metric: test macro-F1
    n: 1,750 test images
    seeds: 1
    highlight: true
  - label: ConvNeXt-Tiny, modern training recipe
    value: '0.971'
    metric: test macro-F1
    n: 1,750 test images
    seeds: 1
limitations:
  - The modern-recipe, DINOv3 and ConvNeXt rows are single-seed. The ConvNeXt gain from the modern recipe is not shown, because the intervals overlap.
  - The modern recipe is a bundle of five changes, so these runs cannot say which part helped.
  - About −0.06 of the original drop is unexplained, and the explanation of the interaction between the two causes is an untested hypothesis.
  - The same test set was used for every comparison. The comparisons were fixed beforehand, but the numbers are not tuned-then-reported expectations.
nextSteps:
  - Run the re-initialised first layer together with both imbalance corrections, without the other changes, to test the interaction.
  - Add two more seeds for the modern-recipe rows.
evidence: ['claude/deepweeds-alexnet-rerun.md (Claude Project doc)']
---

## At a glance

- **Fixed a model that scored below the majority-class baseline.** Took a transfer-learning AlexNet from 0.49 to 0.83 test macro-F1 (+71%, three seeds) by finding and removing its two root causes.
- **Ran a controlled ablation.** 12 experiments, 26 training runs, three seeds and paired bootstrap confidence intervals (2,000 resamples). The largest single cause, a re-initialised first convolution layer, cost 0.17 macro-F1.
- **Modernised the training recipe.** AdamW, warmup with cosine decay, label smoothing, TrivialAugment and mixed precision took AlexNet to 0.870 and ConvNeXt-Tiny to 0.971 macro-F1. ConvNeXt-Tiny also trained 4.6x faster (80.6 to 17.4 minutes, most likely thanks to mixed precision).
- **Benchmarked a self-supervised foundation model.** DINOv3 ViT-S/16 with frozen features and a linear head reached 0.882 macro-F1 in 5.9 minutes, beating a fully fine-tuned AlexNet; fine-tuned, it reached 0.951.

## Problem

Classify the nine classes of the DeepWeeds image dataset: eight weed species plus a negative class that makes up 52% of the images. Because of that imbalance, macro-F1 is the headline metric, and every model is judged against the majority-class baseline (always predict "negative": 0.521 accuracy).

## The team's pipeline

A two-phase design. Phase 1 localises weeds with YOLO. Phase 2 classifies the nine classes, with and without bounding-box crops, using AlexNet, ResNet50, ConvNeXt and Swin, all on the same fixed split. I wrote the AlexNet notebook; teammates built the other classifiers.

## Approach

1. **Set-up.** A fixed shared split (12,239 train, 3,498 validation, 1,750 test images), 224 px inputs, batch 32, at most 15 epochs, the checkpoint with the best validation macro-F1, and the test set used once per run.
2. **First AlexNet attempt.** Test accuracy 0.4394 and macro-F1 0.508: below the majority-class baseline. I treated that as a bug to find, not as a verdict on the architecture.
3. **Two hypotheses.** A compounded class-imbalance correction (a balanced sampler and a weighted loss at the same time), and a re-initialised first convolution layer.

## Follow-up investigation

4. **Reproduce the failure first.** Re-running the original recipe with three seeds gives 0.487 ± 0.021 macro-F1 and 0.17 recall on the negative class, so the failure is real and repeatable.
5. **Controlled ablation.** One change at a time against the team's standard pipeline: 12 experiments, 26 training runs, 3 seeds, and paired bootstrap intervals with 2,000 resamples.
6. **Fix.** Fine-tune the standard pipeline, replacing only the classifier head: 0.834 ± 0.003 macro-F1 and 0.880 ± 0.002 accuracy over three seeds.
7. **Validate the pipeline.** ConvNeXt-Tiny run through the same pipeline reproduces the team's own result (0.9674 accuracy), so the AlexNet comparison is like for like.
8. **Modernise the training recipe.** AdamW with decoupled weight decay, one warmup epoch then cosine decay, label smoothing 0.1, TrivialAugment and mixed precision. AlexNet reaches 0.870 macro-F1; the paired bootstrap interval for the gain, [+0.021, +0.062], excludes zero. TrivialAugment cost about 1.0 ms per image against 7.5 ms for the old augmentation stack. ConvNeXt-Tiny trained in 17.4 minutes instead of 80.6, most likely because of mixed precision (data-loading workers also differed).
9. **Foundation-model comparison.** DINOv3 ViT-S/16 with frozen features and a linear head reaches 0.882 macro-F1 in 5.9 minutes, beating a fully fine-tuned AlexNet (0.834). Fine-tuned, it reaches 0.951.
10. **Conclusion.** The weak result came from the training recipe, not from AlexNet's age. The architecture gap to ConvNeXt is about 0.13 macro-F1, not 0.45, and the ranking ConvNeXt, then DINOv3, then AlexNet did not change.

## What each cause cost

Change in test macro-F1 against the team-standard AlexNet, averaged over three seeds:

| Change                                      | Effect | Significant?                             |
| ------------------------------------------- | ------ | ---------------------------------------- |
| Re-initialised first convolution layer      | −0.167 | Yes; the largest single cause            |
| Balanced sampler and weighted loss together | −0.103 | Yes; negative-class recall falls to 0.65 |
| Weighted loss alone                         | −0.034 | Yes, small                               |
| Heavy augmentation                          | −0.019 | Borderline                               |
| Balanced sampler alone                      | −0.013 | No; the interval includes zero           |
| The full original recipe                    | −0.347 | Yes; negative-class recall 0.17          |

The separate effects add up to about −0.29, against −0.35 measured for the full recipe. The rest comes from settings never tested alone, or from the causes interacting.

## Why these causes matter

- **The first layer.** The later pretrained layers expect the features the original first layer produces. A randomly initialised first layer feeds them noise, so the pretrained weights stop helping.
- **Double imbalance correction.** A balanced sampler and a 1/count weighted loss each shift the model's view of the class balance by roughly 9x; together, roughly 81x against a class that is 52% of the data. Errors on that large class then turn into false positives in every small class, which is exactly what macro-F1 punishes. This explanation of the interaction is a hypothesis: the run that would test it has not been done.

## What this shows

The work follows a debugging loop: reproduce the failure, form hypotheses, isolate one change at a time, fix, and verify. Results are judged against a baseline and with a metric suited to imbalanced data. Claims rest on repeated seeds and confidence intervals, and the effects that were not significant are reported too. The pipeline was validated against the team's own result before comparing models, and the comparison includes a current foundation model.
