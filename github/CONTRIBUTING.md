# 🧠 Contributing Guide – ILO Analysis Project (RNSH App)

Welcome! This guide explains how to contribute code to this project. Please read it before opening pull requests or submitting changes.

---

## ✅ Git & GitHub Workflow

### 1. Create a Feature Branch

Use a new branch for each new feature or fix:

```bash
git checkout -b feature/<your-feature-name>
```

Examples:
- `feature/manual-analysis`
- `bugfix/export-crash`
- `refactor/logger-module`

### 2. Make Regular Commits

Commit often with clear, descriptive messages:

```bash
git add .
git commit -m "feat: add baseline manager"
```

### 3. Push Your Branch

Push your feature branch to GitHub:

```bash
git push origin feature/<your-feature-name>
```

### 4. Open a Pull Request (PR)

1. Go to GitHub
2. Click "Compare & pull request"
3. Fill out the description and assign a reviewer

### 5. Squash and Merge

- All merges must be done with "Squash and Merge"
- Do not push directly to `main` or `dev`
- This keeps the history clean: one commit per feature

---

## 🖥️ GitHub Desktop Users

1. Clone the repo and open it in GitHub Desktop
2. Use "Current Branch > New Branch" to create a new branch
3. Make changes in your editor (e.g., VS Code)
4. GitHub Desktop will show file changes — commit with a clear message
5. Click "Push origin"
6. Click "Create Pull Request" and complete the PR in your browser

---

## 📌 Branch Naming Rules

| Type     | Format               | Example                  |
|----------|---------------------|--------------------------|
| Feature  | `feature/<thing>`   | `feature/video-loader`   |
| Bug Fix  | `bugfix/<issue>`    | `bugfix/undo-crash`      |
| Refactor | `refactor/<thing>`  | `refactor/logger-cleanup`|

---

## 🧼 Best Practices

- Use clear commit messages (e.g., `feat: add measurement tool`)
- Keep each PR focused on one thing
- Use one branch per feature/task
- Always open a PR (no direct pushes to `main`)
- Review teammates' PRs respectfully and thoroughly

---

## 📦 Common Git Commands

```bash
# Create/switch to a new branch
git checkout -b feature/my-feature

# See what's changed
git status

# Stage and commit
git add .
git commit -m "feat: describe your change"

# Push your branch
git push origin feature/my-feature
```
