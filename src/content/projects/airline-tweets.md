---
title: 'Tweet Sentiment: unsupervised NLP on 14,639 airline tweets'
summary: 'Team NLP project: unsupervised sentiment analysis of 14,639 airline tweets, comparing TF-IDF, sentence-embedding clustering and Twitter-tuned transformers.'
status: complete
featured: true
order: 4
hidden: false
period: { start: '2025-08', end: '2025-12' }
kind: team
role: In a team of four (NUS IT1244 course project), I designed the end-to-end unsupervised pipeline, preprocessed the text, built the TF-IDF and SBERT representations, tuned dimensionality reduction and clustering, and compared transformer sentiment models.
tags: [nlp, unsupervised-learning, clustering, transformers]
stack: [Python, scikit-learn, Sentence-Transformers, Hugging Face Transformers, UMAP, HDBSCAN]
skills:
  - Natural language processing (NLP)
  - Sentiment analysis
  - Unsupervised learning and clustering
  - TF-IDF
  - SBERT sentence embeddings
  - BERT language models
  - PCA, t-SNE and UMAP
  - Neural networks
results:
  - label: 'Majority-class baseline (always "negative")'
    value: '0.26'
    metric: macro-F1
    n: 14,639 tweets
    note: Accuracy 0.63, because 63% of the tweets are negative.
    highlight: true
  - label: TF-IDF + k-means clustering
    value: '0.24'
    metric: macro-F1
    n: 14,639 tweets
    note: Accuracy 0.29. One cluster swallowed 13,296 of the 14,639 tweets.
    highlight: true
  - label: TF-IDF + NMF topic model
    value: '0.46'
    metric: macro-F1
    n: 14,639 tweets
    note: Accuracy 0.54
    highlight: true
  - label: MiniLM-L6-v2 sentence embeddings + k-means
    value: '0.40'
    metric: macro-F1
    n: 14,639 tweets
    note: Accuracy 0.47
  - label: Multilingual DistilBERT sentence embeddings + k-means
    value: '0.55'
    metric: macro-F1
    n: 14,639 tweets
    note: Accuracy 0.57
    highlight: true
  - label: Twitter-XLM-RoBERTa, pretrained multilingual sentiment model
    value: '0.44'
    metric: macro-F1
    n: 14,639 tweets
    note: Accuracy 0.48
  - label: Twitter-RoBERTa, pretrained English sentiment model
    value: '0.66'
    metric: macro-F1
    n: 14,639 tweets
    note: Accuracy 0.67, the best result without using this dataset's labels for training.
    highlight: true
limitations:
  - Macro-F1 here is the mean of the per-class F1 scores in the project report, which are rounded to whole percentages, so treat the second decimal as approximate.
  - Accuracy flatters this data. 63% of the tweets are negative, so always answering "negative" scores 0.63, and only the Twitter-tuned RoBERTa beats that. That is why macro-F1 is the headline metric on this page.
  - Clusters were mapped to sentiments by reading their top words and label mix, so the clustering scores use the labels once, at mapping time.
  - Neutral tweets are the hardest class for every method except the collapsed k-means baseline; the best neutral F1 is 0.50.
  - The 0.81 supervised result comes from the project notebook, and the report does not state its train/test split.
  - The report gives one score per method, with no repeated runs or confidence intervals.
nextSteps:
  - Score the supervised classifier on a fixed held-out split and report macro-F1 next to accuracy.
  - Fine-tune a Twitter-tuned transformer on part of the labels to measure how much they add.
evidence: ['LinkedIn project entry and the IT1244 project report attached to it (read 20 Nov 2026)']
---

## Problem

Classify the sentiment (negative, neutral or positive) of 14,639 tweets about six US airlines without training on this dataset's labels. The labels are used to score the results and, for the clustering methods, to name each cluster. The classes are imbalanced: 63% of the tweets are negative, so accuracy alone flatters weak methods, and macro-F1 is the fairer headline.

## At a glance

- **Built an end-to-end NLP pipeline** for noisy social-media text: case normalisation, URL and symbol removal, standardised mentions and airline names, lemmatisation and language filtering.
- **Compared three families of methods** on the same 14,639 tweets: lexical (TF-IDF with k-means and NMF), semantic (SBERT sentence embeddings with clustering) and pretrained Twitter sentiment transformers.
- **Tuned the unsupervised side systematically:** PCA with components chosen by cumulative explained variance, t-SNE and UMAP, grid-searched settings, and HDBSCAN scored by cluster purity.
- **Best label-free result: 0.66 macro-F1 and 0.67 accuracy** with Twitter-RoBERTa, against 0.26 macro-F1 for always answering "negative". With labels, a supervised classifier reached 0.81 accuracy.
- **Weighed accuracy against compute cost** when choosing between transformer models.

## How it evolved

1. **TF-IDF with k-means as the baseline.** Word-count features with hard clustering collapsed: one cluster took 13,296 of the 14,639 tweets, for 0.29 accuracy.
2. **Soft clustering with NMF.** Non-negative matrix factorisation lets a tweet belong partly to several topics. Accuracy rose to 0.54, but neutral tweets stayed hard (F1 0.21).
3. **Sentence embeddings instead of word counts.** SBERT models (multilingual DistilBERT, 768 dimensions; MiniLM-L6-v2, 384 dimensions) encode meaning rather than vocabulary. Reduced with PCA, t-SNE or UMAP and clustered, multilingual DistilBERT reached 0.57 accuracy.
4. **Why MiniLM did worse (0.47).** In its compact space, tweets about the same thing sit together whatever their sentiment, so clusters followed topics rather than feelings. Trained with labels, classifiers separate the same kind of embeddings well, so the signal is there; clustering alone cannot find it.
5. **Pretrained Twitter sentiment models.** A RoBERTa model already fine-tuned on Twitter sentiment, applied with no training on this data, did best: 0.67 accuracy and 0.66 macro-F1. The multilingual version scored 0.48. Only 1.23% of these tweets are not in English, so a monolingual Twitter model fits the data better.

## What this shows

- Cleaning and representing noisy social-media text, from TF-IDF to transformer embeddings.
- Judging methods against a majority-class baseline with an imbalance-aware metric.
- Explaining a failure (MiniLM clustering by topic) instead of just reporting a lower score.
- Choosing a model by its fit to the data (monolingual versus multilingual) and by compute cost.
