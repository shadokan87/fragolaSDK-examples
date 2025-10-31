# Prompt

The best way to work with and manage prompts in your code-base. Universal and library-agnostic, Prompt is compatible your favorite SDK such as Vercel's AI SDK, Openai SDK, langchain, Openai api and more

## ✨ Features

- 📝 **String Templates** - Create prompts from strings with simple variable syntax
- 🔄 **Variable Interpolation** - Dynamic content using `{{variable}}` syntax
- 📁 **File-based Prompts** - Load prompts from files for better organization
- 🗂️ **Path Aliasing** - Create shortcuts to frequently used prompt directories
- 🛡️ **Type Safety** - Built with TypeScript for type-safe variable handling
- 🔍 **Code Block Awareness** - Preserves code blocks in markdown
- ❌ **Error Handling** - Clear errors when variables are missing
- 🔌 **Universal** - Works with any LLM SDK or API

## Installation

```bash
npm install prompt
```

## Usage

### Using with Strings

```typescript
import Prompt from 'prompt';

// Basic AI instruction template
const assistantTemplate = `You are a {{role}} assistant. Your task is to {{task}}.`;
const assistantPrompt = new Prompt(assistantTemplate, {
    role: 'technical',
    task: 'explain complex programming concepts in simple terms'
});
console.log(assistantPrompt.value);
// Output: You are a technical assistant. Your task is to explain complex programming concepts in simple terms.

// Complex prompt with context and examples
const codeReviewTemplate = `As a code reviewer, analyze the following {{language}} code:
{{codeSnippet}}

Consider these aspects:
- Code style and best practices
- Potential bugs or issues
- Performance implications
- Security concerns

Programming language: {{language}}
Experience level: {{experienceLevel}}`

const codeReviewPrompt = new Prompt(codeReviewTemplate, {
    language: 'TypeScript',
    codeSnippet: 'function add(a: number, b: number) { return a + b }',
    experienceLevel: 'intermediate'
});
console.log(codeReviewPrompt.value);
// Output:
// As a code reviewer, analyze the following TypeScript code:
// function add(a: number, b: number) { return a + b }
//
// Consider these aspects:
// - Code style and best practices
// - Potential bugs or issues
// - Performance implications
// - Security concerns
//
// Programming language: TypeScript
// Experience level: intermediate
```

### Using with Files

```typescript
import Prompt, { load } from 'prompt';

// Content of prompts/shopBrowser.md:
/*
You are an AI shopping assistant helping customers browse products.

Customer Information:
- Name: {{customerName}}
- Previous purchases: {{previousPurchases}}
- Preferred categories: {{preferences}}

Available products in {{category}}:
{{productList}}

Task: Help the customer find products based on their preferences and purchase history.
Consider factors like:
1. Price range
2. Style preferences
3. Previous buying patterns
4. Current seasonal trends

Remember to maintain a helpful and professional tone.
*/

// Load prompt from a file
const shoppingPrompt = new Prompt(load('./prompts/shopBrowser.md'), {
    customerName: 'Sarah',
    previousPurchases: ['Denim Jacket', 'Summer Dress'],
    preferences: ['Casual Wear', 'Sustainable Fashion'],
    category: 'Summer Collection',
    productList: [
        'Organic Cotton T-shirt',
        'Linen Shorts',
        'Bamboo Sundress'
    ]
});
console.log(shoppingPrompt.value);
// Output: (the content of shopBrowser.md with interpolated variables)
```

### Using with Path Aliases
Aliases allows you to use prompt files from various location in your code-base with less overhead
```typescript
import Prompt, { load } from 'prompt';

// Define path aliases for frequently used directories
Prompt.pathAlias = {
    chat: 'prompts/chat',           // Maps to chat-related prompts
    support: 'prompts/customer',    // Maps to customer support prompts
    system: 'prompts/system'        // Maps to system-level prompts
};

// You can use aliases in different ways:

// 1. Direct file access using an alias
const welcomePrompt = new Prompt(load('@chat/welcome.md'), {
    username: 'Alice'
});

// 2. Nested directory structure with an alias
const ticketPrompt = new Prompt(load('@support/tickets/create.md'), {
    priority: 'high'
});
```
### Clone a prompt
You can clone an existing prompt's template and variables in two ways:

```typescript
import Prompt from 'prompt';

// Basic AI instruction template
const assistantTemplate = `You are a {{role}} assistant. Your task is to {{task}}.`;
const assistantPrompt = new Prompt(assistantTemplate, {
    role: 'technical',
    task: 'explain complex programming concepts in simple terms'
});

// Complete clone - copies both template and variables
const completeClone = new Prompt(assistantPrompt.promptString, assistantPrompt.variables);
console.log(completeClone.value);
// Output: You are a technical assistant. Your task is to explain complex programming concepts in simple terms.

// Partial clone - reuses template with new variables
const partialClone = new Prompt(assistantPrompt.promptString, {
    role: "bug-finder",
    task: "find any logic flaws or bug in this code"
});
console.log(partialClone.value);
// Output: You are a bug-finder assistant. Your task is to find any logic flaws or bug in this code.
```

## API Reference

### Static Properties

| Name | Type | Description |
|------|------|-------------|
| `pathAlias` | `Record<string, string>` | A map of aliases to file paths for shortcut access to prompt directories |

### Instance Properties

| Name | Type | Description |
|------|------|-------------|
| `promptString` | `string` | Gets the original unprocessed prompt template |
| `variables` | `Variables` | Gets the current variables map |
| `value` | `string` | Gets the interpolated prompt with all variables replaced |

### Outside of class functions

| Name | Params | Return Type | Description |
|------|--------|-------------|-------------|
| `load()` | `relativePath: string` | `Load` | Creates a Load object for file-based prompts. Path can include aliases starting with '@'. Can throw `NamespaceUndefinedError` when using an undefined alias |

### Instance Methods

| Name | Params | Return Type | Description |
|------|--------|-------------|-------------|
| `constructor()` | `prompt: string \| Load`<br>`variables?: Variables` | `Prompt` | Creates a new Prompt instance from string or file. Throws `LoadFileReadError` when file reading fails |
| `setVariables()` | `variables: Variables` | `void` | Updates the variables used for interpolation. Throws `MissingVariablesError` if required variables are missing |

### Types

| Name | Type | Description |
|------|------|-------------|
| `Variables` | `Record<string, any>` | Type for variable key-value pairs used in templates |
| `Load` | `{ load: true, relativePath: string }` | Configuration object for file-based prompts |

## Documentation

For detailed documentation and examples, visit our [GitHub repository](https://github.com/shadokan87/prompt).

## License

MIT