import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { getBlogById, getAllBlogs, deleteBlog, toggleLike, Blog } from "@/services/blogService";
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Bookmark,
  Heart,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/controllers/AuthContext";
import { useTheme } from "@/controllers/Themecontext";
import axios from "axios";

// ── Email validation ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com",
  "trashmail.com", "yopmail.com", "tempmail.com", "throwaway.email",
  "sharklasers.com",
]);
const validateEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return "Email address is required.";
  if (trimmed.length > 254) return "Email address is too long.";
  if (!EMAIL_REGEX.test(trimmed)) return "Please enter a valid email address.";
  const domain = trimmed.split("@")[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.has(domain)) return "Disposable email addresses are not allowed.";
  return null;
};
type NewsletterStatus = "idle" | "loading" | "success" | "error" | "duplicate";

interface HeaderSection {
  header: string;
  subHeader: string;
}

const BlogDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [blog, setBlog] = useState<Blog | null>(null);
  const [allBlogIds, setAllBlogIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // ── Newsletter backend state ────────────────────────────────────────────
  const API_URL = import.meta.env.VITE_API_URL;
  const [nlStatus, setNlStatus] = useState<NewsletterStatus>("idle");
  const [nlFieldError, setNlFieldError] = useState<string | null>(null);
  const [nlServerMessage, setNlServerMessage] = useState("");
  const [nlTouched, setNlTouched] = useState(false);

  // Pre-fill if logged in
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  // Real-time validation after touch
  useEffect(() => {
    if (nlTouched) setNlFieldError(validateEmail(email));
  }, [email, nlTouched]);

  const handleNlBlur = () => {
    setNlTouched(true);
    setNlFieldError(validateEmail(email));
  };

  const handleNlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (nlStatus === "error" || nlStatus === "duplicate") {
      setNlStatus("idle");
      setNlServerMessage("");
    }
  };

  const handleNlSubmit = async () => {
    setNlTouched(true);
    const error = validateEmail(email);
    setNlFieldError(error);
    if (error) return;

    setNlStatus("loading");
    setNlServerMessage("");
    try {
      const { data } = await axios.post(
        `${API_URL}/subscribe`,
        { email: email.trim().toLowerCase(), source: "blog-detail" },
        { withCredentials: true }
      );
      setNlStatus("success");
      setNlServerMessage(data.message);
      setSubscribed(true);
    } catch (err: any) {
      const resData = err.response?.data;
      const httpStatus = err.response?.status;
      if (httpStatus === 409 || resData?.alreadySubscribed) {
        setNlStatus("duplicate");
        setNlServerMessage(resData?.message || "This email is already subscribed!");
      } else {
        setNlStatus("error");
        setNlServerMessage(resData?.message || "Something went wrong. Please try again.");
      }
    }
  };

  const handleNlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleNlSubmit();
  };

  const nlInputBorder = () => {
    if (nlFieldError) return "1px solid #ef4444";
    if (nlStatus === "success") return "1px solid #22c55e";
    if (nlStatus === "duplicate") return "1px solid #f59e0b";
    return isLight ? "1px solid #bfdbfe" : "1px solid rgba(255,255,255,0.20)";
  };

  // Derived state for like status
  const isLiked = blog && user && blog.likedBy ? blog.likedBy.includes(user._id) : false;
  const likesCount = blog?.likes || 0;

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const total = rect.height + windowHeight;
      const scrolled = windowHeight - rect.top;
      const raw = (scrolled / total) * 100;
      const pct = Math.min(100, Math.max(0, Number(raw.toFixed(0))));
      setProgress(pct);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [blog]);

  const fetchBlog = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [response, allBlogsResponse] = await Promise.all([
        getBlogById(id),
        getAllBlogs({ limit: 1000, sort: 'desc' })
      ]);
      setBlog(response);
      setAllBlogIds(allBlogsResponse.blogs.map(b => b._id));
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    } catch (error) {
      console.error("Error fetching blog:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to load blog";
      alert(errorMessage);
      navigate("/blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!blog) return;
    
    if (!user) {
      alert("Please login to like this blog");
      return;
    }

    setLikeLoading(true);
    try {
      const response = await toggleLike(blog._id);
      
      // Update blog state with new like data
      setBlog(prev => prev ? {
        ...prev,
        likes: response.likes,
        likedBy: response.likedBy
      } : null);
    } catch (error) {
      console.error("Error toggling like:", error);
      const errorMessage = error?.response?.data?.message || "Failed to update like";
      alert(errorMessage);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!blog || !confirm("Are you sure you want to delete this blog?")) return;

    setDeleteLoading(true);
    try {
      await deleteBlog(blog._id);
      alert("Blog deleted successfully");
      navigate("/blogs");
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = () => {
    if (blog) {
      navigate(`/blogs?edit=${blog._id}`);
    }
  };

  // Previous / Next blog navigation
  const currentIndex = allBlogIds.indexOf(id || '');
  const prevBlogId = currentIndex > 0 ? allBlogIds[currentIndex - 1] : null;
  const nextBlogId = currentIndex !== -1 && currentIndex < allBlogIds.length - 1 ? allBlogIds[currentIndex + 1] : null;

  const handleNavigateBlog = (blogId: string) => {
    navigate(`/blogs/${blogId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  if (loading) {
    return (
      <Layout>
        <div className={`flex justify-center items-center min-h-screen ${isLight ? "bg-slate-50" : "bg-slate-950/95"}`}>
          <Loader2 className="animate-spin text-blue-400" size={56} />
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="container mx-auto px-4 sm:px-6 py-12 text-center">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${isLight ? "text-slate-800" : "text-white"}`}>
            Blog not found
          </h2>
          <button
            onClick={() => navigate("/blogs")}
            className="text-blue-500 hover:underline font-medium"
          >
            Return to blogs
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950/95 text-white"}`}>
        {/* Reading Progress Bar */}
        <div className={`fixed top-0 left-0 w-full h-1 z-50 ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Hero Image Section - Fixed width */}
        <div className="pt-8 sm:pt-12 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Back to Blogs - top left above image */}
            <div className="mb-4">
              <button
                onClick={() => navigate("/blogs")}
                className={`inline-flex items-center gap-2 transition-colors group px-4 py-2 rounded-xl text-sm font-semibold ${isLight ? "text-slate-500 hover:text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200" : "text-white/60 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10"}`}
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Blogs
              </button>
            </div>
            {/* Hero Image - comfortable height */}
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl">
              <div className="relative h-[180px] sm:h-[260px] lg:h-[340px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                  src={blog.blogImage}
                  alt={blog.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {!blog.isPublished && (
                  <div className="absolute top-6 right-6">
                    <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                      Draft
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container - Wider width */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Article Content */}
          <article ref={articleRef} className="pb-12">
            {/* Title with Category Badge */}
            {/* <div className="mb-6">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-accent/10 to-purple-500/10 text-accent px-4 py-1.5 rounded-full text-xs font-bold border border-accent/20 shadow-sm">
                <Tag size={12} />
                {blog.category}
              </span>
            </div> */}

            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              {blog.title}
            </h1>

            {/* Metadata Bar with Author & Actions */}
            <div className={`pb-6 mb-8 border-b-2 ${isLight ? "border-slate-200" : "border-white/10"}`}>
          
              <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className={`flex items-center gap-1.5 text-xs lg:text-sm font-medium px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-lg flex-shrink-0 ${isLight ? "text-slate-600 bg-slate-100 border border-slate-200" : "text-white/60 bg-white/5 border border-white/10"}`}>
                    <Calendar size={14} className="text-blue-400" />
                    <span className="whitespace-nowrap text-xs">
                      {new Date(blog.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs lg:text-sm font-medium px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-lg flex-shrink-0 ${isLight ? "text-slate-600 bg-slate-100 border border-slate-200" : "text-white/60 bg-white/5 border border-white/10"}`}>
                    <Clock size={14} className="text-blue-400" />
                    <span className="whitespace-nowrap text-xs">{blog.readTime}</span>
                  </div>
                  
                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-1.5 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex-shrink-0 ${
                      isLiked
                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                        : isLight
                          ? "bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200"
                          : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {likeLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Heart
                        size={14}
                        className={isLiked ? "fill-current" : ""}
                      />
                    )}
                    <span className="whitespace-nowrap">{likesCount}</span>
                  </button>

                  {/* Author name - on same line, pushed to right */}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                      {blog.author.name.charAt(0)}
                    </div>
                    <p className={`font-bold text-sm ${isLight ? "text-slate-800" : "text-white"}`}>
                      {['admin@example.com', 'superadmin@example.com'].includes(blog.author.email?.toLowerCase()) ? 'InvestBeans' : blog.author.name}
                    </p>
                  </div>
                </div>

              {/* Admin Buttons */}
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className={`px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-all flex items-center gap-1 text-xs lg:text-sm font-bold ${isLight ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-white/10 border border-white/20 text-white hover:bg-white/20"}`}
                  >
                    <Edit2 size={13} />
                    <span className="hidden lg:inline">Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="bg-red-500/20 border border-red-500/30 text-red-500 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-1 text-xs lg:text-sm font-bold disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <Loader2 className="animate-spin" size={13} />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span className="hidden lg:inline">Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            {blog.description && (
              <div className={`mb-8 rounded-xl p-5 border-l-4 border-blue-500 ${isLight ? "bg-blue-50 border border-blue-100" : "bg-white/5 border border-white/10"}`}>
                <h2 className={`text-xl font-bold mb-3 flex items-center gap-2 ${isLight ? "text-slate-800" : "text-white"}`}>
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                  Overview
                </h2>
                <p className={`text-base leading-relaxed ${isLight ? "text-slate-600" : "text-white/70"}`}>
                  {blog.description}
                </p>
              </div>
            )}

            {/* As It Unfolds - Article Content */}
            <div className={`mb-10 rounded-2xl p-6 sm:p-8 ${isLight ? "border border-slate-200 bg-white shadow-sm" : "border border-white/10 bg-white/5 backdrop-blur-sm"}`}>
              <h2 className={`text-3xl font-bold mb-6 flex items-center gap-3 ${isLight ? "text-slate-800" : "text-white"}`}>
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 rounded-full" />
                As It Unfolds
              </h2>
              
              <div className={`prose max-w-none ${isLight ? "prose-slate" : "prose-invert"}`}>
                {/* Main Content */}
                <div
                  className={`leading-relaxed text-base mb-6 ${isLight ? "text-slate-600" : "text-white/70"}`}
                  style={{ lineHeight: '1.8', fontSize: '1rem' }}
                  dangerouslySetInnerHTML={{
                    __html: blog.content.replace(/\n/g, "<br />")
                  }}
                />

                {/* Header Sections integrated as part of article */}
                {blog.headerSections && blog.headerSections.length > 0 && (
                  <div className="mt-8 space-y-8">
                    {blog.headerSections.map(
                      (section: HeaderSection, index: number) => (
                        <div key={index} className="space-y-3">
                          <h2 className={`font-bold leading-tight ${isLight ? "text-slate-800" : "text-white"}`} style={{ fontSize: '1.375rem' }}>
                            {section.header}
                          </h2>
                          <p className={`leading-relaxed text-base ${isLight ? "text-slate-600" : "text-white/70"}`} style={{ lineHeight: '1.8', fontSize: '1rem' }}>
                            {section.subHeader}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Topics - after article content */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mb-8">
                <h3 className={`text-base font-bold mb-3 flex items-center gap-2 ${isLight ? "text-slate-800" : "text-white"}`}>
                  <Tag size={16} className="text-blue-400" />
                  Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:scale-105 cursor-pointer ${isLight ? "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200" : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"}`}
                    >
                      <span className="text-blue-400">#</span>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Previous / Next Blog Navigation */}
            <div className="flex items-center justify-between gap-4 mb-8">
              {prevBlogId ? (
                <button
                  onClick={() => handleNavigateBlog(prevBlogId)}
                  className={`inline-flex items-center gap-2 transition-colors group px-5 py-3 rounded-xl text-sm font-semibold ${isLight ? "text-slate-500 hover:text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200" : "text-white/60 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10"}`}
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Previous Blog
                </button>
              ) : <div />}

              {nextBlogId ? (
                <button
                  onClick={() => handleNavigateBlog(nextBlogId)}
                  className={`inline-flex items-center gap-2 transition-colors group px-5 py-3 rounded-xl text-sm font-semibold ${isLight ? "text-slate-500 hover:text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200" : "text-white/60 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10"}`}
                >
                  Next Blog
                  <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : <div />}
            </div>
          </article>

          {/* Newsletter */}
          <div className={`relative overflow-hidden rounded-[32px] p-8 sm:p-12 text-center mb-12 ${isLight ? "bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-100 shadow-lg shadow-blue-100/50" : "border border-white/10 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/10 backdrop-blur-2xl text-white shadow-[0_30px_90px_-40px_rgba(81,148,246,0.3)]"}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32" />

            {/* ── Success state ── */}
            {nlStatus === "success" ? (
              <div className="relative z-10 py-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isLight ? "bg-green-50 border border-green-200" : "bg-green-500/10 border border-green-500/30"}`}>
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 ${isLight ? "text-slate-800" : "text-white"}`}>
                  You're In!
                </h2>
                <p className={`text-base sm:text-lg mb-4 max-w-2xl mx-auto ${isLight ? "text-slate-500" : "text-white/70"}`}>
                  {nlServerMessage}
                </p>
                <p className={`text-sm ${isLight ? "text-slate-400" : "text-white/50"}`}>
                  Subscribed as <strong className="text-[#5194F6]">{email.trim().toLowerCase()}</strong>
                </p>
              </div>
            ) : (
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isLight ? "bg-blue-100 border border-blue-200" : "bg-white/10 border border-white/20 backdrop-blur-sm"}`}>
                  <Bookmark size={32} className={isLight ? "text-blue-500" : "text-white"} />
                </div>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 ${isLight ? "text-slate-800" : "text-white"}`}>
                  Stay Informed
                </h2>
                <p className={`text-base sm:text-lg lg:text-xl mb-8 max-w-2xl mx-auto ${isLight ? "text-slate-500" : "text-white/70"}`}>
                  Get the latest investment insights delivered straight to your inbox
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={handleNlChange}
                    onBlur={handleNlBlur}
                    onKeyDown={handleNlKeyDown}
                    placeholder="Your email address"
                    disabled={nlStatus === "loading"}
                    style={{ border: nlInputBorder(), transition: "border-color 0.2s ease" }}
                    className={`flex-1 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40 font-medium disabled:opacity-60 ${isLight ? "bg-white text-slate-800 placeholder-slate-400 shadow-sm" : "bg-white/10 text-white placeholder-white/40"}`}
                  />
                  <button
                    onClick={handleNlSubmit}
                    disabled={nlStatus === "loading" || !!nlFieldError}
                    className={`px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${isLight ? "bg-[#5194F6] text-white hover:bg-[#3a7de0] shadow-blue-200" : "bg-white text-slate-900 hover:bg-blue-50"}`}
                  >
                    {nlStatus === "loading" ? (
                      <><Loader2 className="animate-spin" size={16} /> Subscribing…</>
                    ) : "Subscribe"}
                  </button>
                </div>

                {/* Field error */}
                {nlFieldError && (
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-red-400" role="alert">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{nlFieldError}</span>
                  </div>
                )}

                {/* Server error / duplicate */}
                {(nlStatus === "error" || nlStatus === "duplicate") && nlServerMessage && (
                  <div
                    className="flex items-center justify-center gap-1.5 mt-3 text-sm"
                    style={{ color: nlStatus === "duplicate" ? "#f59e0b" : "#ef4444" }}
                    role="alert"
                  >
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{nlServerMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogDetailView;