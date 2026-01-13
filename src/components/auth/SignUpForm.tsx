import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '../../icons';
import Label from '../form/Label';
import Input from '../form/input/InputField';
import Checkbox from '../form/input/Checkbox';
import { useRegister } from '../../hooks/api/useAuth';

// Social Button
const SocialButton = ({ icon, text, onClick }: any) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className="group relative inline-flex items-center justify-center gap-3 py-3.5 px-6 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all duration-300 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 overflow-hidden"
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-cyan-500/0"
      whileHover={{
        background:
          'linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1), rgba(6, 182, 212, 0.1))',
      }}
      transition={{ duration: 0.3 }}
    />
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
    </div>
    <motion.span
      className="relative z-10"
      whileHover={{ scale: 1.1, rotate: 360 }}
      transition={{ duration: 0.5 }}
    >
      {icon}
    </motion.span>
    <span className="relative z-10">{text}</span>
  </motion.button>
);

// Password Strength Indicator
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const getColor = () => {
    if (strength <= 2)
      return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Weak' };
    if (strength <= 3)
      return { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', label: 'Medium' };
    return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', label: 'Strong' };
  };

  const colors = getColor();

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2"
    >
      <div className="flex gap-1.5">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i < strength ? 1 : 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`h-2 flex-1 rounded-full ${i < strength ? colors.bg : 'bg-gray-200 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Password strength: <span className={`font-bold ${colors.text}`}>{colors.label}</span>
      </p>
    </motion.div>
  );
};

export default function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { mutate: register, isPending } = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!/(?=.*[a-z])/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (!formData.confirmPassword) {
      setError('Please confirm your password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!isChecked) {
      setError('You must accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    register(
      {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      },
      {
        onSuccess: () => {
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
          });
          setIsChecked(false);
          navigate('/');
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message || err?.message || 'Registration failed. Please try again.'
          );
        },
      }
    );
  };

  return (
    <div className="w-full">
      {/* Back Link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-all duration-300 hover:text-purple-600 dark:hover:text-purple-400 group"
        >
          <motion.div whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
            <ChevronLeftIcon className="size-4" />
          </motion.div>
          <span>Back to dashboard</span>
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h1 className="mb-3 text-4xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
          Create your account
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Start your journey with ORA SCRUM today</p>
      </motion.div>

      {/* Social Login */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6"
      >
        <SocialButton
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                fill="#4285F4"
              />
              <path
                d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                fill="#34A853"
              />
              <path
                d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                fill="#FBBC05"
              />
              <path
                d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                fill="#EB4335"
              />
            </svg>
          }
          text="Google"
        />
        <SocialButton
          icon={
            <svg width="20" height="20" viewBox="0 0 21 20" fill="none" className="fill-current">
              <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
            </svg>
          }
          text="X"
        />
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.4 }}
        className="relative my-6"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950 rounded-full">
            Or register with email
          </span>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              placeholder="John"
              disabled={isPending}
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField(null)}
              placeholder="Doe"
              disabled={isPending}
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
            />
          </motion.div>
        </div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Email <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="john.doe@example.com"
              disabled={isPending}
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
            />
            <motion.div
              className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"
              animate={{
                scale: focusedField === 'email' ? 1.1 : 1,
                color: focusedField === 'email' ? '#a78bfa' : '#9ca3af',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.75 }}
        >
          <Label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Create a strong password"
              disabled={isPending}
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeIcon className="w-5 h-5 text-gray-400 hover:text-purple-500 transition-colors duration-300" />
              ) : (
                <EyeCloseIcon className="w-5 h-5 text-gray-400 hover:text-purple-500 transition-colors duration-300" />
              )}
            </motion.button>
          </div>
          <PasswordStrengthIndicator password={formData.password} />
        </motion.div>

        {/* Confirm Password */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              placeholder="Confirm your password"
              disabled={isPending}
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeIcon className="w-5 h-5 text-gray-400 hover:text-purple-500 transition-colors duration-300" />
              ) : (
                <EyeCloseIcon className="w-5 h-5 text-gray-400 hover:text-purple-500 transition-colors duration-300" />
              )}
            </motion.button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400"
            >
              Passwords don't match
            </motion.p>
          )}
        </motion.div>

        {/* Terms */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="flex items-start gap-3"
        >
          <Checkbox
            className="mt-1 flex-shrink-0"
            checked={isChecked}
            onChange={setIsChecked}
            disabled={isPending}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            I agree to the{' '}
            <Link
              to="/terms"
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Privacy Policy
            </Link>
          </p>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isPending}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={!isPending ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isPending ? { scale: 0.98 } : {}}
          className="relative w-full px-4 py-4 text-base font-bold text-white transition-all duration-300 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <motion.svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </motion.svg>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </motion.svg>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </motion.form>

      {/* Sign In Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6"
      >
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
