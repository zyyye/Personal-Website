---
title: 'POLLUX: a full-stack data visualisation and analytics web app'
summary: 'NUS Orbital team project: a Streamlit and Supabase web app where anyone can upload a CSV, clean it, chart it 16 ways and run quick predictions.'
status: complete
featured: false
order: 5
hidden: false
period: { start: '2025-04', end: '2025-08' }
kind: team
role: 'In a team of two for NUS Orbital, I wrote most of the code (83 of 122 commits): Supabase sign-in and storage, the data summary, automatic cleaning and what-if predictions. We built the charts and trend forecasting together.'
tags: [data-visualisation, web-development, data-cleaning, machine-learning]
stack: [Python, Streamlit, Supabase, pandas, scikit-learn, Plotly]
skills:
  - Full-stack web development
  - Data visualization
  - Data cleaning
  - Exploratory data analysis
  - Machine learning pipelines (scikit-learn)
  - Authentication and cloud storage
  - Git and GitHub
deckSkills:
  - Full-stack web development
  - Data visualization
  - Data cleaning
links:
  code: https://github.com/zyyye/POLLUX
  certificate: https://credentials.nus.edu.sg/f81a9f4f-5474-4c2e-87fe-32383f3b003d
flow:
  caption: How POLLUX handles a CSV
  steps:
    - { title: Sign in, detail: 'Supabase Auth account, email and password' }
    - { title: Upload, detail: 'Saved to Supabase Storage, reopened from file history' }
    - { title: Clean, detail: 'Drops ID columns, sorts variable types, removes outliers' }
    - { title: Summarise, detail: 'Missing values, quantiles, skew and kurtosis per column' }
    - { title: Chart, detail: '16 chart types, custom colours, one-click PNG download' }
    - { title: Predict, detail: 'What-if values and trend forecasts with scikit-learn' }
highlights:
  - {
      title: 16 chart types,
      detail: 'For one, two or three variables, from ECDFs to 3D stem plots',
    }
  - { title: Accounts and storage, detail: "Supabase sign-in; each user's CSVs kept in the cloud" }
  - { title: What-if predictions, detail: 'Pipelines switch between classification and regression' }
  - { title: Orbital Gemini level, detail: 'NUS Computing award for core features plus extensions' }
limitations:
  - Predictions are fitted on the whole uploaded file and shown without a held-out check, so they come with no accuracy estimate.
  - Variable types come from simple rules. A column with 10 or fewer distinct values counts as categorical, and any column whose name ends in "id" is dropped as an identifier, which also catches names such as "paid" or "valid".
  - Trend forecasts run to 1.5 times the largest observed x value, beyond the data the models were fitted on, with no uncertainty band.
nextSteps:
  - Hold out part of each file and show every model's accuracy next to its prediction.
  - Detect ID columns by whole name and by uniqueness, not by how the name ends.
evidence:
  - 'LinkedIn project entry, project poster and NUS Orbital credential (read 21 Nov 2026)'
  - 'Source code at github.com/zyyye/POLLUX: 83 of 122 commits by Leo; authorship of each part checked line by line'
---

## Problem

Charting a dataset usually means writing code or learning a BI tool. POLLUX is for people with neither: upload a CSV and explore it through summaries, charts and quick predictions in the browser, with no code.

## At a glance

- **Built a full-stack data web app** in Python, with Streamlit for the interface and Supabase for accounts, file storage and a metadata table. It was deployed on Streamlit Community Cloud.
- **Per-user data storage:** each user's CSVs go to Supabase Storage, are indexed in a Postgres table, and can be reopened, downloaded or deleted from a file history.
- **Automatic data preparation:** drops ID columns, sorts variables into numerical and categorical, and summarises every column (missing values, quantiles, skew, kurtosis, most frequent value). Users can edit and filter the data in a table and remove outliers (1.5 × IQR rule) in one click.
- **16 chart types** for one, two or three variables, from histograms and ECDFs to hexbin and 3D stem plots, with custom colours, background images and one-click PNG download.
- **What-if predictions:** enter new values and several scikit-learn pipelines (imputation, scaling and one-hot encoding) predict the target. They switch between classification and regression from the target's type and combine by majority vote or average. The new row can be added to the dataset and plotted.
- **Trend forecasting** with the mean of five regression models (linear, random forest, gradient boosting, k-nearest neighbours and decision tree), built together with my teammate.
- **Awarded NUS Orbital's Gemini (Intermediate) level**, given for an app with a good set of core features and a number of extensions.

## How it works

1. **Accounts.** Sign-up and sign-in run through Supabase Auth, and the session carries the user's ID through the app.
2. **Files.** An upload is stored in a Supabase Storage bucket under the user's ID, with its name and upload time in a `user_csvs` table. The file history lists them newest first.
3. **Preparation.** pandas drops identifier columns, detects variable types and builds the summary table. Filtering, editing and outlier removal work on a copy, so the original file stays intact.
4. **Charts.** Charts are grouped by how many variables they take (one, two or three), and each asks only for the variable types it can draw, numerical or categorical. They are drawn with Matplotlib, Seaborn and Plotly.
5. **Models.** Each prediction builds a scikit-learn `Pipeline` with a `ColumnTransformer`: mean imputation and scaling for numerical inputs, most-frequent imputation and one-hot encoding for categorical ones.

We worked in Git and GitHub with a branch per person, merging into `main` (122 commits, 22 merges).

## What this shows

- Shipping a complete product, not just a notebook: accounts, storage, interface and analysis.
- Turning data-science steps (cleaning, summary statistics, model pipelines) into a tool that non-specialists can use.
- Integrating a hosted authentication and storage service into a Python app.
- Team software development with Git over four months.
