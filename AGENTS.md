# AGENTS.md

## Working with AI Agents on this Project

### Development Philosophy

This project practices Test-Driven Development (TDD). All code changes should follow the red-green-refactor cycle:

1. **Red**: Write a failing test that defines desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests green

### Testing Standards

- Tests are written before implementation code
- All features require tests (unit, integration, or both as appropriate)
- Code changes without tests are incomplete
- Test coverage should include happy paths and error cases

### Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```
