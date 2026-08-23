# PicPocket

PicPocket is a privacy-focused photo storage application that runs entirely in your browser. All photos are stored locally using IndexedDB, ensuring your memories stay private and secure.

## Features

- 🔒 **100% Private**: Photos never leave your device
- 📱 **Fully Responsive**: Works on mobile, tablet, and desktop
- ☁️ **Offline Support**: Access your photos even without internet
- 🎨 **Dark Mode**: Easy on the eyes in low-light environments
- 🏇 **Horse Lovers**: Special features for horse enthusiasts
- 🏷️ **Tagging System**: Organize photos with custom tags
- 🔍 **Search & Filter**: Quickly find specific photos

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/solmasta/PicPocket.git

# Install dependencies
cd PicPocket
npm run install:all

# Start the development server
npm run start:frontend
```

The app will be available at http://localhost:3000

## Testing

### Unit Tests

Run frontend unit tests:
```bash
npm run test:frontend
```

Run backend unit tests:
```bash
npm run test:backend
```

### End-to-End Tests

Navigate to the e2e test directory:
```bash
cd tests/e2e
```

Run all e2e tests:
```bash
npm run test
```

Run e2e tests with UI (browser window visible):
```bash
npm run test:ui
```

Run tests for specific browsers:
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

Debug tests:
```bash
npm run test:debug
```

View test reports:
```bash
npm run test:report
```

## Deployment

Deploy to Cloudflare Pages:
```bash
npm run deploy
```

## Technologies

- **Frontend**: React, IndexedDB
- **Backend**: Cloudflare Workers
- **Testing**: Jest, Playwright
- **Deployment**: Cloudflare Pages + Workers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.