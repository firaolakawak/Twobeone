import { useState } from 'react';
import { MobileButton } from '../mobile-ui/MobileButton';
import { MobileInput } from '../mobile-ui/MobileInput';
import { MobileAlert } from '../mobile-ui/MobileFeedback';
import { Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react';

/**
 * MobileLoginScreen
 * 
 * Complete login/signup screen template:
 * - Safe areas (44px top, 34px bottom)
 * - Proper vertical spacing (8dp rhythm)
 * - Touch targets (min 48dp)
 * - Form validation
 * - Bottom CTA elevated above safe area
 */
export function MobileLoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    console.log('Form submitted:', formData);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Safe area top: 44px */}
      <div className="pt-11">
        {/* Main Content - 16dp horizontal padding */}
        <main className="px-4 py-8 pb-32 max-w-md mx-auto">
          
          {/* Logo / Hero Section - 40dp spacing */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-lg">
              <Heart className="w-10 h-10 text-white" fill="currentColor" />
            </div>
            
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              TwoBeOne
            </h1>
            
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              {mode === 'login' 
                ? 'Welcome back! Sign in to continue.' 
                : 'Create an account to get started.'}
            </p>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl mb-8">
            <button
              onClick={() => setMode('login')}
              className={`
                flex-1 h-10 rounded-lg font-medium text-sm transition-all
                ${mode === 'login'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
                }
              `}
            >
              Sign In
            </button>
            
            <button
              onClick={() => setMode('signup')}
              className={`
                flex-1 h-10 rounded-lg font-medium text-sm transition-all
                ${mode === 'signup'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
                }
              `}
            >
              Sign Up
            </button>
          </div>
          
          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <MobileAlert
              type="error"
              message="Please fix the errors below"
              className="mb-6"
            />
          )}
          
          {/* Form - 16dp spacing between inputs */}
          <div className="space-y-4 mb-6">
            {mode === 'signup' && (
              <MobileInput
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                error={errors.name}
                required
              />
            )}
            
            <MobileInput
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              error={errors.email}
              required
            />
            
            <MobileInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              icon={<Lock className="w-5 h-5" />}
              iconPosition="left"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              error={errors.password}
              required
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-7 top-[42px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            {mode === 'login' && (
              <div className="text-right">
                <button className="text-sm text-rose-600 dark:text-rose-400 font-medium hover:underline">
                  Forgot password?
                </button>
              </div>
            )}
          </div>
          
          {/* Terms (for signup) */}
          {mode === 'signup' && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-6">
              By signing up, you agree to our{' '}
              <button className="text-rose-600 dark:text-rose-400 hover:underline">
                Terms of Service
              </button>
              {' '}and{' '}
              <button className="text-rose-600 dark:text-rose-400 hover:underline">
                Privacy Policy
              </button>
            </p>
          )}
        </main>
        
        {/* Bottom CTA - Fixed, elevated above safe area */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-neutral-900 dark:via-neutral-900 pt-6 pb-9 px-4">
          <div className="max-w-md mx-auto space-y-3">
            {/* Primary CTA - 80-90% width, 48-56dp height */}
            <MobileButton
              fullWidth
              size="lg"
              loading={loading}
              onClick={handleSubmit}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </MobileButton>
            
            {/* Secondary action */}
            <div className="text-center">
              <button className="text-sm text-neutral-600 dark:text-neutral-400">
                {mode === 'login' 
                  ? "Don't have an account? " 
                  : 'Already have an account? '}
                <span className="text-rose-600 dark:text-rose-400 font-medium hover:underline">
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
