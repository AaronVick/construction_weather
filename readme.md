# WeatherCrew Dashboard

A multi-modal admin dashboard for weather-based crew management, with secure Supabase authentication, responsive design, and premium features.

![Dashboard Screenshot](./screenshots/dashboard.png)

## Features

- 📱 **Responsive Design**: Fully responsive interface for web and mobile views
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 🔒 **Secure Authentication**: Powered by Supabase Auth
- 🌤️ **Weather Automation**: Integration with weather APIs and ChatGPT for intelligent notifications
- 📧 **Email Management**: Configure and send notifications to clients and workers
- 💼 **Client Management**: Track clients with detailed profiles and settings
- 📍 **Jobsite Management**: Manage multiple locations with different weather thresholds (Premium)
- 👷 **Worker Management**: Assign workers to specific jobsites
- 📊 **Advanced Analytics**: Track email performance and weather patterns (Premium)
- 💰 **Subscription Management**: Basic, Premium, and Enterprise tiers with feature gating

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand, SWR for data fetching
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **API Integration**: OpenAI API, Weather API
- **Hosting**: Vercel
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 16.0 or later
- npm or yarn
- Supabase account
- OpenAI API key
- Weather API key (weatherapi.com)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/weather-crew.git
   cd weather-crew
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_API=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_WEATHER_API_KEY=your_weather_api_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   VITE_APP_URL=http://localhost:3000
   VITE_APP_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
weather-crew/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and SVGs
│   ├── components/      # Reusable UI components
│   │   ├── clients/     # Client-related components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── email/       # Email-related components
│   │   ├── jobsites/    # Jobsite components
│   │   ├── layout/      # Layout components
│   │   ├── subscription/# Subscription components
│   │   ├── ui/          # Base UI components
│   │   └── workers/     # Worker-related components
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library imports and configs
│   ├── pages/           # Page components
│   ├── services/        # API service functions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main App component
│   ├── index.css        # Global styles
│   └── main.tsx         # Entry point
├── .env.example         # Example environment variables
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Deployment

### Vercel Deployment

1. Push your code to a GitHub repository.
2. Import the project to Vercel.
3. Set the environment variables in Vercel project settings.
4. Deploy!

## Supabase Setup

This project relies on the following Supabase tables:
- `clients`
- `workers`
- `jobsites`
- `worker_jobsites`
- `email_logs`
- `email_templates`
- `weather_checks`
- `subscriptions`
- `billing_history`
- `system_settings`

Database schema SQL files are available in the `/supabase` directory.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Weather data provided by [WeatherAPI.com](https://www.weatherapi.com/)
- Email content generation by [OpenAI](https://openai.com/)
- Icons from [Lucide Icons](https://lucide.dev/)

Database Structure

Core Tables:

clients - Store client information
workers - Store worker/crew information
jobsites - Store jobsite details with weather monitoring settings
worker_jobsites - Many-to-many relationship between workers and jobsites


Weather & Notification Tables:

email_templates - Reusable email templates
email_logs - History of all sent emails
weather_checks - Log of all weather condition checks


Subscription & Billing Tables:

subscriptions - Plan information (basic/premium/enterprise)
billing_history - Payment records
system_settings - User preferences and configurations


User Management:

user_profiles - Extended user information
analytics_data - For storing aggregated analytics



Key Features

Security:

Row Level Security (RLS) policies for all tables
Users can only access their own data
Proper relations between tables with cascading deletes


Performance:

Strategic indices on frequently queried columns
Support for geospatial queries with PostGIS
Optimized for filtering by status, dates, etc.


Data Integrity:

Foreign key constraints
Check constraints for enumerated values
Default values where appropriate
Automated timestamp management


Automation:

Trigger for updating updated_at timestamps
New user onboarding automation
Default email template creation



# Supabase Initial Schema
 ```
 -- Enable UUID extension (needed for unique identifiers)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    team_id UUID NOT NULL,
    subscription_id UUID,
    subscription_status TEXT DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE SET NULL
);

-- Teams Table (Every user gets a default team)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID UNIQUE NOT NULL, -- Ensures one owner per team
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Subscriptions Table (Links to Stripe)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    price_id TEXT NOT NULL, -- Links to Stripe pricing ID
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Admin Table (Tracks Admin Roles)
CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'moderator')),
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_subscription ON users(subscription_id);
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- User RLS Policy: Users can only see their own data
CREATE POLICY "Allow user access to own data"
ON users
FOR SELECT USING (auth.uid() = id);

-- Teams RLS Policy: Users can only access their own team
CREATE POLICY "Allow user access to their own team"
ON teams
FOR SELECT USING (auth.uid() = owner_id);

-- Subscriptions RLS Policy: Users can only access their own subscriptions
CREATE POLICY "Allow user access to their subscription"
ON subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- Admin RLS Policy: Only Admins can see all user data
CREATE POLICY "Allow admin access to users"
ON users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin WHERE admin.user_id = auth.uid() AND admin.role = 'superadmin')
);

-- Admin RLS Policy: Only Admins can access admin table
CREATE POLICY "Allow admin access to admin table"
ON admin
FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin WHERE admin.user_id = auth.uid() AND admin.role = 'superadmin')
);

 ```