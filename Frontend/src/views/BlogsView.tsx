import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import AdminBlogForm from '@/components/AdminBlogForm';
import { getAllBlogs, getAdminBlogs, deleteBlog, getBlogById, toggleLike, Blog } from '@/services/blogService';
import { Loader2, Plus, Edit2, Trash2, Search, Tag, Calendar, TrendingUp, Sparkles, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/controllers/AuthContext';
import { useTheme } from '@/controllers/Themecontext';
import { ChevronDown } from "lucide-react";

import axios from 'axios';

// ── Email validation ──────────────────────────────────────────────────────────
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

const BlogsView = () => {
  const { isAdmin, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);

  const [blogs, setBlogs] = useState<Blog[]>(() => {
    // Load from sessionStorage on mount
    const cached = sessionStorage.getItem('blogsCache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        if (age < 5 * 60 * 1000) { // 5 minutes
          return parsed.blogs;
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('selectedCategory') || 'All';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('searchQuery') || '';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const cached = sessionStorage.getItem('currentPage');
    return cached ? parseInt(cached) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    return (sessionStorage.getItem('sortOrder') as 'asc' | 'desc') || 'desc';
  });

  const initialLoadRef = useRef(false);

  // ── Newsletter state ──────────────────────────────────────────────────────
  const API_URL = import.meta.env.VITE_API_URL;
  const [nlEmail, setNlEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<NewsletterStatus>("idle");
  const [nlFieldError, setNlFieldError] = useState<string | null>(null);
  const [nlServerMessage, setNlServerMessage] = useState("");
  const [nlTouched, setNlTouched] = useState(false);

  // Pre-fill if logged in
  useEffect(() => {
    if (user?.email) setNlEmail(user.email);
  }, [user]);

  // Real-time validation after touch
  useEffect(() => {
    if (nlTouched) setNlFieldError(validateEmail(nlEmail));
  }, [nlEmail, nlTouched]);

  const handleNlBlur = () => {
    setNlTouched(true);
    setNlFieldError(validateEmail(nlEmail));
  };

  const handleNlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNlEmail(e.target.value);
    if (nlStatus === "error" || nlStatus === "duplicate") {
      setNlStatus("idle");
      setNlServerMessage("");
    }
  };

  const handleNlSubmit = async () => {
    setNlTouched(true);
    const error = validateEmail(nlEmail);
    setNlFieldError(error);
    if (error) return;

    setNlStatus("loading");
    setNlServerMessage("");
    try {
      const { data } = await axios.post(
        `${API_URL}/subscribe`,
        { email: nlEmail.trim().toLowerCase(), source: "blogs" },
        { withCredentials: true }
      );
      setNlStatus("success");
      setNlServerMessage(data.message);
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
    if (nlFieldError) return isLight ? "1px solid #ef4444" : "1px solid #ef4444";
    if (nlStatus === "success") return "1px solid #22c55e";
    if (nlStatus === "duplicate") return "1px solid #f59e0b";
    return isLight ? "1px solid #bfdbfe" : "1px solid rgba(255,255,255,0.20)";
  };

  const categories = [
    'All',
    'Market Decoded',
    'Behavioral Finance & Psychology',
    'Learning & Financial Literacy',
    "Founder's Lens",
    'Global Pulse',
    'Investbeans Intelligence',
    'Women & Wealth',
    'Investor Stories & Testimonials',
    'Financial Wellness & Mindfulness',
    'Other'
  ];

  useEffect(() => {
    const editBlogId = searchParams.get('edit');
    if (editBlogId && isAdmin) {
      const fetchEditBlog = async () => {
        try {
          const blog = await getBlogById(editBlogId);
          setEditBlog(blog);
          setShowForm(true);
          setTimeout(() => {
            searchParams.delete('edit');
            setSearchParams(searchParams, { replace: true });
          }, 100);
        } catch (error) {
          console.error('Error fetching blog for edit:', error);
          alert('Failed to load blog for editing');
        }
      };
      fetchEditBlog();
    }
  }, [searchParams.get('edit'), isAdmin]);

  const fetchBlogs = async () => {
    // If we have cached blogs and haven't fetched yet, don't show loading
    const hasCachedData = blogs.length > 0 && !initialLoadRef.current;
    
    if (!hasCachedData) {
      setLoading(true);
    }
    
    try {
      const params = {
        search: searchQuery,
        category: selectedCategory === 'All' ? '' : selectedCategory,
        page: currentPage,
        limit: 6,
        sort: sortOrder,
      };

      const response = isAdmin 
        ? await getAdminBlogs(params)
        : await getAllBlogs(params);

      setBlogs(response.blogs);
      setTotalPages(response.pagination.totalPages);
      
      // Save to sessionStorage
      sessionStorage.setItem('blogsCache', JSON.stringify({
        blogs: response.blogs,
        timestamp: Date.now(),
      }));
      sessionStorage.setItem('selectedCategory', selectedCategory);
      sessionStorage.setItem('searchQuery', searchQuery);
      sessionStorage.setItem('currentPage', currentPage.toString());
      sessionStorage.setItem('sortOrder', sortOrder);
      
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have cached data or filters changed
    if (!initialLoadRef.current) {
      if (blogs.length === 0) {
        fetchBlogs();
      }
      initialLoadRef.current = true;
    } else {
      fetchBlogs();
    }
  }, [selectedCategory, searchQuery, currentPage, sortOrder, isAdmin]);

  const handleLike = async (blogId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      alert("Please login to like blogs");
      return;
    }

    // Optimistic update - instant UI change
    setBlogs(prevBlogs => 
      prevBlogs.map(blog => {
        if (blog._id === blogId) {
          const isCurrentlyLiked = blog.likedBy?.includes(user._id);
          return {
            ...blog,
            likes: isCurrentlyLiked ? Math.max(0, blog.likes - 1) : blog.likes + 1,
            likedBy: isCurrentlyLiked 
              ? blog.likedBy.filter(id => id !== user._id)
              : [...(blog.likedBy || []), user._id]
          };
        }
        return blog;
      })
    );

    try {
      await toggleLike(blogId);
    } catch (error) {
      // Rollback on error
      setBlogs(prevBlogs => 
        prevBlogs.map(blog => {
          if (blog._id === blogId) {
            const wasLiked = blog.likedBy?.includes(user._id);
            return {
              ...blog,
              likes: wasLiked ? Math.max(0, blog.likes - 1) : blog.likes + 1,
              likedBy: wasLiked 
                ? blog.likedBy.filter(id => id !== user._id)
                : [...(blog.likedBy || []), user._id]
            };
          }
          return blog;
        })
      );
      
      console.error('Error toggling like:', error);
      const errorMessage = error?.response?.data?.message || "Failed to update like";
      alert(errorMessage);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    setDeleteLoading(blogId);
    try {
      await deleteBlog(blogId);
      sessionStorage.removeItem('blogsCache'); // Clear cache
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditBlog(blog);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditBlog(null);
  };

  const handleFormSuccess = () => {
    sessionStorage.removeItem('blogsCache'); // Clear cache on form success
    fetchBlogs();
  };

  const handleReadMore = (blogId: string) => {
    if (!user) {
      // Save intended destination and redirect to signin
      localStorage.setItem('preAuthPath', `/blogs/${blogId}`);
      navigate('/signin');
      return;
    }
    navigate(`/blogs/${blogId}`);
  };

  const isLikedByUser = (blog: Blog) => {
    return user && blog.likedBy ? blog.likedBy.includes(user._id) : false;
  };

  const featuredBlog = blogs.find(blog => blog.isPublished) || blogs[0];

  return (
    <Layout>
      <div className={`min-h-screen ${isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950/95 text-white"}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.5em] ${isLight ? "text-blue-500" : "text-blue-200/80"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    BLOGS
                  </span>
                </div>
                <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  InvestBeans Journal
                </h1>
                <p className={`text-lg sm:text-xl font-medium mt-2 ${isLight ? "text-slate-500" : "text-blue-100/70"}`}>
                  Where markets, money, and meaning converge
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-4 font-bold text-base text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all"
                >
                  <Plus size={22} />
                  Create Blog
                </button>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className={`mb-10 sm:mb-12 space-y-6 rounded-2xl p-6 ${isLight ? "bg-white border border-slate-200 shadow-sm" : "border border-white/10 bg-white/5 backdrop-blur-2xl"}`}>
          <div className="flex flex-col lg:flex-row gap-4">
  <div className="flex-1 relative group">
    <Search className={`absolute left-5 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-blue-400 ${isLight ? "text-slate-400" : "text-slate-400"}`} size={22} />
    <input
      type="text"
      placeholder="Search blogs by title, description..."
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
      }}
      className={`w-full pl-14 pr-6 py-4 rounded-xl focus:ring-2 focus:ring-blue-500/40 transition-all text-base font-medium focus:outline-none ${isLight ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400" : "bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50"}`}
    />
  </div>

  {/* ✅ Native select hataya — custom dropdown */}
  <div className="relative lg:w-56" ref={dropdownRef}>
    <button
      type="button"
      onClick={() => setIsDropdownOpen((p) => !p)}
      className={`w-full flex items-center justify-between gap-2 px-6 py-4 rounded-xl border font-semibold text-base cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
        isLight
          ? "bg-white border-slate-200 text-slate-700 hover:border-blue-400"
          : "bg-slate-800 border-white/10 text-white hover:border-blue-500/50"
      }`}
    >
      <span>📅 {sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
      <ChevronDown
        size={16}
        className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
      />
    </button>

    {isDropdownOpen && (
      <div className={`absolute z-50 mt-2 w-full rounded-xl border shadow-xl overflow-hidden ${
        isLight
          ? "bg-white border-slate-200 shadow-slate-200/60"
          : "bg-slate-800 border-white/10 shadow-black/40"
      }`}>
        {[
          { value: "desc", label: "📅 Newest First" },
          { value: "asc",  label: "📅 Oldest First"  },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setSortOrder(opt.value as "asc" | "desc");
              setIsDropdownOpen(false);
              setCurrentPage(1);
            }}
            className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
              sortOrder === opt.value
                ? isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/20 text-blue-400"
                : isLight ? "text-slate-700 hover:bg-slate-50" : "text-slate-300 hover:bg-white/5"
            }`}
          >
            {opt.label}
            {sortOrder === opt.value && <span className="float-right text-blue-400">✓</span>}
          </button>
        ))}
      </div>
    )}
  </div>
</div>

            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isLight ? "text-slate-500" : "text-white/60"}`}>
                <Sparkles size={16} className="text-blue-400" />
                Categories
              </h3>
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory -mx-2 px-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setCurrentPage(1);
                      }}
                      className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 snap-start whitespace-nowrap ${
                        selectedCategory === category
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 scale-105'
                          : isLight
                            ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                            : 'bg-white/5 text-white/70 border border-white/15 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className={`animate-spin ${isLight ? "text-blue-500" : "text-blue-400"}`} size={56} />
            </div>
          ) : blogs.length === 0 ? (
            <div className={`text-center py-32 rounded-3xl ${isLight ? "border border-slate-200 bg-white shadow-sm" : "border border-white/10 bg-white/5 backdrop-blur-2xl"}`}>
              <p className={`text-2xl font-semibold ${isLight ? "text-slate-500" : "text-white/60"}`}>🔭 No blogs found</p>
              <p className={`mt-2 ${isLight ? "text-slate-400" : "text-white/40"}`}>Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {featuredBlog && currentPage === 1 && selectedCategory === 'All' && !searchQuery && (
                <div className="mb-10 sm:mb-12">
                  <div className="flex items-center gap-3 mb-5">
                    <TrendingUp size={22} className="text-blue-400" />
                    <h2 className={`text-2xl sm:text-3xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                      Featured Article
                    </h2>
                  </div>
                  
                  <div className={`relative overflow-hidden rounded-[28px] hover:border-blue-500/40 transition-all duration-300 ${isLight ? "border border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.8)]"}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0">
                      <div className="relative h-[400px] lg:h-[400px] cursor-pointer group overflow-hidden " onClick={() => handleReadMore(featuredBlog._id)}>
                        <img src={featuredBlog.blogImage} alt={featuredBlog.title} className="w-full h-full object-cover  group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <div className="p-6 sm:p-7 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                              <Sparkles size={11} />
                              {featuredBlog.category}
                            </span>
                            <span className={`text-xs font-semibold ${isLight ? "text-slate-400" : "text-white/50"}`}>{featuredBlog.readTime}</span>
                            <button
                              onClick={(e) => handleLike(featuredBlog._id, e)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${isLikedByUser(featuredBlog) ? "bg-red-50 text-red-500 hover:bg-red-100" : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                            >
                              <Heart size={11} className={isLikedByUser(featuredBlog) ? "fill-current" : ""} />
                              <span>{featuredBlog.likes}</span>
                            </button>
                            {!featuredBlog.isPublished && (
                              <span className="bg-[#5194F6] text-white px-2.5 py-1 rounded-full text-xs font-bold">Draft</span>
                            )}
                          </div>
                          
                          <h3 onClick={() => handleReadMore(featuredBlog._id)} className={`text-lg sm:text-xl lg:text-2xl font-bold mb-2 cursor-pointer line-clamp-2 leading-tight transition-colors ${isLight ? "text-slate-800 hover:text-blue-600" : "text-white hover:text-blue-200"}`}>
                            {featuredBlog.title}
                          </h3>
                          
                          <p className={`mb-3 text-sm line-clamp-2 leading-relaxed ${isLight ? "text-slate-500" : "text-white/60"}`}>{featuredBlog.description}</p>
                          
                          {featuredBlog.tags && featuredBlog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {featuredBlog.tags.slice(0, 4).map((tag, index) => (
                                <span key={index} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isLight ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-white/5 text-white/70 border border-white/10"}`}>
                                  <Tag size={10} />{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {featuredBlog.author.name.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isLight ? "text-slate-800" : "text-white"}`}>{featuredBlog.author.name}</p>
                              <p className={`text-xs flex items-center gap-1 ${isLight ? "text-slate-400" : "text-white/50"}`}>
                                <Calendar size={11} />
                                {new Date(featuredBlog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {isAdmin ? (
                              <>
                                <button onClick={() => handleEdit(featuredBlog)} className={`flex-1 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold ${isLight ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-white/10 border border-white/20 text-white hover:bg-white/20"}`}>
                                  <Edit2 size={13} />Edit
                                </button>
                                <button onClick={() => handleDelete(featuredBlog._id)} disabled={deleteLoading === featuredBlog._id} className="flex-1 bg-red-500/20 border border-red-500/30 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50">
                                  {deleteLoading === featuredBlog._id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}Delete
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleReadMore(featuredBlog._id)} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-2.5 font-bold text-sm text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all">
                                Read Article →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Articles Grid */}
              <div className="mb-16">
                <h2 className={`text-3xl sm:text-4xl font-bold mb-10 flex items-center gap-3 ${isLight ? "text-slate-800" : "text-white"}`}>
                  <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                  {currentPage === 1 && selectedCategory === 'All' && !searchQuery ? 'Latest Articles' : 'Articles'}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {blogs
                    .filter(blog => !(currentPage === 1 && selectedCategory === 'All' && !searchQuery && blog._id === featuredBlog?._id))
                    .map((post) => (
                      <article
                        key={post._id}
                        className={`relative overflow-hidden rounded-[24px] hover:border-blue-500/40 hover:shadow-[0_20px_60px_-20px_rgba(81,148,246,0.15)] transition-all duration-300 flex flex-col group ${isLight ? "border border-slate-200 bg-white shadow-sm" : "border border-white/10 bg-white/5 backdrop-blur-2xl"}`}
                      >
                        <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => handleReadMore(post._id)}>
                          <img src={post.blogImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="p-6 flex flex-col flex-grow">
                          <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isLight ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-white/10 text-white/80 border border-white/10"}`}>
                              <Sparkles size={12} />
                              {post.category}
                            </span>
                            <span className={`text-xs font-medium ${isLight ? "text-slate-400" : "text-white/40"}`}>{post.readTime}</span>
                            <button
                              onClick={(e) => handleLike(post._id, e)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${isLikedByUser(post) ? "bg-red-500/20 text-red-500" : isLight ? "bg-slate-100 text-slate-400 hover:bg-slate-200" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                            >
                              <Heart size={12} className={isLikedByUser(post) ? "fill-current" : ""} />
                              <span>{post.likes}</span>
                            </button>
                          </div>
                          
                          <h3 onClick={() => handleReadMore(post._id)} className={`text-xl font-bold mb-3 line-clamp-2 hover:text-blue-500 cursor-pointer leading-tight transition-colors ${isLight ? "text-slate-800" : "text-white"}`}>
                            {post.title}
                          </h3>
                          
                          <p className={`text-sm mb-5 line-clamp-3 flex-grow leading-relaxed ${isLight ? "text-slate-500" : "text-white/50"}`}>{post.description}</p>
                          
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                              {post.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${isLight ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-white/5 text-white/50 border border-white/10"}`}>
                                  <Tag size={10} />{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className={`flex items-center justify-between pt-5 border-t ${isLight ? "border-slate-100" : "border-white/10"}`}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {post.author.name.charAt(0)}
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${isLight ? "text-slate-800" : "text-white"}`}>{post.author.name}</p>
                                <p className={`text-xs ${isLight ? "text-slate-400" : "text-white/40"}`}>
                                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            
                            {isAdmin ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleEdit(post)} className={`p-2 rounded-lg transition-colors ${isLight ? "text-slate-400 hover:text-blue-500 hover:bg-blue-50" : "text-white/50 hover:text-blue-400 hover:bg-white/10"}`}>
                                  <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(post._id)} disabled={deleteLoading === post._id} className="text-red-400/70 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg">
                                  {deleteLoading === post._id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => handleReadMore(post._id)} className="text-blue-500 hover:text-blue-600 text-sm font-bold hover:underline">Read →</button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mb-16 flex-wrap">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600" : "border border-white/15 text-white/70 hover:text-white hover:border-white/40"}`}>
                    ← Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${currentPage === page ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 scale-105' : isLight ? 'border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600' : 'border border-white/15 text-white/70 hover:text-white hover:border-white/40'}`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600" : "border border-white/15 text-white/70 hover:text-white hover:border-white/40"}`}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Newsletter */}
          <div className={`relative overflow-hidden top-5 rounded-[32px] p-10 sm:p-14 ${isLight ? "bg-gradient-to-br from-blue-50 via-indigo-50/60 to-blue-50 border border-blue-100 shadow-xl shadow-blue-100/50" : "border border-white/10 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/10 backdrop-blur-2xl text-white shadow-[0_30px_90px_-40px_rgba(81,148,246,0.3)]"}`}>
            {isLight && <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_60%)]" />}
            {!isLight && <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_60%)]" />}

            {/* ── Success state ── */}
            {nlStatus === "success" ? (
              <div className="max-w-3xl mx-auto text-center relative z-10 py-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 mx-auto ${isLight ? "bg-green-50 border border-green-200" : "bg-green-500/10 border border-green-500/30"}`}>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className={`text-3xl sm:text-4xl font-bold mb-3 ${isLight ? "text-slate-800" : "text-white"}`}>You're In!</h2>
                <p className={`text-lg mb-4 ${isLight ? "text-slate-500" : "text-white/70"}`}>{nlServerMessage}</p>
                <p className={`text-sm ${isLight ? "text-slate-400" : "text-white/50"}`}>
                  Subscribed as <strong className="text-[#5194F6]">{nlEmail.trim().toLowerCase()}</strong>
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto text-center relative z-10">
                <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${isLight ? "text-slate-800" : "text-white"}`}>Stay Updated</h2>
                <p className={`text-lg sm:text-xl mb-10 ${isLight ? "text-slate-500" : "text-white/70"}`}>
                  Subscribe to our newsletter for the latest investment insights and market analysis.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                  <input
                    type="email"
                    value={nlEmail}
                    onChange={handleNlChange}
                    onBlur={handleNlBlur}
                    onKeyDown={handleNlKeyDown}
                    placeholder="Enter your email"
                    disabled={nlStatus === "loading"}
                    style={{ border: nlInputBorder(), transition: "border-color 0.2s ease" }}
                    className={`flex-1 px-6 py-5 rounded-xl font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60 ${isLight ? "bg-white text-slate-800 placeholder-slate-400 shadow-sm" : "bg-white/10 text-white placeholder-white/40 backdrop-blur-sm"}`}
                  />
                  <button
                    onClick={handleNlSubmit}
                    disabled={nlStatus === "loading" || !!nlFieldError}
                    className={`px-10 py-5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl text-base hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${isLight ? "bg-[#5194F6] text-white hover:bg-[#3a7de0] shadow-blue-200" : "bg-[#3a7de0] text-slate-900 hover:bg-blue-50"}`}
                  >
                    {nlStatus === "loading" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing…</>
                    ) : "Subscribe"}
                  </button>
                </div>

                {/* Field error */}
                {nlFieldError && (
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-red-400" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{nlServerMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        
        </div>
      </div>

      {showForm && (
        <AdminBlogForm
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          editBlog={editBlog}
        />
      )}
    </Layout>
  );
};

export default BlogsView;