# Template Setup Guide for AI Agents

This is a template project that needs to be customized for a new project. Before proceeding, ensure you have the following information from the user:

**Required Context:**
- **Project name**: The name of the new project (kebab-case for files/folders, PascalCase for display)
- **Project description**: A one-liner explaining what the project does
- **Repo URL**: Or something like someaccount/somerepo
- **Emoji**: For favicon and readme heading

If this information is not in context, **ask the user for it before proceeding**.

---

## Setup Checklist

Complete these tasks to transform the template into the new project:

1. **Replace template name with project name**
   - Search for "helloworld" (case-insensitive) across the codebase
   - Replace with the actual project name in appropriate casing
   - Update workspace file names (e.g., `helloworld.code-workspace` → `[project-name].code-workspace`)

2. **Update zap.yaml**
   - Change the project name in the zap configuration
   - Verify process names match the new project

3. **Configure port numbers**
   - Assign unique port numbers for all /apps
   - Use etc/bin/randomport to get port numbers
   - Update all references in config files

4. **Rewrite README.md**
   - Rewrite it to just contain the project description
   - The heading would be the project name and emoji

5. **Update AGENTS.md**
Just replace any helloworld project description with the real description.

6. **Assign random ports**
For each app, assign a random port so that it doesn't clash with other projects. Make sure to find and replace across the whole repo.

6. **Update render.yaml**
   - Set project name
   - Set all the repo URLs to the new repo

7. **Update branding**
   - Update page title in `apps/frontend/index.html`
   - Create a base64 encoded favicon as well, see `etc/bin/emoji-favicon`

8. **Clean up**
   - Delete this PROJECT_SETUP_GUIDE.md file
   - Remove any other template artifacts
   - Verify the project is ready for development

**After completing this checklist, the project should be fully customized and ready for development.**
