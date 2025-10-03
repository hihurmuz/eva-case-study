# EVA Case Study - Sales Dashboard

A modern sales analytics dashboard built with Vue 3, TypeScript, Vuex, and D3.js for data visualization.

## 🚀 Live Demo

**[View Live Application](https://eva-case-study-taupe.vercel.app/)**

## 📋 Features

- **User Authentication**: Secure login system with token-based authentication
- **Sales Analytics Dashboard**:
  - Interactive daily sales charts with D3.js
  - Multiple period selection (7, 14, 30, 60 days)
  - Metric filtering (FBA, FBM, Profit)
  - Date range comparison
- **SKU Management**: Product SKU table with detailed sales information
- **Responsive Design**: Fully responsive UI with Tailwind CSS
- **State Management**: Centralized state management with Vuex
- **Type Safety**: Full TypeScript support

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **State Management**: Vuex 4
- **Data Visualization**: D3.js v7
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest (Unit) + Cypress (E2E)
- **Code Quality**: ESLint + Prettier

## 📦 Project Setup

### Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm `11.5.2` or later

### Installation

```sh
npm install
```

### Development

Run the development server with hot-reload:

```sh
npm run dev
```

### Production Build

Type-check, compile and minify for production:

```sh
npm run build
```

Preview production build locally:

```sh
npm run preview
```

## 🧪 Testing

### Unit Tests with Vitest

```sh
npm run test:unit
```

### End-to-End Tests with Cypress

Development mode (interactive):

```sh
npm run test:e2e:dev
```

Production mode:

```sh
npm run build
npm run test:e2e
```

## 🔧 Code Quality

### Lint with ESLint

```sh
npm run lint
```

### Format with Prettier

```sh
npm run format
```

## 🏗️ Project Structure

```
eva-case-study/
├── src/
│   ├── components/      # Vue components
│   ├── views/          # Page views
│   ├── store/          # Vuex store
│   ├── router/         # Vue Router config
│   ├── data/           # Mock data
│   └── assets/         # Static assets
├── dist/               # Production build
└── cypress/            # E2E tests
```

## 🎨 IDE Setup

**Recommended:**
- [VS Code](https://code.visualstudio.com/)
- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension
- Disable Vetur if installed

**Browser DevTools:**
- Chromium: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## 📝 License

This project is private and confidential.

## 🔗 Links

- **Live Demo**: https://eva-case-study-taupe.vercel.app/
- **Vite Docs**: https://vite.dev/config/
- **Vue 3 Docs**: https://vuejs.org/
