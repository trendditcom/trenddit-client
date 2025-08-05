# Trenddit Client

<div align="center">

**🚀 AI-Powered Enterprise Intelligence Platform**

*Transform market trends into actionable engineering roadmaps with real-time AI analysis*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-398CCB?style=for-the-badge&logo=trpc&logoColor=white)](https://trpc.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

[Demo](https://trenddit.vercel.app) · [Documentation](https://docs.trenddit.com) · [Report Bug](https://github.com/trendditcom/trenddit-client/issues) · [Request Feature](https://github.com/trendditcom/trenddit-client/issues)

</div>

---

## ✨ Features

🧠 **AI-Powered Trend Intelligence** - Multi-agent AI system analyzes market trends with chain-of-thought reasoning  
🎯 **Smart Need Discovery** - Convert trends into personalized business needs using GPT-4  
🛠 **Solution Marketplace** - AI-generated build vs buy vs partner recommendations with ROI analysis  
📊 **Real-time Market Intelligence** - Live market synthesis with conversational AI interface  
⚡ **Instant Filtering** - Client-side filtering with 0ms response time  
💾 **Smart Caching** - Multi-layer caching with localStorage persistence  
🎨 **Modern UI/UX** - Professional enterprise-grade interface  

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/trendditcom/trenddit-client.git
cd trenddit-client

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your OpenAI API key to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🏗️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) with strict mode
- **API**: [tRPC v10](https://trpc.io/) for end-to-end type safety
- **AI**: [OpenAI GPT-4](https://openai.com/) for intelligent analysis
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [CVA](https://cva.style/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) for feature-specific state
- **Validation**: [Zod](https://zod.dev/) for runtime type checking
- **Icons**: [Lucide React](https://lucide.dev/)

## 📖 Usage

### Trend Analysis

```typescript
// Analyze market trends with AI
const { data: trends } = trpc.trends.list.useQuery({
  limit: 20,
  refresh: false
});

// Get AI-powered trend analysis
const analysis = await trpc.intelligence.predictTrendRelevance.mutate({
  trendId: 'trend_001',
  companyProfile: {
    industry: 'technology',
    size: 'enterprise',
    techMaturity: 'high'
  }
});
```

### Need Discovery

```typescript
// Generate business needs from trends
const needs = await trpc.needs.generate.mutate({
  companyProfile: {
    industry: 'healthcare',
    size: 'medium',
    challenges: ['operational-inefficiencies', 'data-silos'],
    goals: ['cost-reduction', 'automation']
  },
  selectedTrends: ['ai-automation', 'healthcare-ai']
});
```

### Solution Matching

```typescript
// Get AI-powered solution recommendations
const solutions = await trpc.solutions.generate.mutate({
  needId: 'need_123',
  approaches: ['build', 'buy', 'partner'],
  budget: 100000,
  timeline: 6
});
```

## 🏛️ Architecture

Built with **feature-slice architecture** for maximum modularity:

```
/features
  /trends           # Trend intelligence & analysis
  /needs            # Business need discovery
  /solutions        # Solution matching & ROI
  /intelligence     # Multi-agent AI system
/lib
  /ai              # OpenAI integration
  /ui              # Reusable components
  /trpc            # API configuration
/app               # Next.js app router pages
```

### Key Principles

- **Feature Independence**: Each feature can be developed and deployed separately
- **Type Safety**: 100% TypeScript with strict mode
- **Event-Driven**: Features communicate via typed events
- **AI-First**: Every feature leverages AI for intelligent automation

## 🧪 Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript compiler
npm test           # Run tests (coming soon)
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-your-openai-api-key

# Optional
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint && npm run typecheck`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📊 Performance

- **Page Load**: < 2 seconds with cached data
- **AI Response**: 1-3 seconds for complex analysis  
- **Cache Hit Rate**: > 90% for returning users
- **Bundle Size**: < 150KB gzipped
- **Lighthouse Score**: 95+ across all metrics

## 🛣️ Roadmap

- [ ] **Enhanced Multi-Source Research** - Integration with 50+ data sources
- [ ] **Voice Interface** - Speech-to-text for natural conversations
- [ ] **Mobile App** - React Native mobile application
- [ ] **Team Collaboration** - Real-time collaborative analysis
- [ ] **Advanced Analytics** - Custom dashboards and reporting
- [ ] **API Platform** - Public API for third-party integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT-4 API
- [Vercel](https://vercel.com/) for hosting and deployment
- [Next.js](https://nextjs.org/) team for the amazing framework
- All contributors who help make this project better

---

<div align="center">

**Made with ❤️ by the Trenddit Team**

[Website](https://trenddit.com) · [Twitter](https://twitter.com/trenddit) · [Discord](https://discord.gg/trenddit)

</div>