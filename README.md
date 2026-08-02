# Algorify: A Brain That Actually Cares

Studying is a notoriously lonely and frustrating experience. The traditional education system relies heavily on rote memorization, and modern AI tools (like generic ChatGPT) often make the problem worse by spoon-feeding you the answers without ensuring you actually learn anything.

We built **Algorify** to fix this. 

Algorify isn't just a chatbot. It is a highly empathetic, gamified **AI Learning Ecosystem**. It maps your neural strengths, destroys AI hallucinations by forcing the model to read *only* your textbooks, and acts as a Socratic tutor that refuses to give up on you.

---

## 🧠 The 8 Pillars of Algorify

1. **A Brain That Cares (Memory Engine):** A centralized graph database that silently logs every interaction. It learns your weaknesses over time and celebrates your hard-earned mastery.
2. **The Tutor Who Won't Give Up:** A Socratic AI that explicitly refuses to give you the direct answer. Instead, it guides you through the logic until you reach the 'aha!' moment yourself.
3. **Frustration Into Fun (Play Arena):** We turned test anxiety into a game. Algorify algorithmically generates 'Boss Fights' based on the specific topics you are failing at.
4. **A Safe Space to Learn (Python RAG Pipeline):** Zero hallucinations. Upload your university PDFs, and the AI's brain is strictly constrained to your syllabus via semantic vector search.
5. **Never Start Blank (AI Co-Writer):** A markdown editor that auto-completes your thoughts and instantly pulls citations directly from your uploaded documents.
6. **Handling The Overwhelm (Study Planner):** A priority-based task manager that organizes the chaos and rewards you with Experience Points (XP) for getting things done.
7. **Take A Deep Breath (Zen Mode):** Mental health matters. Enter Zen mode for built-in Pomodoro timers, Lo-Fi rain soundscapes, and rhythmic breathing visualizers.
8. **You Are Not Alone (Leaderboard):** Climb the global ranks against other students by building your day streaks and earning XP. 

---

## 🏗️ Architecture

Algorify is structured as a modern monorepo:

- **`/frontend`**: The user interface. Built with Next.js 16 (App Router), React, Tailwind CSS, Framer Motion, and Zustand/Context for state management.
- **`/python-engine`**: The RAG (Retrieval-Augmented Generation) backend. Built with Python, FastAPI, PyPDF, and the Mistral API. This handles the heavy lifting of semantic search and document extraction.
- **Database**: Powered by Supabase (PostgreSQL + Auth).

---

## 🚀 Running Locally

### 1. The Backend (Python)
Navigate to the Python engine and install the dependencies:
```bash
cd python-engine
pip install -r requirements.txt
python main.py
```
*(Runs on port 8001)*

### 2. The Frontend (Next.js)
Navigate to the frontend folder and install the dependencies:
```bash
cd frontend
npm install
npm run dev
```
*(Runs on port 3000)*

> **Note:** You will need to create a `.env.local` in the `/frontend` directory containing your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `MISTRAL_API_KEY`.

---

*Built for the future of education. Stop memorizing. Start understanding.*
