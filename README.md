# TeleMed - Doctor Appointment & Telemedicine Platform

A production-ready telemedicine platform built with Next.js, TypeScript, Supabase, and Stripe.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL scripts in order:
     - `supabase/schema.sql` - Creates all tables, enums, functions, and triggers
     - `supabase/rls-policies.sql` - Sets up Row Level Security policies
   - Create a storage bucket named `avatars` with public access
   - Populate `.env.local` with your Supabase project URL and keys

3. **Create Admin Account:**
   - See [ADMIN_SETUP.md](./ADMIN_SETUP.md) for detailed instructions
   - Quick method: Create user in Supabase Dashboard with email `admin@telemed.com`
   - Default password: `Admin@123456` (change immediately!)

4. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials
   - Add your Stripe keys
   - Add your Resend API key

5. **Run the development server:**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
telemedicine-platform/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected dashboard pages
│   ├── admin/                    # Admin panel
│   ├── doctors/                  # Doctor profiles
│   ├── chamber/                  # Video consultation
│   └── api/                      # API routes
├── components/                   # React components
│   └── ui/                       # Reusable UI components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase clients
│   ├── auth/                     # Authentication hooks
│   ├── utils/                    # Helper functions
│   ├── payments/                 # Payment integration
│   └── webrtc/                   # Video call logic
├── types/                        # TypeScript types
└── supabase/                     # Database schemas and policies
```

## 🎯 Features Implemented

### ✅ Core Infrastructure
- [x] Next.js 14 with TypeScript
- [x] Supabase authentication and database
- [x] Row Level Security (RLS) policies
- [x] Responsive UI with Tailwind CSS
- [x] Environment configuration

### ✅ Authentication & User Management
- [x] Email/password login
- [x] Patient signup
- [x] Doctor signup with approval workflow
- [x] Role-based access control
- [x] Route protection middleware

### 🚧 In Progress
- [ ] Profile management with image upload
- [ ] Doctor availability management
- [ ] Appointment booking system
- [ ] Payment integration (Stripe + mock bKash)
- [ ] Video consultation chamber (WebRTC)
- [ ] Prescription management
- [ ] Reviews and ratings
- [ ] Admin panel
- [ ] Email notifications

## 🔐 User Roles

- **Patient**: Book appointments, consult doctors, view prescriptions
- **Doctor**: Manage availability, conduct consultations, create prescriptions
- **Admin**: Approve doctors, manage users, view analytics

## 💳 Payment System

- **Card Payments**: Stripe integration for Visa/Mastercard
- **bKash**: Mock implementation (can be replaced with real API)
- **Commission**: 25% admin, 75% doctor

## 🎥 Video Consultation

- WebRTC peer-to-peer video calls
- TURN server support for NAT traversal
- Local recording capability
- Time-window access control

## 📋 Business Rules

- **Cancellation**: Allowed up to 48 hours before appointment
- **Reviews**: Can be submitted within 7 days after completed appointment
- **Doctor Approval**: Required before appearing in public listings
- **Slot Locking**: Booked slots cannot be edited

## 🛠️ Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build
```

## 🚀 Deployment

### Netlify

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_TURN_SERVER_URL=
ADMIN_COMMISSION_PERCENTAGE=25
```

## 📚 Database Schema

The database includes the following main tables:

- `profiles` - User profiles with role and status
- `doctors` - Doctor-specific information
- `specializations` - Medical specializations
- `availability_slots` - Doctor availability
- `appointments` - Appointment bookings
- `payments` - Payment transactions
- `prescriptions` - Medical prescriptions
- `medicines` & `tests` - Medical databases
- `reviews` - Patient reviews
- `notifications` - User notifications

## 🔒 Security

- Row Level Security (RLS) on all tables
- Secure storage bucket policies
- CSRF protection
- Input validation with Zod
- Audit logging for admin actions

## 📧 Notifications

- Appointment confirmation emails
- 24-hour reminders
- Prescription ready notifications
- User preference management

## 🎨 UI/UX

- Mobile-first responsive design
- Loading states for all async operations
- Error handling with user feedback
- Accessible components
- Clean medical-themed design

## 📝 License

This project is for demonstration purposes.

## 🤝 Support

For issues or questions, please contact support.
