---
doc_type: questions
role_family: generative_ai
---

# Generative AI and LLM engineering interview questions

## LLM fundamentals
Easy: What is a large language model and how does it generate text?
Easy: What are tokens and a context window, and why do they matter for cost and quality?
Intermediate: Explain temperature and top-p. When would you set temperature to zero?
Good answers cover: next-token prediction, transformers and attention at a high level, tokenisation, context limits, sampling parameters and determinism.

## Retrieval-augmented generation (RAG)
Easy: What is RAG and what problem does it solve compared with fine-tuning?
Intermediate: Walk through a RAG pipeline end to end. Where do most quality problems come from?
Hard: How would you evaluate a RAG system? Which metrics would you track?
Good answers cover: chunking, embeddings, vector databases, retrieval and re-ranking, grounding the prompt, hallucination reduction, evaluation of retrieval (context precision/recall) and generation (faithfulness, answer relevancy) with tools like RAGAS.

## Agents and tool use
Intermediate: What makes an LLM application an "agent"? How do tool calling and loops work?
Hard: How do you keep an agent reliable: bounded loops, validation, human-in-the-loop?
Good answers cover: planning, tool calling, state, termination conditions, structured outputs, guardrails, frameworks such as LangGraph.

## Prompting and structured output
Easy: What makes a good prompt?
Intermediate: How do you make an LLM return reliable JSON?
Good answers cover: clear instructions, examples, constraints, schema-constrained decoding, validation and retries.

## Hallucination and safety
Hard: How do you detect and reduce hallucinations in production?
Good answers cover: grounding and citations, verification passes, refusing when unsure, evaluation datasets, monitoring.
