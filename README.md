# Job Portal Platform - Backend (MERN Stack)

A comprehensive Enterprise Job Portal Platform built with Node.js, Express, and MongoDB. This platform connects job seekers with companies, providing an all-in-one solution for recruitment and job searching.

## 🎯 Features

### For Job Seekers
- **User Registration & Authentication**: Secure JWT-based authentication
- **Profile Management**: Complete profile with resume, skills, experience, and education
- **Job Search & Filtering**: Advanced filtering by job type, work mode, salary, location, skills
- **Job Applications**: Apply to jobs with resume and cover letter
- **Application Tracking**: Track application status in real-time
- **Save Jobs**: Bookmark jobs for later review
- **Interview Scheduling**: Receive and manage interview invitations
- **Real-time Messaging**: Direct communication with recruiters
- **Notifications**: Real-time alerts for application updates and messages
- **Job Recommendations**: AI-powered job recommendations based on profile
- **Company Reviews**: Read and write reviews about companies

### For Companies/HR Managers
- **Company Profile**: Create and manage company information
- **Job Posting**: Post and manage multiple job listings
- **Application Management**: View and track all applications
- **Applicant Tracking System (ATS)**: Full workflow management (screening → interview → offer)
- **Interview Scheduling**: Schedule interviews and video calls
- **Candidate Rating**: Rate and provide feedback on candidates
- **Analytics Dashboard**: View key metrics and hiring funnel
- **Team Management**: Add HR managers and assign roles
- **Bulk Operations**: Duplicate jobs, archive listings

### For Admins
- **Platform Management**: Manage users, companies, and jobs
- **Company Verification**: Approve or reject company registrations
- **User Suspension**: Suspend accounts for policy violations
- **Audit Logs**: Track all administrative actions
- **Analytics**: Platform-wide statistics and insights
- **Content Moderation**: Review reported content

## 📋 Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose ODM
- JWT Authentication
- Socket.io (Real-time messaging)
- bcryptjs (Password hashing)
- Multer (File uploads)
- Express Validator

**Optional Integrations:**
- Stripe (Payment processing)
- Nodemailer (Email notifications)
- AWS S3 (File storage)
- Node Cron (Scheduled tasks)

## 📁 Project Structure

```
├── config/
│   ├── database.js          # MongoDB connection
│   └── jwt.js               # JWT token generation & verification
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── rbac.js              # Role-based access control
├── models/
│   ├── User.js              # User model (job seekers, HR, admins)
│   ├── Company.js           # Company model
│   ├── Job.js               # Job listing model
│   ├── Application.js       # Job application model
│   ├── Interview.js         # Interview scheduling model
│   ├── Message.js           # Direct messages
│   ├── Conversation.js      # Message threads
│   ├── Notification.js      # Real-time notifications
│   ├── Review.js            # Company reviews
│   └── AuditLog.js          # Activity tracking
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── users.js             # User profile endpoints
│   ├── companies.js         # Company management
│   ├── jobs.js              # Job posting & management
│   ├── applications.js      # Application tracking (ATS)
│   ├── messages.js          # Messaging endpoints
│   ├── notifications.js     # Notification management
│   ├── admin.js             # Admin panel endpoints
│   └── analytics.js         # Analytics & insights
├── uploads/                 # File uploads directory
├── server.js                # Main application entry point
├── package.json             # Dependencies
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shabbe-sk/node.git
cd node
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and update with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/job-portal
JWT_SECRET=your_secure_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 🔐 Authentication & Authorization

### JWT Implementation
- Tokens expire in 7 days (configurable)
- Include token in `Authorization: Bearer <token>` header

### User Roles
- **admin**: Full platform access, user and company management
- **company_owner**: Can create and manage companies
- **hr_manager**: Can post jobs and manage applications
- **job_seeker**: Can search jobs and apply

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /verify` - Verify token

### Users (`/api/users`)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /:jobId/save` - Save job
- `GET /saved-jobs` - Get saved jobs
- `GET /:userId` - Get user profile (public)

### Companies (`/api/companies`)
- `POST /` - Create company
- `GET /` - Get all companies (paginated)
- `GET /:id` - Get company details
- `PUT /:id` - Update company
- `POST /:id/hr-manager` - Add HR manager

