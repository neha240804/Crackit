---
doc_type: questions
role_family: backend
---

# Backend development interview questions

## REST API design
Easy: What makes an API RESTful? Explain HTTP methods and status codes you use most.
Intermediate: How would you design pagination, filtering and versioning for a public API?
Hard: How do you design idempotent endpoints for payments or retries?
Good answers cover: resources and verbs, correct status codes (201, 400, 401, 403, 404, 409, 422), idempotency keys, cursor vs offset pagination, backward-compatible changes.

## Databases and SQL
Easy: What is an index and when can it slow things down?
Intermediate: Explain normalisation and when you might denormalise.
Hard: Explain ACID and transaction isolation levels with a real problem each prevents.
Good answers cover: B-tree indexes, write overhead, query plans (EXPLAIN), joins, isolation anomalies (dirty read, non-repeatable read, phantom), SQL vs NoSQL trade-offs.

## Authentication and security
Easy: What is the difference between authentication and authorization?
Intermediate: How do JWTs work and what are their risks compared with server sessions?
Good answers cover: password hashing (bcrypt/argon2), token expiry and revocation, OAuth 2.0 basics, role-based access control, common vulnerabilities (SQL injection, XSS, CSRF).

## Caching and performance
Intermediate: Where would you add caching in a read-heavy API and how would you keep it correct?
Good answers cover: Redis, cache-aside, TTLs, invalidation strategies, cache stampede, measuring before optimising.

## System design fundamentals
Hard: Design a URL shortener. What are the main components and bottlenecks?
Hard: How would you scale a service from one server to millions of users?
Good answers cover: requirements and estimates first, load balancers, stateless services, database replication and sharding, queues for async work, observability.

## Concurrency and async
Intermediate: Explain async/await in Python. When does it help and when does it not?
Good answers cover: event loop, I/O-bound vs CPU-bound work, blocking calls, thread pools, race conditions.
