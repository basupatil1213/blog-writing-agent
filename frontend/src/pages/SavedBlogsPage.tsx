import {
  BookOpen,
  Clock,
  Database,
  Layers,
  Loader2,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { savedBlogsApi } from '@/api/savedBlogsApi';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import type { SavedBlogSummary } from '@/types';

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-brand-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">No saved blogs yet</h3>
      <p className="text-slate-500 text-sm mb-6">
        Generate a blog post and hit <strong>Save</strong> to add it to your library.
      </p>
      <Link
        to="/app"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        <Sparkles className="w-4 h-4" /> Generate your first post
      </Link>
    </div>
  );
}

function BlogCard({
  blog,
  onDelete,
}: {
  blog: SavedBlogSummary;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const date = new Date(blog.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm('Delete this blog?')) return;
    setDeleting(true);
    try {
      await savedBlogsApi.delete(blog.id);
      onDelete(blog.id);
    } catch {
      alert('Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link
      to={`/app/saved/${blog.id}`}
      className="group block rounded-2xl bg-white border border-slate-200 hover:border-brand-200 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-brand-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-brand-700 transition-colors truncate">
              {blog.title}
            </h3>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-shrink-0 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Delete"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 truncate mb-3 pl-[2.625rem]">{blog.topic}</p>

        <div className="flex flex-wrap items-center gap-2 pl-[2.625rem]">
          <StatusBadge type="blog_kind" value={blog.blog_kind as any} />
          <StatusBadge type="mode" value={blog.mode as any} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <Layers className="w-3 h-3" /> {blog.section_count} sections
          </span>
          {blog.evidence_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700">
              <Database className="w-3 h-3" /> {blog.evidence_count} sources
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {date}
        </span>
        {blog.generation_time_ms && (
          <span className="text-xs text-slate-400">
            {(blog.generation_time_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </Link>
  );
}

export function SavedBlogsPage() {
  const [blogs, setBlogs] = useState<SavedBlogSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await savedBlogsApi.list(50);
        setBlogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blogs');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBlogs((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const filtered = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.topic.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Blogs</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {blogs.length} saved post{blogs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            to="/app"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors shadow"
          >
            <Sparkles className="w-4 h-4" /> New blog
          </Link>
        </div>

        {/* Search */}
        {blogs.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or topic…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-sm text-red-600">{error}</div>
        ) : blogs.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-sm text-slate-500">
            No blogs match "{search}".
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((blog) => (
              <BlogCard key={blog.id} blog={blog} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
