# Auth Feature

## Overview
The Auth feature provides complete user authentication functionality including user registration, login, session management, and form validation. It serves as the entry point for user access control throughout the application.

## Purpose
- **User Authentication**: Secure login and registration system
- **Session Management**: Handle user authentication state and navigation
- **Form Validation**: Robust client-side validation for auth forms
- **Error Handling**: Clear user feedback for authentication failures
- **Route Protection**: Foundation for protecting authenticated routes

## Key Capabilities
- **User Registration**: New account creation with validation
- **User Login**: Existing user authentication
- **Form Validation**: Email format, password requirements, required fields
- **Error Management**: Clear error messages and recovery flows
- **Navigation**: Post-authentication routing to dashboard
- **Loading States**: Visual feedback during auth operations

## Directory Structure
```
auth/
├── components/
│   ├── login-form.tsx    # User login interface
│   └── register-form.tsx # New user registration interface
├── hooks/
│   └── use-auth.ts       # Authentication logic and API calls
├── types/
│   └── index.ts          # Auth-specific TypeScript types
└── index.ts              # Feature exports
```

## Core Components

### Login Form (`login-form.tsx`)
- Email/password input fields with validation
- Loading states during authentication
- Error display and handling
- Navigation to registration
- Responsive design with gradient styling

### Register Form (`register-form.tsx`)
- Name, email, password input fields
- Form validation and error handling
- Account creation workflow
- Navigation to login
- Consistent styling with login form

### Auth Hook (`use-auth.ts`)
- Centralized authentication logic
- API integration for login/register endpoints
- Form validation and error management
- Loading state management
- Post-auth navigation handling

## API Integration
- **Login Endpoint**: `/api/auth/login`
- **Register Endpoint**: `/api/auth/register`
- **User Profile**: `/api/auth/me`
- **Logout**: `/api/auth/logout`

## Core Types
```typescript
interface User {
  id: string;
  Name: string;
  email: string;
}

interface AuthFormData {
  email: string;
  password: string;
  name?: string; // Required for registration
}

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}
```

## Validation Rules
- **Email**: Must be valid email format
- **Password**: Required (additional rules can be added)
- **Name**: Required for registration, trimmed whitespace
- **Real-time Validation**: Immediate feedback on form errors

## Usage Example
```tsx
import { LoginForm, RegisterForm, useAuth } from '@/features/auth';

// Login page
function LoginPage() {
  return <LoginForm />;
}

// Register page  
function RegisterPage() {
  return <RegisterForm />;
}

// Custom auth logic
function CustomComponent() {
  const { login, register, isLoading, error } = useAuth();
  
  const handleLogin = async () => {
    const success = await login({ email, password });
    if (success) {
      // Handle successful login
    }
  };
}
```

## Form Features
- **Responsive Design**: Mobile-first responsive layouts
- **Loading States**: Spinner indicators during API calls
- **Error Handling**: Inline error messages with clear descriptions
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Visual Polish**: Gradient styling, hover effects, smooth transitions

## Security Considerations
- Client-side validation (server-side validation should also be implemented)
- Password requirements enforcement
- CSRF protection (to be implemented)
- Session management (to be implemented)
- Secure cookie handling (to be implemented)

## Navigation Flow
1. **Landing Page** → Login/Register forms
2. **Successful Auth** → Dashboard redirect
3. **Auth Errors** → Error display with retry options
4. **Form Switching** → Easy navigation between login/register

## Development Notes
- Forms use controlled components with React state
- Validation happens on form submission and real-time for better UX
- Error states are cleared when user starts typing
- Navigation uses Next.js router for client-side routing
- Loading states prevent multiple submissions
- Form styling uses Tailwind CSS with custom gradients
