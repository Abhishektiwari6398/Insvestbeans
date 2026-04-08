import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/Toasts";
import { useTheme } from "@/controllers/Themecontext";
import axios from "axios";

const ForgotPasswordView = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    const API_URL = import.meta.env.VITE_API_URL;
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/users/forgot-password`, { email });
      if (data.success) {
        setEmailSent(true);
        showSuccess("Password reset link sent! Check your email.");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to send reset email. Please try again.";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isLight ? "bg-[#f5f4f0]" : "bg-slate-950/95"}`}>
        <div className="w-full max-w-md">

          {/* Main Card */}
          <div className={`relative overflow-hidden rounded-[32px] p-8 sm:p-10 ${isLight ? "bg-white border border-gray-100 shadow-xl" : "border border-white/10 bg-white/5 backdrop-blur-2xl"}`}>

            {/* Back Button */}
            <Link
              to="/signin"
              className={`inline-flex items-center gap-2 text-sm mb-6 transition-colors ${isLight ? "text-gray-400 hover:text-gray-700" : "text-white/60 hover:text-white"}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>

            {!emailSent ? (
              <>
                {/* Logo & Heading */}
                <div className="text-center mb-8">
                  <div className="inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1C3656] to-[#5194F6] rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl font-bold">IB</span>
                    </div>
                  </div>
                  <h1 className={`text-3xl font-bold tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                    Forgot Password?
                  </h1>
                  <p className={`mt-2 text-sm ${isLight ? "text-gray-400" : "text-white/50"}`}>
                    No worries! Enter your email and we'll send you a reset link
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className={`mb-6 rounded-xl p-4 ${isLight ? "bg-red-50 border border-red-200" : "bg-red-500/10 border border-red-500/30"}`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${isLight ? "text-red-700" : "text-red-300"}`}>Error</p>
                        <p className={`text-sm mt-1 ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-white/70"}`}>
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${isLight ? "text-gray-300" : "text-white/30"}`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={`pl-11 h-12 text-base focus:border-[#5194F6] focus:ring-[#5194F6] ${isLight ? "border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400" : "border-white/10 bg-white/5 text-white placeholder:text-white/30"}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#5194F6] to-[#3a7de0] hover:from-[#3a7de0] hover:to-[#5194F6] text-white shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending Reset Link...</>
                    ) : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${isLight ? "bg-emerald-50 border border-emerald-200" : "bg-green-100"}`}>
                  <CheckCircle2 className={`w-8 h-8 ${isLight ? "text-emerald-600" : "text-green-600"}`} />
                </div>

                <h1 className={`text-3xl font-bold tracking-tight mb-3 ${isLight ? "text-gray-900" : "text-white"}`}>
                  Check Your Email
                </h1>

                <p className={`mb-2 ${isLight ? "text-gray-500" : "text-white/60"}`}>
                  We've sent a password reset link to:
                </p>

                <p className="text-[#5194F6] font-semibold mb-6">{email}</p>

                <div className="bg-[#5194F6]/10 border border-[#5194F6]/25 rounded-xl p-4 mb-6">
                  <p className="text-sm text-[#5194F6]/90">
                    <strong>Note:</strong> The reset link will expire in 1 hour for security purposes.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className={`text-sm ${isLight ? "text-gray-400" : "text-white/50"}`}>
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className={`w-full h-12 ${isLight ? "border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50" : "border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5"}`}
                    onClick={() => { setEmailSent(false); setEmail(""); }}
                  >
                    Try Another Email
                  </Button>
                </div>
              </div>
            )}

            {/* Sign In Link */}
            <p className={`text-center text-sm mt-6 ${isLight ? "text-gray-400" : "text-white/50"}`}>
              Remember your password?{" "}
              <Link to="/signin" className="font-semibold text-[#5194F6] hover:text-[#3a7de0] hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className={`text-center text-xs mt-8 ${isLight ? "text-gray-700" : "text-white/30"}`}>
            © 2025 INVESTBEANS • Secure • Regulated • Trusted
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordView;