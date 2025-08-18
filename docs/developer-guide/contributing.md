# Contributing Guidelines

We welcome contributions! This guide will help you get started with contributing to the Nuxt Users module.

## How to Contribute

### 1. Report Issues

- **Bug Reports**: Include steps to reproduce, expected vs actual behavior, and environment details
- **Feature Requests**: Describe the use case and how it would benefit users
- **Documentation Issues**: Let us know if anything is unclear or missing

### 2. Submit Code Changes

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Test your changes**: `yarn test`
5. **Submit a pull request**

### 3. Code Review Process

- All changes require review before merging
- Tests must pass for both SQLite and MySQL
- Code must follow the project's style guidelines
- Documentation should be updated if needed

## What We're Looking For

### Bug Fixes

- **Critical bugs**: Issues that break functionality
- **Security issues**: Vulnerabilities or security concerns
- **Performance issues**: Slow queries or memory leaks
- **Compatibility issues**: Problems with different environments

### New Features

- **Authentication methods**: Additional login options
- **Database support**: New database connectors (PostgreSQL, MongoDB, etc.)
- **UI components**: Additional Vue components
- **API endpoints**: New functionality
- **CLI commands**: Database management tools

### Improvements

- **Documentation**: Better examples and explanations
- **Tests**: More test coverage and edge cases
- **Code quality**: Better error handling and cleaner code
- **Performance**: Faster database queries and operations

## Development Workflow

### 1. Setup Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd nuxt-users

# Install dependencies
yarn install

# Build the module
yarn dev:prepare
```

### 2. Make Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation if needed
- Keep commits small and focused

### 3. Test Your Changes

```bash
# Run all tests
yarn test

# Check types
yarn test:types

# Lint code
yarn lint
```

### 4. Submit Pull Request

- Include a clear description of your changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use arrow functions consistently

### Vue Components

- Use Composition API with `<script setup>`
- Follow Vue 3 best practices
- Use proper TypeScript types
- Keep components focused and reusable

### Database Code

- Use parameterized queries to prevent SQL injection
- Handle database errors gracefully
- Use transactions when appropriate
- Follow the existing database patterns

### Error Handling

- Use descriptive error messages
- Log errors appropriately
- Return consistent error responses
- Handle edge cases

## Testing Guidelines

### Write Tests For

- **New features**: All new functionality should have tests
- **Bug fixes**: Include tests that prevent regression
- **API endpoints**: Test all request/response scenarios
- **Database operations**: Test CRUD operations
- **Edge cases**: Test error conditions and boundaries

### Test Structure

```ts
describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup
  })

  afterEach(async () => {
    // Cleanup
  })

  it('should do something', async () => {
    // Test implementation
  })

  it('should handle errors gracefully', async () => {
    // Error test
  })
})
```

### Database Tests

- Test against SQLite, MySQL, and PostgreSQL
- Use isolated test databases
- Clean up after each test
- Test both success and failure scenarios

## Documentation Guidelines

### Code Comments

- Comment complex logic
- Explain business rules
- Document API parameters
- Use JSDoc for functions

### README Updates

- Update installation instructions if needed
- Add examples for new features
- Update configuration options
- Keep it concise and clear

### API Documentation

- Document all endpoints
- Include request/response examples
- Explain error codes
- Provide usage examples

## Commit Guidelines

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build or tool changes

### Examples

```
feat(auth): add OAuth2 support

fix(database): resolve MySQL connection timeout

docs(api): update login endpoint documentation
```

## Review Process

### Pull Request Checklist

- [ ] Tests pass for SQLite, MySQL, and PostgreSQL
- [ ] TypeScript types are correct
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No breaking changes (or documented)

### Review Criteria

- **Functionality**: Does it work as expected?
- **Security**: Are there any security concerns?
- **Performance**: Is it efficient?
- **Maintainability**: Is the code clean and readable?
- **Testing**: Are there adequate tests?
- **Documentation**: Is it well documented?

## Getting Help

### Questions and Discussions

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Pull Requests**: For code reviews and feedback

### Resources

- [Development Setup](/developer-guide/development-setup) - Set up your environment
- [Testing](/developer-guide/testing) - Learn about testing
- [Code Style](/developer-guide/code-style) - Follow coding standards

## Recognition

Contributors will be recognized in:

- **README**: List of contributors
- **Release notes**: Credit for significant contributions
- **Documentation**: Attribution for major features

We appreciate all contributions, big and small! 🚀