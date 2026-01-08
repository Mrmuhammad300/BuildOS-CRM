# Construction CRM Platform

A comprehensive Construction Management CRM built with Next.js, Prisma, PostgreSQL, and Radix UI.

## 🚀 Features

### Core Modules
- **Project Management** - Create, track, and manage construction projects
- **Properties** - Real estate portfolio with financial analysis and IRR calculations
- **RFIs (Request for Information)** - Manage project clarifications with comments and responses
- **Submittals** - Track submittal packages with review workflows
- **Daily Reports** - Field reporting for daily activities, weather, and manpower
- **Change Orders** - Cost management with budget tracking
- **Punch Items** - Deficiency tracking and completion management
- **Documents** - File management with AWS S3 cloud storage integration
- **Design Services** - AI-powered architectural rendering via external platform integration

### Advanced Features
- ✅ **Webhook Integrations** - n8n automation for change orders and design services
- ✅ **Role-Based Access Control** - Admin, Project Manager, Field Engineer, Subcontractor roles
- ✅ **Financial Analysis** - IRR calculations, capital stack modeling, multi-year projections
- ✅ **Cloud Storage** - AWS S3 integration for document management
- ✅ **Real-time Updates** - Status tracking across all modules
- ✅ **Responsive Design** - Modern UI with Tailwind CSS and Radix UI components

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with JWT
- **Storage:** AWS S3
- **UI:** Tailwind CSS + Radix UI
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Query (TanStack Query)

## 📋 Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL database
- AWS account (for S3 storage)
- Environment variables (see Setup)

## 🔧 Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd construction_crm_platform
```

2. **Install dependencies:**
```bash
cd nextjs_space
yarn install
```

3. **Set up environment variables:**

Create `.env` file in `nextjs_space` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/construction_crm"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AWS S3 (configured automatically by Abacus.AI)
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="your-folder-prefix/"

# Webhook Secrets
CHANGE_ORDER_WEBHOOK_SECRET="your-change-order-webhook-secret"
DESIGN_WEBHOOK_SECRET="your-design-webhook-secret"

# External AI Design Platform
DESIGN_WEBHOOK_URL="https://your-design-platform.com/webhook"
```

4. **Initialize the database:**
```bash
yarn prisma generate
yarn prisma db push
yarn prisma db seed
```

5. **Run the development server:**
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Default Login Credentials

**Admin Account:**
- Email: `john@doe.com`
- Password: `johndoe123`

## 📁 Project Structure

```
construction_crm_platform/
├── nextjs_space/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard
│   │   ├── projects/         # Project management
│   │   ├── properties/       # Real estate module
│   │   ├── rfis/             # RFI management
│   │   ├── submittals/       # Submittal tracking
│   │   ├── daily-reports/    # Daily reports
│   │   ├── change-orders/    # Change order management
│   │   ├── punch-items/      # Punch list
│   │   ├── documents/        # Document management
│   │   └── design-services/  # AI design integration
│   ├── components/
│   │   └── ui/               # Reusable UI components
│   ├── lib/
│   │   ├── auth-options.ts   # NextAuth configuration
│   │   ├── db.ts             # Prisma client
│   │   ├── s3.ts             # AWS S3 utilities
│   │   └── design-webhook.ts # Design platform integration
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── scripts/
│       └── seed.ts           # Database seeding
├── WEBHOOK_GUIDE.md          # Webhook integration guide
├── DESIGN_SERVICES_GUIDE.md  # AI design platform guide
└── README.md                 # This file
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/signup` - User registration

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project

### RFIs
- `GET /api/rfis` - List RFIs
- `POST /api/rfis` - Create RFI
- `GET /api/rfis/[id]` - Get RFI details
- `POST /api/rfis/[id]/responses` - Add response
- `POST /api/rfis/[id]/comments` - Add comment

### Submittals
- `GET /api/submittals` - List submittals
- `POST /api/submittals` - Create submittal
- `GET /api/submittals/[id]` - Get submittal details
- `PATCH /api/submittals/[id]` - Update submittal

### Webhooks
- `POST /api/webhooks/change-orders` - n8n change order automation
- `POST /api/webhooks/design-callback` - Design platform status updates

## 📚 Documentation

- **[Webhook Integration Guide](./WEBHOOK_GUIDE.md)** - Complete guide for setting up n8n webhooks
- **[Design Services Guide](./DESIGN_SERVICES_GUIDE.md)** - AI design platform integration instructions

## 🔐 Security

- All routes protected with NextAuth.js middleware
- Role-based access control (RBAC)
- Webhook signature verification
- Environment variables for sensitive data
- AWS S3 with presigned URLs for secure file access

## 🚀 Deployment

The application is configured for deployment on Abacus.AI platform:

1. Build the application:
```bash
yarn build
```

2. Deploy using the provided deployment tools or manually:
```bash
yarn start
```

## 🐛 Known Issues & Fixes

All critical issues have been resolved in the latest version:
- ✅ Fixed null/undefined handling in status formatters
- ✅ Fixed date formatting for invalid dates
- ✅ Fixed API response structure mismatches
- ✅ Enhanced error handling across all modules

## 🗺️ Roadmap

See the **Incremental Improvement Roadmap** in the deployment documentation for planned enhancements:
- Phase 1: UX improvements (loading states, better error messages)
- Phase 2: Advanced features (search, reporting, notifications)
- Phase 3: Mobile optimization and real-time collaboration

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the project administrator for contribution guidelines.

## 📞 Support

For issues or questions, contact the development team.

---

**Built with ❤️ using Next.js and modern web technologies**