### Jobs (`/api/jobs`)
- `POST /` - Create job
- `GET /` - Search jobs (with filters)
- `GET /:id` - Get job details
- `PUT /:id` - Update job
- `PUT /:id/publish` - Publish job
- `PUT /:id/archive` - Archive job
- `POST /:id/duplicate` - Duplicate job

### Applications (`/api/applications`)
- `POST /` - Apply to job
- `GET /job/:jobId` - Get job applications (HR)
- `GET /my-applications` - Get my applications
- `GET /:id` - Get application details
- `PUT /:id/status` - Update application status
- `PUT /:id/shortlist` - Shortlist candidate
- `PUT /:id/reject` - Reject application

### Messages (`/api/messages`)
- `POST /` - Send message
- `GET /conversations` - Get user conversations
- `GET /:conversationId` - Get conversation messages
- `PUT /:id/read` - Mark message as read
- `DELETE /:conversationId` - Delete conversation

### Notifications (`/api/notifications`)
- `GET /` - Get notifications
- `GET /unread/count` - Get unread count
- `PUT /:id/read` - Mark as read
- `PUT /mark-all/read` - Mark all as read
- `DELETE /:id` - Delete notification

### Analytics (`/api/analytics`)
- `GET /admin/dashboard` - Admin analytics
- `GET /company/:companyId` - Company analytics
- `GET /user/profile` - User profile completion
- `GET /job/:jobId` - Job analytics
- `GET /funnel/:companyId` - Application funnel

### Admin (`/api/admin`)
- `GET /companies/pending` - Pending company approvals
- `GET /users` - All users (paginated)
- `PUT /companies/:id/approve` - Approve company
- `PUT /companies/:id/reject` - Reject company
- `PUT /companies/:id/suspend` - Suspend company
- `GET /audit-logs` - Activity logs
- `PUT /users/:id/suspend` - Suspend user

## 🔄 Real-time Features (Socket.io)

```javascript
// User Status
socket.emit('user_online', userId)
socket.on('user_status_changed', (data) => {...})

// Direct Messaging
socket.emit('send_message', messageData)
socket.on('receive_message', (data) => {...})

// Typing Indicator
socket.emit('typing', { recipientId })
socket.on('user_typing', (data) => {...})
```

## 📊 Database Models Overview

### User
- Authentication & profile data
- Job seeker preferences
- Subscription management
- Saved jobs tracking

### Company
- Company profile and branding
- Multi-tenant support
- Subscription plans
- HR manager assignments
- Metrics & analytics

### Job
- Job listing details
- Salary, location, requirements
- Application tracking
- View & save counts
- Publication status

### Application
- Application workflow tracking
- Resume & cover letter storage
- Interview scheduling links
- Rating & feedback
- Application funnel stage

### Interview
- Interview scheduling
- Multiple interviewer support
- Meeting links for video calls
- Feedback & verdicts
- Interview stage tracking

### Message & Conversation
- Direct messaging between users
- Conversation threads
- Read status tracking
- Attachment support

### Notification
- Multiple notification types
- Real-time delivery
- Read/unread tracking
- Related entity linking

## 🛡️ Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Fine-grained permissions
- **Input Validation**: Express-validator for all inputs
- **Audit Logging**: Track all admin actions
- **Data Sanitization**: Protection against injection attacks

## 📈 Scalability Considerations

- MongoDB indexes for frequently queried fields
- Pagination for large datasets
- Socket.io namespaces for real-time features
- Cron jobs for scheduled tasks
- Audit log TTL (auto-expires after 90 days)
- File upload validation and storage

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/job-portal

# JWT
JWT_SECRET=your_secure_secret_key_change_in_production
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload
MAX_FILE_SIZE=5000000
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png

# Payment (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# AWS (Optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1

# Features
RECOMMENDATION_LIMIT=5
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

### JWT Token Issues
- Ensure JWT_SECRET is set
- Check token expiration
- Verify Authorization header format

### Real-time Messages Not Working
- Check Socket.io CORS settings
- Ensure frontend connects to correct server URL
- Verify user authentication

## 📞 Support & Contact

For issues and questions:
- Create an issue on GitHub
- Contact: afroz02sk@gmail.com

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MERN Stack Community
- MongoDB Documentation
- Express.js Best Practices
- Socket.io Real-time Patterns

---

**Happy Coding! 🚀**
