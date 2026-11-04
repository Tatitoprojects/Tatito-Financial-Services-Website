import { Link, useParams } from 'react-router-dom'
import { formatDate } from '../lib/format'
import { useStore } from '../lib/store'

export function Blog() {
  const { db } = useStore()
  const posts = [...db.blogs].reverse()

  return (
    <>
      <h1>Blog</h1>
      <p className="lead">Plain-language notes on borrowing, investing and everyday money.</p>

      {posts.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <div className="grid">
          {posts.map((post) => (
            <Link className="card" key={post.id} to={`/blog/${post.id}`}>
              <h3 className="card-title">{post.title}</h3>
              <p className="card-text">{post.body.slice(0, 110)}…</p>
              <p className="card-meta">{formatDate(post.date)}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export function BlogPost() {
  const { id } = useParams()
  const { db } = useStore()
  const post = db.blogs.find((item) => item.id === id)

  if (!post) {
    return (
      <>
        <h1>Post not found</h1>
        <p>
          <Link className="link-btn" to="/blog">
            ← All posts
          </Link>
        </p>
      </>
    )
  }

  return (
    <article className="post">
      <Link className="link-btn" to="/blog">
        ← All posts
      </Link>
      <h1>{post.title}</h1>
      <p className="muted">{formatDate(post.date)}</p>
      <div className="post-body">
        {post.body.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </article>
  )
}
