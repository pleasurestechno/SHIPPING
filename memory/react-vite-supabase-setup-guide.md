# React + Vite + Supabase + Tailwind — Setup Guide

**Created:** 2026-03-14
**Context:** Lessons learned building the Shipping Dashboard app.

---

## Quick Start Checklist

When building a new React app with Vite + Supabase + Tailwind, follow this order:

1. Scaffold the project
2. Install ALL dependencies (including React itself)
3. Install & configure the Vite React plugin
4. Configure Tailwind
5. Set up entry points correctly
6. Integrate Supabase

---

## 1. Scaffold the Project

```bash
npm create vite@latest <project-name> --template react
cd <project-name>
npm install
```

**⚠️ Gotcha (Windows/PowerShell):** Don't use `&&` to chain commands — use `;` instead.

---

## 2. Verify React Dependencies

The Vite scaffold may not always install React correctly. **Always verify:**

```bash
npm install react react-dom
```

Check `package.json` — both `react` and `react-dom` must appear in `dependencies`.

---

## 3. Install & Configure the Vite React Plugin

Without this, Vite cannot process JSX. This was the biggest blocker.

```bash
npm install -D @vitejs/plugin-react
```

Create/update `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

---

## 4. Configure Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
```

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
```

Create/update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 5. Set Up Entry Points Correctly

### `index.html` — must point to `.jsx` not `.ts`:

```html
<script type="module" src="/src/main.jsx"></script>
```

### `src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/App.jsx`:

```jsx
import './index.css';
import YourComponent from './components/YourComponent';

function App() {
  return (
    <div className="App">
      <YourComponent />
    </div>
  );
}

export default App;
```

**⚠️ Gotcha:** If `App.jsx` imports `App.css`, make sure `App.css` actually exists or remove the import.

---

## 6. Supabase Integration

```bash
npm install @supabase/supabase-js
```

Create `src/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-publishable-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Key distinctions:**
- **Publishable/Anon Key** — used in client-side code (browser-safe, read access via RLS)
- **Service Role Key** — used server-side only (bypasses RLS, never expose in frontend)
- **Database Password** — for direct PostgreSQL connections only, not the same as the service role key

### Creating Tables

Supabase REST API (PostgREST) **cannot create tables**. You must:
- Use the **Supabase Dashboard SQL Editor**, OR
- Use a direct PostgreSQL connection (`psql`)

### RLS Policies

After creating a table, enable RLS and add policies:

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON your_table FOR SELECT USING (true);
CREATE POLICY "Allow service write" ON your_table FOR ALL USING (auth.role() = 'authenticated');
```

---

## 7. Data Import (Excel → Supabase)

To convert Excel to CSV using Node.js:

```bash
npm install xlsx
```

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('input.xlsx');
const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
require('fs').writeFileSync('output.csv', csv);
```

Then use a Node.js script with `@supabase/supabase-js` to insert rows.

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| `Failed to resolve import "react"` | `react` not in `package.json` | `npm install react react-dom` |
| `Failed to resolve import "react/jsx-dev-runtime"` | Missing Vite React plugin | `npm install -D @vitejs/plugin-react` + update `vite.config.js` |
| `Failed to resolve import "./App.css"` | File doesn't exist | Create it or remove the import |
| Default Vite page shows instead of app | `index.html` pointing to wrong entry | Change `src/main.ts` → `src/main.jsx` |
| `&&` chaining fails in PowerShell | PowerShell syntax | Use `;` instead |
| `curl -H` fails in PowerShell | PowerShell `curl` is an alias for `Invoke-WebRequest` | Use `Invoke-RestMethod` with `-Headers @{}` hashtable |
| `Invalid API key` from Supabase | Using DB password instead of service role key | Get actual service role key from Supabase dashboard → Settings → API |

---

## File Structure (Reference)

```
project-name/
├── index.html              ← points to src/main.jsx
├── vite.config.js          ← includes @vitejs/plugin-react
├── tailwind.config.js      ← content paths set
├── package.json            ← react, react-dom in dependencies
├── src/
│   ├── main.jsx            ← React entry point
│   ├── App.jsx             ← Root component
│   ├── App.css             ← App styles (can be empty)
│   ├── index.css           ← Tailwind directives
│   ├── supabaseClient.js   ← Supabase client init
│   └── components/
│       └── YourComponent.jsx
└── node_modules/
```
