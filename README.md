# DebateBots - Multi-AI Debate Platform

A sophisticated platform for hosting debates between multiple AI agents with real-time scoring and comprehensive content export capabilities.

## 🎯 Features

### Core Functionality
- **Multi-AI Debates**: Configure multiple AI participants with different stances and personalities
- **Real-time Execution**: Watch debates unfold in real-time with WebSocket updates
- **Judge Scoring**: AI judges evaluate debate performance with detailed scoring criteria
- **Content Export**: Export complete debates as structured Markdown files
- **API Configuration**: Flexible support for multiple AI providers (OpenAI, Anthropic, Custom APIs)

### Technical Highlights
- **Modern Architecture**: React frontend with Node.js/Express backend
- **Real-time Updates**: WebSocket integration for live debate viewing
- **Database Persistence**: SQLite for reliable data storage
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **API Security**: Rate limiting and input validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/cyber-tao/debatebots.git
cd debatebots
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Configure environment**
```bash
# Backend configuration
cp server/.env.example server/.env

# Frontend configuration  
cp client/.env.example client/.env
```

4. **Add your API keys to server/.env**
```bash
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

5. **Start the application**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

## 📁 Project Structure

```
debatebots/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and WebSocket services
│   │   └── types/          # TypeScript type definitions
│   └── public/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # API route handlers
│   │   ├── services/       # Business logic and AI integrations
│   │   ├── database/       # Database schema and operations
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Express middleware
│   │   └── types/          # TypeScript type definitions
│   └── dist/              # Compiled JavaScript (generated)
└── package.json           # Root package configuration
```

## 🔧 Configuration

### API Providers

The platform supports multiple AI providers:

1. **OpenAI**
   - Models: GPT-3.5, GPT-4, GPT-4 Turbo
   - Configuration: API key, model selection, temperature, max tokens

2. **Anthropic**
   - Models: Claude-3 Haiku, Sonnet, Opus
   - Configuration: API key, model selection, temperature, max tokens

3. **Custom APIs**
   - Support for any OpenAI-compatible API
   - Configuration: Base URL, API key, custom parameters

### Debate Configuration

- **Topic**: The main debate subject
- **Participants**: 2+ AI agents with configurable stances (pro/con)
- **Judges**: 1+ AI judges with custom scoring criteria
- **Rules**: Maximum rounds, word limits per turn
- **Personalities**: Custom instructions for each participant

## 🎮 Usage Guide

### 1. Setup API Configurations
Navigate to **API Configs** and add your AI service configurations:
- Choose provider (OpenAI, Anthropic, Custom)
- Add API credentials
- Configure model parameters

### 2. Create AI Participants
Go to **Participants** to create debate participants:
- Assign API configuration
- Set debate stance (Pro/Con)
- Configure personality and instructions
- Create judges with scoring criteria

### 3. Start a Debate
From the **Dashboard**:
- Click "New Debate"
- Enter topic and description
- Select participants and judges
- Set debate parameters (rounds, word limits)
- Start the debate and watch live

### 4. Monitor and Control
During debates:
- View real-time messages
- Monitor progress and scores
- Pause/resume/stop as needed
- Export results when complete

## 🔌 API Documentation

### REST Endpoints

#### API Configurations
- `GET /api/configs` - List all configurations
- `POST /api/configs` - Create new configuration
- `PUT /api/configs/:id` - Update configuration
- `DELETE /api/configs/:id` - Delete configuration

#### Participants & Judges
- `GET /api/participants` - List participants
- `POST /api/participants` - Create participant
- `GET /api/judges` - List judges
- `POST /api/judges` - Create judge

#### Debate Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/start` - Start debate
- `POST /api/sessions/:id/pause` - Pause debate
- `POST /api/sessions/:id/stop` - Stop debate
- `GET /api/sessions/:id/export` - Export as Markdown

### WebSocket Events
- `subscribe` - Subscribe to session updates
- `debate_update` - Real-time debate progress
- `new_message` - New debate message
- `session_status` - Status changes

## 🧪 Development

### Running Tests
```bash
# Backend tests
npm run test:server

# Frontend tests  
npm run test:client

# All tests
npm test
```

### Building for Production
```bash
npm run build
```

### Development Scripts
```bash
npm run dev          # Start both frontend and backend
npm run dev:server   # Start backend only
npm run dev:client   # Start frontend only
```

## 📊 Database Schema

The application uses SQLite with the following main tables:
- `api_configs` - AI service configurations
- `ai_participants` - Debate participants
- `judges` - Debate judges
- `debate_sessions` - Debate sessions
- `debate_messages` - Individual debate messages
- `judge_scores` - Scoring results

## 🔒 Security Features

- **Rate Limiting**: API calls are rate-limited to prevent abuse
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Proper CORS configuration
- **API Key Security**: Keys are never exposed in responses
- **SQL Injection Prevention**: Parameterized queries

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live debate progress without page refresh
- **Dark/Light Mode**: Automatic theme detection
- **Accessibility**: WCAG compliant interface
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 📈 Scaling Considerations

The platform is designed for extensibility:
- **Database**: Can be switched to PostgreSQL/MySQL for production
- **API Providers**: Easy to add new AI service integrations
- **Deployment**: Docker-ready for containerized deployment
- **Caching**: Redis integration ready for session management
- **Load Balancing**: Stateless design supports horizontal scaling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support, please:
1. Check the documentation above
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## 🚧 Roadmap

- [ ] Additional AI providers (Google PaLM, Cohere)
- [ ] Advanced scoring algorithms
- [ ] Team debates (multiple participants per side)
- [ ] Custom debate formats
- [ ] Integration with external judging systems
- [ ] Analytics and performance metrics
- [ ] User authentication and permissions
- [ ] Debate templates and presets