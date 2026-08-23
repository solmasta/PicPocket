# PicPocket Frontend

A privacy-focused photo storage application that runs entirely in your browser using IndexedDB for local storage.

## 🚀 Features

- **Privacy-First**: All photos stored locally in IndexedDB
- **No Server Required**: Works completely offline
- **Modern React**: Built with React 18 and modern hooks
- **Responsive Design**: Works on all devices
- **Dark Mode**: Automatic dark mode support
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance Optimized**: Lazy loading, code splitting, and more
- **PWA Ready**: Install as a native app on mobile devices

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type safety and better developer experience
- **IndexedDB**: Client-side database for photo storage
- **React Router**: Client-side routing
- **Cloudflare Workers**: Optional backend for cloud sync
- **PWA**: Progressive Web App capabilities

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🧪 Testing

The application includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run accessibility tests
npm run test:a11y
```

## 🚀 Deployment

### GitHub Pages

```bash
# Deploy to GitHub Pages
npm run deploy
```

### Custom Domain

1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure your domain to serve the built files

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root:

```env
REACT_APP_API_URL=https://your-api-url.com
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_REPORTING=true
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
```

### PWA Configuration

The PWA manifest and service worker are automatically configured. You can customize:

- `public/manifest.json`: PWA manifest settings
- `public/sw.js`: Service worker configuration
- `public/index.html`: HTML meta tags and SEO

## 🎨 Theming

The application supports automatic dark mode and includes:

- CSS custom properties for easy customization
- High contrast mode support
- Reduced motion support for accessibility
- Responsive design breakpoints

## ♿ Accessibility

This application is built with accessibility in mind:

- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- Focus management
- ARIA labels and landmarks

## 📊 Performance

Performance optimizations include:

- Code splitting and lazy loading
- Image optimization and lazy loading
- Service worker for caching
- Bundle size optimization
- Performance monitoring

## 🔒 Security

Security features:

- Content Security Policy headers
- XSS protection
- Input sanitization
- Secure headers configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions