import type { LocaleMessages } from '../../types'

export const en: LocaleMessages = {
  common: {
    email: 'Email',
    password: 'Password',
    name: 'Name',
    fullName: 'Full Name',
    role: 'Role',
    active: 'Active',
    yes: 'Yes',
    no: 'No',
    id: 'ID',
    created: 'Created',
    updated: 'Updated',
    lastLogin: 'Last Login',
    registered: 'Registered',
    lastUpdated: 'Last updated',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    error: 'Error'
  },
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your account',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    submit: 'Sign In',
    submitting: 'Signing in...',
    forgotPassword: 'Forgot your password?',
    forgotPasswordSending: 'Sending...'
  },
  register: {
    title: 'Create Account',
    subtitle: 'Sign up for a new account',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    passwordMismatch: 'Passwords do not match',
    submit: 'Create Account',
    submitting: 'Creating Account...',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in here'
  },
  resetPassword: {
    titleReset: 'Reset Password',
    titleChange: 'Change Password',
    currentPasswordLabel: 'Current Password',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    submitReset: 'Reset Password',
    submitUpdate: 'Update Password',
    submittingReset: 'Resetting...',
    submittingUpdate: 'Updating...',
    passwordHelpText: 'Password must contain at least',
    secureResetInfo: 'You are resetting your password using a secure link.',
    emailLabel: 'Email:'
  },
  passwordStrength: {
    label: 'Password Requirements:',
    strength: {
      weak: 'Weak',
      medium: 'Medium',
      strong: 'Strong',
      veryStrong: 'Very Strong',
      unknown: 'Unknown'
    },
    requirements: {
      minLength: 'At least {0} characters',
      uppercase: 'Contains uppercase letter',
      lowercase: 'Contains lowercase letter',
      numbers: 'Contains number',
      specialChars: 'Contains special character'
    },
    requirementsTitle: 'Password Requirements:',
    hintsTitle: 'How to make your password stronger:'
  },
  profile: {
    title: 'Profile Information',
    name: 'Name:',
    email: 'Email:',
    role: 'Role:',
    registered: 'Registered:',
    lastUpdated: 'Last updated:',
    active: 'Active:',
    id: 'ID:'
  },
  emailConfirmation: {
    successTitle: 'Email Confirmed!',
    errorTitle: 'Confirmation Failed',
    loginButton: 'Continue to Login',
    backToLogin: 'Back to Login',
    processing: 'Processing...',
    processingMessage: 'Please wait while we process your email confirmation.',
    successMessage: 'Your email has been confirmed and your account is now active.',
    errorMessage: 'The confirmation link is invalid or has expired. Please try registering again or contact support.'
  },
  logout: {
    linkText: 'Logout',
    loggingOut: 'Logging out...',
    confirmMessage: 'Are you sure you want to logout?'
  },
  userCard: {
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete user {0}?'
  },
  googleLogin: {
    buttonText: 'Continue with Google',
    redirecting: 'Redirecting...'
  },
  usersList: {
    title: 'Users List',
    loading: 'Loading users...',
    noUsers: 'No users found',
    error: 'Error:',
    page: 'Page',
    of: 'of',
    total: 'Total:',
    users: 'users',
    previous: 'Previous',
    next: 'Next'
  }
}
