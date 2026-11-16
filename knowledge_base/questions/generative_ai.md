---
doc_type: questions
role_family: generative_ai
---

# Generative AI and LLM engineering interview questions

## LLM fundamentals
Fresher: What is a large language model and how does it generate text?
Fresher: What are tokens and a context window, and why do they matter for cost and quality?
Mid: Explain temperature and top-p. When would you set temperature to zero?
Good answers cover: next-token prediction, transformers and attention at a high level, tokenisation, context limits, sampling parameters and determinism.

## Retrieval-augmented generation (RAG)
Fresher: What is RAG and what problem does it solve compared with fine-tuning?
Mid: Walk through a RAG pipeline end to end. Where do most quality problems come from?
Senior: How would you evaluate a RAG system? Which metrics would you track?
Good answers cover: chunking, embeddings, vector databases, retrieval and re-ranking, grounding the prompt, hallucination reduction, evaluation of retrieval (context precision/recall) and generation (faithfulness, answer relevancy) with tools like RAGAS.

## Agents and tool use
Mid: What makes an LLM application an "agent"? How do tool calling and loops work?
Senior: How do you keep an agent reliable: bounded loops, validation, human-in-the-loop?
Good answers cover: planning, tool calling, state, termination conditions, structured outputs, guardrails, frameworks such as LangGraph.

## Prompting and structured output
Fresher: What makes a good prompt?
Mid: How do you make an LLM return reliable JSON?
Good answers cover: clear instructions, examples, constraints, schema-constrained decoding, validation and retries.

## Hallucination and safety
Mid: How do you detect and reduce hallucinations in production?
Good answers cover: grounding and citations, verification passes, refusing when unsure, evaluation datasets, monitoring.
