# FakeUser Manager - Chrome Extension

A Chrome extension for managing fake user profiles with team collaboration and form autofill capabilities.

## Installation

1. Build the extension:
   ```bash
   npm install
   npm run build
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Features

### User Management
- Create and manage fake user profiles with:
  - Name
  - Email
  - Phone number
  - Address
  - Notes

### Tag System
- Create reusable tags with custom colors
- Organize fake users by tags
- Filter users by tags

### Team Collaboration
- Create teams to share fake user profiles
- Invite team members
- Collaborative profile management

### Form Autofill
- Automatically detect form fields on any website
- One-click autofill with selected fake user profile
- Supports name, email, phone, and address fields

## Usage

1. Click the extension icon to open the popup
2. Sign up or sign in with your account
3. Create your first team
4. Add fake user profiles
5. Navigate to any website with a form
6. Click a user's autofill button to fill the form

## Tech Stack

- React for UI
- Supabase for authentication and database
- Chrome Extension Manifest V3
- Vite for bundling
