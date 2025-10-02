# FakeUser Manager

A Chrome extension and web app for managing fake user profiles with team collaboration and form autofill capabilities.

## Development

Run the web version for development:

```bash
npm install
npm run dev
```

Then open your browser to the URL shown (typically http://localhost:5173)

## Building the Chrome Extension

```bash
npm run build
```

The extension will be built to the `dist` folder.

## Loading the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder

## Features

- Create and manage fake user profiles
- Email, phone, address, and notes fields
- Reusable tag system with colors
- Team collaboration
- Form autofill (Chrome extension only)
- Search and filter users

## Tech Stack

- React
- Supabase (auth + database)
- Vite
- Chrome Extension Manifest V3
