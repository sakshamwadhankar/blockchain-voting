# Contributing to KWOTE

First off, thank you for considering contributing to KWOTE! It's people like you that make KWOTE such a great tool for transparent corporate governance.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Commit your changes** with clear commit messages
6. **Push to your fork** and submit a pull request

## Development Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- Git
- MetaMask browser extension

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/your-username/kwote.git
cd kwote

# Install dependencies
npm install
cd katana-react && npm install && cd ..
cd backend && npm install && cd ..

# Copy environment files
cp .env.example .env
cp katana-react/.env.example katana-react/.env
cp backend/.env.example backend/.env

# Start development
npx hardhat node                    # Terminal 1
npx hardhat run scripts/deploy-election.js --network localhost  # Terminal 2
cd backend && npm start             # Terminal 3
cd katana-react && npm run dev      # Terminal 4
```

## Coding Standards

### JavaScript/React

- Use ES6+ features
- Follow React best practices and hooks guidelines
- Use functional components over class components
- Keep components small and focused
- Use meaningful variable and function names
- Add comments for complex logic

### Solidity

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use OpenZeppelin libraries when possible
- Add NatSpec comments for all public functions
- Write comprehensive tests for all contract functions
- Optimize for gas efficiency

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add candidate photo upload feature
fix: resolve double voting bug
docs: update README installation steps
style: format code with prettier
refactor: simplify election creation logic
test: add tests for vote counting
chore: update dependencies
```

## Testing

### Smart Contracts

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/ElectionManager.test.js

# Run with coverage
npx hardhat coverage
```

### Frontend

```bash
cd katana-react
npm run test
```

## Project Structure

```
kwote/
├── contracts/          # Solidity smart contracts
├── scripts/           # Deployment scripts
├── test/              # Smart contract tests
├── katana-react/      # React frontend
├── backend/           # Express backend
└── docs/              # Documentation
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for JavaScript functions
- Add NatSpec comments for Solidity functions
- Update API documentation if you change endpoints

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to KWOTE! 🎉
