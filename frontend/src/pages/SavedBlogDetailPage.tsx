import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { savedBlogsApi } from '@/api/savedBlogsApi';
import { BlogDisplay } from '@/components/BlogDisplay';
import { Header } from '@/components/Header';
import type { SavedBlogDetail } from '@/types';

export function SavedBlogDetailPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const [blog, setBlog] = useState<SavedBlogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!blogId) return;
    (async () => {
      try {
        const data = await savedBlogsApi.get(blogId);
        setBlog(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [blogId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/app/saved"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Blogs
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-sm text-red-600">{error}</div>
        ) : blog ? (
          <BlogDisplay
            result={{
              title: blog.title,
              blog_kind: blog.blog_kind as any,
              mode: blog.mode as any,
              needs_research: blog.needs_research,
              evidence_count: blog.evidence_count,
              section_count: blog.section_count,
              content: blog.content,
            }}
            elapsedMs={blog.generation_time_ms ?? 0}
            topic={blog.topic}
          />
        ) : null}
      </main>
    </div>
  );
}
