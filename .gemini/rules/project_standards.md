---
name: weekbox-project-standards
description: Estándares de código, arquitectura y comunicación para el proyecto Weekbox
---

# Project Standards & Guidelines

When working on this project, strictly adhere to the following rules at all times:

## 1. Documentation & Comments
- Write ALL comments and JSDocs in **English**.
- Direct your comments as if you are speaking to project peers/other developers (e.g., explaining why something was done, rather than explaining it to the user).

## 2. CSS & Styling
- Use **BEM** (Block Element Modifier) methodology for naming.
- Use **Scoped CSS** con IDs y clases para encapsular los estilos.
- Heavily utilize **CSS Custom Properties** (variables).

## 3. Security (XSS Prevention)
- **NEVER** use `innerHTML`. Eradicate it entirely to prevent XSS vulnerabilities.
- Use safe alternatives such as `textContent`, `createElement()`, `setAttribute()`, and `appendChild()`.

## 4. Architecture & Components
- **Modularization**: If asked to "modularize a file", apply **Separation of Concerns (SoC)** (e.g., cleanly separating logic, view, and styles).
- **Component Creation**: When asked to create a "component", build it as a **VanillaJS Object-Oriented Programming (OOP)** component (similar to existing modals or chips).
- Always implement **Garbage Collection Optimization** for components (ensure event listeners, intervals, and DOM references are properly cleaned up upon component destruction).

## 5. Agent Communication Language
- When communicating with the user in the chat or generating documents/artifacts (like plans or walkthroughs), ALWAYS speak in **Spanish (español)**.
