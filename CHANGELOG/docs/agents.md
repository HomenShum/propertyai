# Agent-instruction documentation history

## 2026-10-15 — Make the evaluation reference portable

Replace the machine-specific golden-dataset link with the repository-relative path so another developer or coding agent can locate the existing reference file. Every other byte of AGENTS.md is preserved, including its workflow, evaluation and Convex safeguards; the dataset body was not opened or changed.

**Scope:** [AGENTS.md](../../AGENTS.md). This entry records only this link repair; Git history records the commit.
**Related:** [README handoff](readme.md).
**Verification:** The target path exists in the complete reviewed Git tree. This is a path check, not a judgment of the dataset or a test run.
