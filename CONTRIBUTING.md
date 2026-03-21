# Contributing to Dalek-Grog

## How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR-USERNAME/Dalek-Grog.git
cd Dalek-Grog
npm install
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow existing code style
- Add tests if applicable
- Update documentation

### 4. Test

```bash
npm run lint
npm run dev
```

### 5. Submit PR

- Push to your fork
- Open a Pull Request
- Describe your changes

---

## Code Style

- TypeScript strict mode
- Async/await over promises
- JSDoc comments for public methods
- No `any` types - use `unknown`

---

## Evolution Rules

When contributing evolved code:

1. **Preserve functionality** - Evolution should improve, not break
2. **Add summary** - Explain what changed and why
3. **Respect saturation** - Follow constraint guidelines
4. **Learn from failures** - Update `grog/lessons/`

---

## Areas for Contribution

| Area | Description |
|------|-------------|
| DNA Patterns | Add new architectural patterns |
| Siphons | Improve DNA extraction |
| UI | Enhance the dashboard |
| Docs | Improve documentation |
| Tests | Add test coverage |

---

## Questions?

Open an issue or check `evolution_outputs/` for examples of evolved code.
