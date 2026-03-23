// Demo authentication service - works without Supabase Auth setup
// For production, replace with real Supabase Auth

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

// Demo users for testing
const DEMO_USERS = {
  'admin@fleetpro.com': 'Admin@123456',
  'user@demo.com': 'demo123',
};

export const authService = {
  // Sign up a new user (demo)
  async signUp(email: string, password: string): Promise<AuthResponse> {
    console.log('📝 [AUTH] Signing up:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!email || !password) {
      return { user: null, error: 'Email and password are required' };
    }

    console.log('✅ [AUTH] Sign up successful');
    return {
      user: {
        id: `user_${Date.now()}`,
        email,
        role: 'user',
      },
      error: null,
    };
  },

  // Sign in with email and password (demo)
  async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 [AUTH] Signing in:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!email || !password) {
      return { user: null, error: 'Email and password are required' };
    }

    // Check demo credentials
    const expectedPassword = DEMO_USERS[email as keyof typeof DEMO_USERS];
    
    if (!expectedPassword) {
      return { user: null, error: 'Invalid email or password' };
    }

    if (password !== expectedPassword) {
      return { user: null, error: 'Invalid email or password' };
    }

    console.log('✅ [AUTH] Sign in successful:', email);
    
    // Determine role based on email
    const role = email === 'admin@fleetpro.com' ? 'admin' : 'user';
    
    return {
      user: {
        id: email.replace('@', '_').replace('.', '_'),
        email,
        role,
      },
      error: null,
    };
  },

  // Sign out (demo)
  async signOut(): Promise<{ error: string | null }> {
    console.log('🔓 [AUTH] Signing out');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ [AUTH] Sign out successful');
    return { error: null };
  },

  // Get current user (demo)
  async getCurrentUser(): Promise<AuthUser | null> {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  },

  // Listen to auth state changes (demo)
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      callback(JSON.parse(stored));
    }
    return null as any;
  },

  // Reset password request (demo)
  async resetPasswordRequest(email: string): Promise<{ error: string | null }> {
    console.log('📧 [AUTH] Requesting password reset for:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ [AUTH] Password reset email sent (demo)');
    return { error: null };
  },

  // Update password (demo)
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    console.log('🔄 [AUTH] Updating password');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ [AUTH] Password updated');
    return { error: null };
  },
};
