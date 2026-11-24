---
title: 'GAIA agent: a research agent for the Hugging Face Agents Course capstone'
summary: 'A LangGraph agent on Claude that searches the web, reads pages and PDFs, and runs Python to answer GAIA benchmark questions graded by exact match.'
status: complete
featured: false
order: 2
hidden: false
period: { start: '2026-11', end: '2026-11' }
kind: solo
role: 'Solo capstone. I designed and wrote the agent: the LangGraph state graph, three tools, attachment handling and exact-match answer parsing, then connected it to the course evaluation app.'
tags: [ai-agents, agentic-rag, langgraph, llm]
stack: [Python, LangGraph, LangChain, Claude API, Gradio, Hugging Face Spaces]
skills:
  - AI agents
  - Agentic RAG
  - Tool calling
  - Prompt engineering
  - LLM evaluation
  - Multimodal inputs (images, files)
deckSkills:
  - AI agents
  - Agentic RAG
  - Tool calling
links:
  code: https://huggingface.co/spaces/cloudykite/Final_Assignment_Template/tree/main
flow:
  caption: How the agent answers a GAIA question
  steps:
    - { title: Prepare, detail: 'Downloads the attachment; PNG images go to Claude directly' }
    - { title: Reason, detail: 'Claude plans the next step in a ReAct loop' }
    - { title: Search, detail: 'DuckDuckGo search, five results with snippets' }
    - { title: Read, detail: "Claude's web fetch reads the best one or two pages" }
    - { title: Compute, detail: 'Python in an isolated process, 60-second limit' }
    - { title: Answer, detail: 'Final line parsed and cleaned for exact match' }
highlights:
  - { title: 20 GAIA questions, detail: 'Level 1 validation subset, graded by exact match' }
  - { title: 3 tools, detail: 'Web search, web fetch and a Python runner' }
  - { title: LangGraph state graph, detail: 'Prepare, assistant, tools and finalize nodes' }
  - { title: Certificate of Excellence, detail: "Passed the course's 30% bar on GAIA" }
limitations:
  - Scored on the course's 20 GAIA questions in one run. With so few questions, one answer moves the score by 5 points.
  - The scoring service reports only the total, not which answers were right, so mistakes cannot be traced question by question from the official result.
  - Audio attachments are not transcribed, so the agent answers those questions from the text alone.
  - Python runs in a separate isolated process with a time limit and a stripped environment, but not in a full sandbox.
nextSteps:
  - Transcribe audio attachments (for example with Whisper) before the agent starts.
  - Score each question locally against the public GAIA validation answers and rerun several times to measure accuracy per question type.
  - Run the Python tool inside a container sandbox.
evidence:
  - "Code: huggingface.co/spaces/cloudykite/Final_Assignment_Template. agent.py is Leo's (8 commits, Nov 2026); app.py is the course template with small changes"
  - 'Hugging Face Agents Course Certificate of Excellence, 24 Nov 2026'
  - 'Course syllabus and Unit 4 pages (GAIA subset, exact-match scoring, 30% pass mark), read 24 Nov 2026'
---

## Problem

GAIA asks questions that are simple for people but hard for AI assistants. Each has one short answer, but finding it takes several steps: searching the web, reading pages and files, and calculating. The final project of the Hugging Face Agents Course scores an agent on 20 GAIA level 1 questions by exact match, and 30% is needed to pass.

## At a glance

- **Built an autonomous research agent** in LangGraph with Claude (Anthropic API). It searches the web, reads pages and PDFs, runs Python, and replies with one exact value.
- **ReAct loop as a state graph:** prepare, then assistant and tools in a loop, then finalize. Routing follows Claude's tool calls and its `pause_turn` signal for long server-side fetches, with a 35-step limit.
- **Agentic RAG over the live web:** the agent decides what to search, reads the result snippets first, and is told to fetch only the one or two most relevant pages, instead of retrieving a fixed set of documents up front.
- **Multimodal inputs:** each task's attachment is downloaded. PNG images go to Claude as base64, Python files are inlined, and spreadsheets are read with pandas through the Python tool.
- **Built for exact-match grading:** the system prompt fixes the answer format (no units, thousands separators or articles), and a parser keeps only the text after the last `FINAL ANSWER:` and strips markup.
- **Safer code execution:** Python runs in a separate isolated process (`python -I`) with a 60-second limit, a stripped environment and a folder holding the task's files.
- **Earned the course's Certificate of Excellence.**

## How it works

1. **Prepare.** The question and any attachment come from the course's scoring service. The first message holds the system prompt, the question and the attachment in a form Claude can read.
2. **Assistant.** Claude, with the tools bound, decides whether to call a tool or answer.
3. **Tools.** Local tools (web search and Python) run in a LangGraph `ToolNode`. Web fetch runs on Anthropic's side, capped at 5 uses and 20,000 tokens per page.
4. **Finalize.** When Claude stops calling tools, the last message is parsed into the answer that is submitted.

## What the course covered

- **Agent fundamentals:** how LLMs drive agents, tools, and the thought–action–observation cycle.
- **Frameworks:** smolagents, LlamaIndex and LangGraph.
- **Use case:** agentic RAG.
- **Final project:** this GAIA agent, scored on the course leaderboard.

## What this shows

- Building an LLM agent end to end: tools, state, routing, prompts and output parsing.
- Designing for a strict evaluation, so that correct answers are not lost to formatting.
- Working across three agent frameworks and choosing LangGraph for the capstone.
