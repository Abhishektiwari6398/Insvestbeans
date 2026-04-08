import { FormEvent, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/Toasts";
import axios from "axios";
import { useTheme } from "@/controllers/Themecontext";

const ResetPasswordView = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = searchParams.get("token");

  // Password strength indicators
  const passwordStrength = {
    hasLength: password.length >= 8,
    hasLetter: /[a-z]/.test(password),
    hasCapital: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  // Verify token on component mount
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    const verifyToken = async () => {

      if (!token) {
        setTokenValid(false);
        setError("Invalid or missing reset token");
        return;
      }

      try {
        await axios.get(`${API_URL}/users/verify-reset-token/${token}`);
        setTokenValid(true);
      } catch (err: any) {
        setTokenValid(false);
        setError(err?.response?.data?.message || "Reset link is invalid or expired");
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    const API_URL = import.meta.env.VITE_API_URL;
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      const errorMsg = "Password must meet all requirements";
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/users/reset-password`, {
        token,
        newPassword: password,
      });

      if (data.success) {
        setResetSuccess(true);
        showSuccess("Password reset successful! Redirecting to sign in...");
        
        // Redirect to signin after 2 seconds
        setTimeout(() => {
          navigate("/Signin");
        }, 2000);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to reset password. Please try again.";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while verifying token
  if (tokenValid === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? "bg-[#f5f4f0]" : "bg-slate-950/95"}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#5194F6] mx-auto mb-4" />
          <p className={`${isLight ? "text-gray-400" : "text-white/50"}`}>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isLight ? "bg-[#f5f4f0]" : "bg-slate-950/95"}`}>
          <div className="w-full max-w-md">
            <div className={`relative overflow-hidden rounded-[32px] p-8 sm:p-10 ${isLight ? "bg-white border border-gray-100 shadow-xl" : "border border-white/10 bg-white/5 backdrop-blur-2xl"}`}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full mb-6">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                
                <h1 className={`text-3xl font-bold tracking-tight mb-3 ${isLight ? "text-gray-900" : "text-white"}`}>
                  Invalid Reset Link
                </h1>
                
                <p className={`mb-6 ${isLight ? "text-gray-500" : "text-white/60"}`}>
                  {error || "This password reset link is invalid or has expired."}
                </p>

                <Link to="/forgot-password">
                  <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#5194F6] to-[#3a7de0] hover:from-[#3a7de0] hover:to-[#5194F6] text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Request New Reset Link
                  </Button>
                </Link>

                <p className={`text-center text-sm mt-6 ${isLight ? "text-gray-400" : "text-white/50"}`}>
                  <Link to="/signin" className="font-semibold text-[#5194F6] hover:text-[#7ab8fa] hover:underline">
                    Back to Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isLight ? "bg-[#f5f4f0]" : "bg-slate-950/95"}`}>
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className={`relative overflow-hidden rounded-[32px] p-8 sm:p-10 ${isLight ? "bg-white border border-gray-100 shadow-xl" : "border border-white/10 bg-white/5 backdrop-blur-2xl"}`}>
            {!resetSuccess ? (
              <>
                {/* Logo & Heading */}
                <div className="text-center mb-8">
                  <div className="inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1C3656] to-[#5194F6] rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl font-bold">IB</span>
                    </div>
                  </div>
                  <h1 className={`text-3xl font-bold tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                    Reset Password
                  </h1>
                  <p className={`mt-2 text-sm ${isLight ? "text-gray-400" : "text-white/50"}`}>
                    Enter your new password below
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className={`mb-6 rounded-xl p-4 ${isLight ? "bg-red-50 border border-red-200" : "bg-red-500/10 border border-red-500/30"}`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${isLight ? "text-red-700" : "text-red-300"}`}>Error</p>
                        <p className={`text-sm mt-1 ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-white/70">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-white/30" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-11 pr-12 h-12 text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[#5194F6] focus:ring-[#5194F6]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-white/30 hover:text-white/70 transition disabled:opacity-50"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicators */}
                    {password && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2
                            className={`w-4 h-4 ${passwordStrength.hasLength ? 'text-green-400' : 'text-white/20'}`}
                          />
                          <span className={passwordStrength.hasLength ? 'text-green-400' : 'text-white/40'}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2
                            className={`w-4 h-4 ${passwordStrength.hasLetter ? 'text-green-400' : 'text-white/20'}`}
                          />
                          <span className={passwordStrength.hasLetter ? 'text-green-400' : 'text-white/40'}>
                            Contains lowercase letters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2
                            className={`w-4 h-4 ${passwordStrength.hasCapital ? 'text-green-400' : 'text-white/20'}`}
                          />
                          <span className={passwordStrength.hasCapital ? 'text-green-400' : 'text-white/40'}>
                            Contains uppercase letters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2
                            className={`w-4 h-4 ${passwordStrength.hasNumber ? 'text-green-400' : 'text-white/20'}`}
                          />
                          <span className={passwordStrength.hasNumber ? 'text-green-400' : 'text-white/40'}>
                            Contains numbers
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2
                            className={`w-4 h-4 ${passwordStrength.hasSpecial ? 'text-green-400' : 'text-white/20'}`}
                          />
                          <span className={passwordStrength.hasSpecial ? 'text-green-400' : 'text-white/40'}>
                            Contains special characters
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/70">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-white/30" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        className="pl-11 pr-12 h-12 text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[#5194F6] focus:ring-[#5194F6]"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-white/30 hover:text-white/70 transition disabled:opacity-50"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {/* Password match indicator */}
                    {confirmPassword && (
                      <p className={`text-xs ${password === confirmPassword ? 'text-green-400' : 'text-red-600'}`}>
                        {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#5194F6] to-[#3a7de0] hover:from-[#3a7de0] hover:to-[#5194F6] text-white shadow-lg hover:shadow-xl transition-all"
                    disabled={loading || !isPasswordValid || password !== confirmPassword}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  
                  <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                    Password Reset Successful!
                  </h1>
                  
                  <p className={`mb-6 ${isLight ? "text-gray-500" : "text-white/60"}`}>
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>
                  
                  <div className="bg-[#5194F6]/10 border border-[#5194F6]/25 rounded-xl p-4">
                    <p className="text-sm text-[#5194F6]/90">
                      Redirecting you to sign in page...
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Sign In Link */}
            {!resetSuccess && (
              <p className={`text-center text-sm mt-6 ${isLight ? "text-gray-400" : "text-white/50"}`}>
                Remember your password?{" "}
                <Link to="/signin" className="font-semibold text-[#5194F6] hover:text-[#7ab8fa] hover:underline">
                  Sign In
                </Link>
              </p>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/30 mt-8">
            © 2025 INVESTBEANS • Secure • Regulated • Trusted
          </p>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordView;