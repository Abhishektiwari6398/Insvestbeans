import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, Tag, Plus, Trash2 } from 'lucide-react';
import { createBlog, updateBlog, Blog } from '@/services/blogService';
import { useTheme } from '@/controllers/Themecontext';

interface AdminBlogFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editBlog?: Blog | null;
}

interface HeaderSection {
  header: string;
  subHeader: string;
}

const categories = [
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

const AdminBlogForm: React.FC<AdminBlogFormProps> = ({ onClose, onSuccess, editBlog }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    tags: '',
    isPublished: true,
  });
  
  const [headerSections, setHeaderSections] = useState<HeaderSection[]>([
    { header: '', subHeader: '' }
  ]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with editBlog data
  useEffect(() => {
    if (editBlog) {
      setFormData({
        title: editBlog.title || '',
        description: editBlog.description || '',
        content: editBlog.content || '',
        category: editBlog.category || '',
        tags: editBlog.tags?.join(', ') || '',
        isPublished: editBlog.isPublished ?? true,
      });
      
      setHeaderSections(
        editBlog.headerSections && editBlog.headerSections.length > 0
          ? editBlog.headerSections
          : [{ header: '', subHeader: '' }]
      );
      
      setImagePreview(editBlog.blogImage || '');
    }
  }, [editBlog]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleHeaderSectionChange = (index: number, field: 'header' | 'subHeader', value: string) => {
    const newSections = [...headerSections];
    newSections[index][field] = value;
    setHeaderSections(newSections);
  };

  const addHeaderSection = () => {
    setHeaderSections([...headerSections, { header: '', subHeader: '' }]);
  };

  const removeHeaderSection = (index: number) => {
    if (headerSections.length > 1) {
      setHeaderSections(headerSections.filter((_, i) => i !== index));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, blogImage: 'Please select a valid image file' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, blogImage: 'Image size must be less than 2MB' }));
      return;
    }

    setUploadProgress(true);
    setImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setUploadProgress(false);
      setErrors(prev => ({ ...prev, blogImage: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!editBlog && !imageFile) {
      newErrors.blogImage = 'Blog image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('content', formData.content.trim());
      submitData.append('category', formData.category);
      submitData.append('isPublished', String(formData.isPublished));
      submitData.append('tags', formData.tags.trim());
      
      // Filter and send only non-empty header sections
      const validSections = headerSections.filter(
        section => section.header.trim() || section.subHeader.trim()
      );
      submitData.append('headerSections', JSON.stringify(validSections));

      if (imageFile) {
        submitData.append('blogImage', imageFile);
      }

      if (editBlog) {
        await updateBlog(editBlog._id, submitData);
        alert('Blog updated successfully!');
      } else {
        await createBlog(submitData);
        alert('Blog created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving blog:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to save blog';
      setErrors({ submit: errorMessage });
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`relative overflow-hidden rounded-[32px] w-full max-w-4xl my-8 shadow-2xl ${isLight ? "bg-white border border-slate-200" : "border border-white/10 bg-slate-950/95"}`}>
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-[32px]">
          <h2 className="text-2xl font-bold">
            {editBlog ? '✏️ Edit Blog' : '✨ Create New Blog'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all" type="button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {/* Image Upload */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${isLight ? "text-slate-600" : "text-white/70"}`}>📸 Blog Image *</label>
            {imagePreview ? (
              <div className="relative group">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                <button type="button" onClick={removeImage} className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isLight ? "border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/50 bg-slate-50" : "border-white/20 hover:border-blue-400/60 hover:bg-blue-500/5"}`}>
                {uploadProgress ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-400 mb-2" size={40} />
                    <p className={`font-medium ${isLight ? "text-slate-500" : "text-white/60"}`}>Processing image...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className={`mb-3 ${isLight ? "text-slate-300" : "text-white/30"}`} size={48} />
                    <p className={`font-medium mb-1 ${isLight ? "text-slate-600" : "text-white/70"}`}>Click to upload image</p>
                    <p className={`text-sm ${isLight ? "text-slate-400" : "text-white/40"}`}>PNG, JPG, JPEG (max 2MB)</p>
                  </div>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {errors.blogImage && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span> {errors.blogImage}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className={`block text-sm font-semibold mb-2 ${isLight ? "text-slate-600" : "text-white/70"}`}>
                📝 Title * <span className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-white/40"}`}>({formData.title.length}/150)</span>
              </label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} maxLength={150}
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all ${isLight ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white" : "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500/50"}`}
                placeholder="Enter an engaging title" />
              {errors.title && <p className="text-red-400 text-sm mt-1">⚠️ {errors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className={`block text-sm font-semibold mb-2 ${isLight ? "text-slate-600" : "text-white/70"}`}>📂 Category *</label>
              <select id="category" name="category" value={formData.category} onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all cursor-pointer ${isLight ? "bg-white border border-slate-200 text-slate-700 focus:border-blue-400" : "bg-slate-800 border border-white/10 text-white focus:border-blue-500/50"}`}>
                <option value="" style={{background: isLight ? '#fff' : '#1e293b', color: isLight ? '#374151' : '#fff'}}>Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{background: isLight ? '#fff' : '#1e293b', color: isLight ? '#374151' : '#fff'}}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-400 text-sm mt-1">⚠️ {errors.category}</p>}
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isLight ? "text-slate-600" : "text-white/70"}`}>
                <Tag size={16} className="text-blue-400" />Tags (Optional)
              </label>
              <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all ${isLight ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white" : "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500/50"}`}
                placeholder="Investing, Finance, Stocks" />
            </div>
          </div>

          {/* Header Sections */}
          <div className={`rounded-xl p-6 ${isLight ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-white/5"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? "text-slate-800" : "text-white"}`}>📋 Header Sections (Optional)</h3>
              <button type="button" onClick={addHeaderSection} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all text-sm font-medium">
                <Plus size={16} />Add Section
              </button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {headerSections.map((section, index) => (
                <div key={index} className={`p-4 rounded-lg relative ${isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold">Section {index + 1}</span>
                    {headerSections.length > 1 && (
                      <button type="button" onClick={() => removeHeaderSection(index)} className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"><Trash2 size={16} /></button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isLight ? "text-slate-500" : "text-white/60"}`}>Header (H2)</label>
                      <input type="text" value={section.header} onChange={(e) => handleHeaderSectionChange(index, 'header', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none text-sm ${isLight ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400" : "bg-white/5 border border-white/10 text-white placeholder-white/30"}`}
                        placeholder="e.g., How to Choose the Right Tech Field" />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isLight ? "text-slate-500" : "text-white/60"}`}>Content (Paragraph)</label>
                      <textarea value={section.subHeader} onChange={(e) => handleHeaderSectionChange(index, 'subHeader', e.target.value)} rows={3}
                        className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none text-sm resize-none ${isLight ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400" : "bg-white/5 border border-white/10 text-white placeholder-white/30"}`}
                        placeholder="Write the paragraph content for this section..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overview */}
          <div>
            <label htmlFor="description" className={`block text-sm font-semibold mb-2 ${isLight ? "text-slate-600" : "text-white/70"}`}>
              📄 Overview * <span className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-white/40"}`}>({formData.description.length}/500)</span>
            </label>
            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} maxLength={500} rows={3}
              className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all resize-none ${isLight ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white" : "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500/50"}`}
              placeholder="Brief summary of the blog" />
            {errors.description && <p className="text-red-400 text-sm mt-1">⚠️ {errors.description}</p>}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className={`block text-sm font-semibold mb-2 ${isLight ? "text-slate-600" : "text-white/70"}`}>✍️ Content *</label>
            <textarea id="content" name="content" value={formData.content} onChange={handleInputChange} rows={12}
              className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all resize-none ${isLight ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white" : "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500/50"}`}
              placeholder="Write your detailed blog content here..." />
            {errors.content && <p className="text-red-400 text-sm mt-1">⚠️ {errors.content}</p>}
          </div>

          {errors.submit && (
            <div className={`p-4 rounded-lg text-sm font-medium ${isLight ? "bg-red-50 border border-red-200 text-red-600" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
              ⚠️ {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className={`flex gap-4 justify-end pt-6 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
            <button type="button" onClick={onClose}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${isLight ? "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50" : "border border-white/15 text-white/70 hover:text-white hover:border-white/40"}`}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              {loading && <Loader2 className="animate-spin" size={18} />}
              {editBlog ? '💾 Update Blog' : '✨ Create Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBlogForm;