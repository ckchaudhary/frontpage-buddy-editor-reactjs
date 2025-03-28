# FrontPage Buddy Editor

A modern React-based editor interface for the FrontPage Buddy WordPress plugin. Built with TypeScript and Vite for optimal development experience and performance.

> This repository is a submodule of [FrontPage Buddy WordPress Plugin](https://github.com/ckchaudhary/frontpage-buddy)

## Technical Stack

- **React 18** with TypeScript for type-safe component development
- **Vite** for lightning-fast builds and hot module replacement
- **DND Kit** for smooth drag-and-drop interactions
- **REST API Integration** for seamless WordPress backend communication
- **Modern State Management** using React Context and Hooks

## Architecture Highlights

- **TypeScript-First Approach**: Leveraging TypeScript's type system for robust component interfaces and error prevention
- **Component Modularity**: Well-structured component hierarchy with clear separation of concerns
- **REST API Integration**: Clean API integration layer with WordPress REST API
- **Performance Optimized**: 
  - Efficient state updates using `useCallback` and `useMemo`
  - Lazy loading for better initial load times
  - Optimized re-renders with React.memo

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build