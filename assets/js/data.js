/* aawhan0.me — content data
   1) RESUME_CHUNKS: grounds the "ask my resume" demo (literal text from the PDF)
   2) SIGNALS: LinkedIn posts feed — add a new post by appending { id, title, blurb, tags }
      id = the number in the post URL (linkedin.com/posts/aawhanvyas_...-activity-<ID>-...)
      newest two with embed:true render as live LinkedIn embeds.
*/

const RESUME_CHUNKS = [
  {
    section: "Summary",
    title: "Summary",
    text: "Computer Science graduate with hands-on experience building backend systems, AI applications, and data-intensive software. Strong foundation in Python, SQL, databases, operating systems, and system design, with experience shipping tested, deployed projects and contributing to open-source software.",
  },
  {
    section: "Skills",
    title: "Languages",
    text: "Languages: Python, SQL, JavaScript.",
  },
  {
    section: "Skills",
    title: "Backend",
    text: "Backend: FastAPI, Flask, REST APIs, Pydantic, PostgreSQL, Redis, SQLite.",
  },
  {
    section: "Skills",
    title: "Data & AI",
    text: "Data & AI: Pandas, NumPy, Machine Learning.",
  },
  {
    section: "Skills",
    title: "Engineering",
    text: "Engineering: Docker, Git, GitHub Actions, CI/CD, Automated Testing.",
  },
  {
    section: "Education",
    title: "Vellore Institute of Technology, Bhopal",
    text: "B.Tech, Computer Science and Engineering, CGPA: 7.66/10, Aug 2022 – Aug 2026. Relevant coursework: Data Structures & Algorithms, OOP, Operating Systems, DBMS.",
  },
  {
    section: "Training",
    title: "Beeskilled — Machine Learning & AI Training",
    text: "Beeskilled — Machine Learning & AI Training (Sep 2026 – Oct 2026).",
  },
  {
    section: "Experience",
    title: "Genwe Films — Web Developer",
    text: "Designed and shipped the company's first official website using React, TypeScript, Supabase, EmailJS and Vercel, taking it from no web presence to a live production site (genwefilms.com). Owned development, deployment, stakeholder communication and final handover, incorporating 10+ rounds of client feedback into the signed-off release. Mar 2026 – May 2026.",
  },
  {
    section: "Projects",
    title: "Dasaiko — AI Research Workspace",
    text: "Built and deployed a full-stack AI research workspace for grounded PDF question answering using React, FastAPI and PostgreSQL with pgvector, delivering citation-backed responses with page-level source tracking. Engineered hybrid retrieval using vector search, BM25, RRF and BGE reranking; improved Recall@5 by 86%, MRR by 75% and nDCG@10 by 84% over the RRF baseline. Stack: React, FastAPI, PostgreSQL, pgvector, RAG, Groq. Jun 2026 – Present.",
  },
  {
    section: "Projects",
    title: "ModelDock — Self-Hostable ML Model-Serving Platform",
    text: "Built and open-sourced a self-hostable model-serving platform covering model versioning, artifact management, deployment, inference, monitoring and observability. Implemented pluggable runtimes, authenticated inference, rate limiting and data-drift monitoring, with a 4-stage deployment lifecycle and 72-test backend suite using GitHub Actions CI/CD and Docker smoke tests. Stack: FastAPI, PostgreSQL, Redis, Next.js, Docker. Jul 2026 – Present.",
  },
  {
    section: "Projects",
    title: "TraceBack — LLM Incident Diagnosis and Evaluation System",
    text: "Built a local-first LLM incident diagnosis system using Python, FastAPI and MCP to investigate production-like failures and produce evidence-backed diagnoses against deterministic ground truth. Benchmarked 30 runs per configuration across three scenarios; baseline achieved 100% pass rate and root-cause accuracy, while Qwen 2.5 3B scored 10% on both at 90% average confidence. Stack: Python, FastAPI, MCP, Ollama, Pydantic, Next.js, SQLite, Docker. Aug 2026 – Present.",
  },
  {
    section: "Open Source",
    title: "Provena — PR #153",
    text: "Provena (PR #153): Fixed policy evaluation error logging and strengthened regression coverage; verified 498 passed, 33 skipped.",
  },
  {
    section: "Open Source",
    title: "HelloblueGK — PR #170",
    text: "HelloblueGK (PR #170): Added XML response documentation for HealthController endpoints and verified .NET build and Swagger/OpenAPI.",
  },
  {
    section: "Certifications",
    title: "Certifications and Achievements",
    text: "NPTEL Elite: Cloud Computing (2024). Google: The Bits and Bytes of Computer Networking (2025). Generative AI using IBM watsonx: IBM Career Education Program (2025).",
  },
];

const SIGNALS = [
  {
    id: "7508924894366212098",
    title: "Jev by TypeSafe AI — a decision layer worth experimenting with",
    blurb: "ran a 50-query benchmark on JevRev model routing — what worked, what didn't, and why decision-heavy AI systems need verification layers.",
    tags: ["llm", "routing", "buildinpublic"],
    embed: true,
  },
  {
    id: "7502072292131155968",
    title: "ModelDock — building in public",
    blurb: "shipping the self-hostable model registry: versioned artifacts, gated promotions and inference APIs.",
    tags: ["modeldock", "mlops"],
    embed: true,
  },
  {
    id: "7497925884591374336",
    title: "I've been using Git for years — but this surprised me",
    blurb: "what commit IDs and hashes actually are, and why rebase history lies to you.",
    tags: ["git", "fundamentals"],
  },
  {
    id: "7496624757006663680",
    title: "Building a research-paper based AI learning platform",
    blurb: "why I think the best way to learn AI is to read the papers — and what I'm building around that.",
    tags: ["ai", "machinelearning", "rag"],
  },
  {
    id: "7484135878160916480",
    title: "I finally sat down and read my first AI research paper",
    blurb: "RAG for NLP tasks, explained the way I wish someone had explained it to me.",
    tags: ["research", "rag"],
  },
  {
    id: "7448974969742733312",
    title: "Watched a video on Gemma 4 — this chart says a lot",
    blurb: "smaller models are quietly catching the big ones. the implications for inference cost are wild.",
    tags: ["gemma", "small-models"],
  },
  {
    id: "7445710773634605056",
    title: "The Claude Code leak conversation",
    blurb: "thoughts on the leak, software engineering norms, and what build-in-public really means.",
    tags: ["ai", "softwaredevelopment", "buildinpublic"],
  },
  {
    id: "7441691028153061376",
    title: "Everyone's talking about OpenClaw",
    blurb: "end-to-end automation agents — hype vs. what they can actually do today.",
    tags: ["agents", "automation"],
  },
];

const LINKEDIN_URL = "https://www.linkedin.com/in/aawhanvyas/";
const EMAIL = "vyasaawhan@gmail.com";
