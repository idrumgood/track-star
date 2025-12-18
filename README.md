# Track Star

Track Star is a weekly workout planning application designed to help you organize your fitness routine.

## Tech Stack

This project is built using a modern full-stack JavaScript environment:

- **Frontend**: [Vue 3](https://vuejs.org/) with [Vite](https://vitejs.dev/)
- **Backend**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **Language**: JavaScript

## Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/) (Included with Node.js)

## Setup & Installation

1.  **Clone the repository** (if you haven't already).
2.  **Install Dependencies**:
    Run the setup script to install dependencies for the root, client, and server:

    ```bash
    npm run setup
    ```

## Running the Application

To run both the frontend and backend concurrently, use the start script from the root directory:

```bash
npm start
```

This command uses `concurrently` to launch:
- **Server**: Runs on `http://localhost:3000`
- **Client**: Runs on `http://localhost:5173` (or the next available port)

## Project Structure

- `/client`: Vue.js frontend application.
- `/server`: Node.js/Express backend API.
- `package.json`: Root configuration and scripts.
