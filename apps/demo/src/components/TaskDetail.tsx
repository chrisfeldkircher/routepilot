import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTourInteractableState } from '@routepilot/react';
import type { Task, Comment, Attachment } from '../data';
import { USERS, formatFileSize, getFileIcon } from '../data';
import { demoState, DEMO_ID } from '../tour/demoState';

interface Props {
  getTask: (id: number) => Task | undefined;
  updateTask: (id: number, patch: Partial<Task>) => void;
  addComment: (taskId: number, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
}

export default function TaskDetail({ getTask, updateTask, addComment }: Props) {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isDemoTask = numericId === DEMO_ID;
  const notifyDemoStateChanged = () => {
    window.dispatchEvent(new CustomEvent('demo-tour:state-changed', { detail: { taskId: DEMO_ID } }));
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('demo-tour:state-changed', handler);
    return () => window.removeEventListener('demo-tour:state-changed', handler);
  }, []);

  const task = isDemoTask && demoState.isActive ? demoState.getTask() : getTask(numericId);

  const demoUi = isDemoTask && demoState.isActive ? demoState.getUi() : null;

  const [newCommentLocal, setNewCommentLocal] = useState('');
  const [assignModalOpenLocal, setAssignModalOpenState] = useState(false);
  const [previewAttachmentLocal, setPreviewAttachment] = useState<Attachment | null>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);

  const newComment = demoUi ? demoUi.commentDraft : newCommentLocal;
  const assignModalOpen = demoUi ? demoUi.assignModalOpen : assignModalOpenLocal;
  const previewAttachment = demoUi && demoUi.previewOpen
    ? (task?.attachments.find((a) => a.id === demoUi.previewAttachmentId) ?? task?.attachments[0] ?? null)
    : previewAttachmentLocal;

  const setNewComment = (value: string) => {
    if (isDemoTask && demoState.isActive) {
      demoState.setCommentDraft(value);
      notifyDemoStateChanged();
    } else {
      setNewCommentLocal(value);
    }
  };

  const { setOpen: setAssignModalOpen } = useTourInteractableState(
    'assign-modal',
    (open) => {
      if (isDemoTask && demoState.isActive) {
        demoState.setAssignModalOpen(open);
        notifyDemoStateChanged();
      } else {
        setAssignModalOpenState(open);
      }
    }
  );
  const { setOpen: setPreviewModalOpen } = useTourInteractableState(
    'preview-modal',
    (open) => {
      if (isDemoTask && demoState.isActive) {
        demoState.setPreviewOpen(open);
        notifyDemoStateChanged();
        return;
      }
      if (open) {
        setPreviewAttachment(task?.attachments[0] ?? null);
        return;
      }
      setPreviewAttachment(null);
    }
  );

  const openLocalPreview = (attachment: Attachment) => {
    if (isDemoTask && demoState.isActive) {
      demoState.setPreviewOpen(true, attachment.id);
      notifyDemoStateChanged();
    } else {
      setPreviewAttachment(attachment);
    }
  };

  if (!task) {
    return <div className="page"><p>Task not found. <Link to="/tasks">Back to list</Link></p></div>;
  }

  const handleStatusChange = (status: Task['status']) => {
    if (isDemoTask) {
      demoState.setStatus(status);
      notifyDemoStateChanged();
    } else {
      updateTask(task.id, { status });
    }
  };

  const handleAssign = (user: string) => {
    if (isDemoTask) {
      demoState.setAssignee(user);
      notifyDemoStateChanged();
    } else {
      updateTask(task.id, { assignee: user });
    }
    setAssignModalOpen(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    if (isDemoTask) {
      demoState.addComment({
        id: Math.floor(Math.random() * 100000),
        author: 'You',
        content: newComment,
        createdAt: new Date().toISOString(),
      });
      demoState.setCommentDraft('');
      notifyDemoStateChanged();
    } else {
      addComment(task.id, { author: 'You', content: newComment });
      setNewCommentLocal('');
    }
    setCommentFiles([]);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 8 - commentFiles.length);
    setCommentFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const renderAttachmentItem = (a: Attachment, tourAttr?: string) => (
    <div
      key={a.id}
      className="attachment-item"
      data-tour={tourAttr}
      onClick={() => openLocalPreview(a)}
    >
      <span className="attachment-icon">{getFileIcon(a.category)}</span>
      <div className="attachment-info">
        <span className="attachment-name">{a.name}</span>
        <span className="attachment-meta">{formatFileSize(a.size)} · {a.category}</span>
      </div>
      <button
        className="btn-icon"
        data-tour={tourAttr ? `${tourAttr}-preview` : undefined}
        onClick={(e) => { e.stopPropagation(); openLocalPreview(a); }}
        title="Preview"
      >
        👁
      </button>
    </div>
  );

  return (
    <div className="page">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tasks" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>← Back to Tasks</Link>
      </div>

      <div data-tour="task-header" style={{ marginBottom: '1.5rem' }}>
        <h2>{task.title}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button className="btn btn-sm btn-primary" data-tour="assign-btn" onClick={() => setAssignModalOpen(true)}>
            {task.assignee ? 'Reassign' : 'Assign'}
          </button>
          <button className="btn btn-sm" data-tour="edit-btn">Edit</button>
        </div>
      </div>

      <div data-tour="status-bar" className="status-bar">
        {(['open', 'in-progress', 'review', 'done'] as const).map((s) => (
          <button
            key={s}
            className={`status-btn ${task.status === s ? 'active' : ''}`}
            data-tour={`status-${s}`}
            onClick={() => handleStatusChange(s)}
          >
            {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="detail-grid">
        <div>
          <div className="card" data-tour="task-description">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Description</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{task.description}</p>
          </div>

          {task.attachments.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }} data-tour="attachments-section">
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                📎 Attachments ({task.attachments.length})
              </h3>
              <div className="attachment-list">
                {task.attachments.map((a, i) =>
                  renderAttachmentItem(a, i === 0 ? 'first-attachment' : undefined)
                )}
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: '1rem' }} data-tour="comments-section">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Comments ({task.comments.length})
            </h3>
            {task.comments.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No comments yet.</p>
            )}
            {task.comments.map((c, i) => (
              <div
                key={c.id}
                className="comment-box"
                data-tour={i === task.comments.length - 1 ? 'latest-comment' : undefined}
              >
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  <span className="comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ marginTop: '0.375rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.content}</p>
                {c.attachments && c.attachments.length > 0 && (
                  <div className="comment-attachments" data-tour={i === task.comments.length - 1 ? 'comment-attachments' : undefined}>
                    {c.attachments.map((a) => (
                      <div key={a.id} className="comment-attachment-badge" onClick={() => openLocalPreview(a)}>
                        {getFileIcon(a.category)} {a.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div style={{ marginTop: '1rem' }} data-tour="comment-form">
              <textarea
                className="form-textarea"
                data-tour="comment-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ minHeight: '70px' }}
              />

              {commentFiles.length > 0 && (
                <div className="selected-files">
                  {commentFiles.map((f, i) => (
                    <div key={i} className="selected-file">
                      <span>{f.name}</span>
                      <span className="file-size">{formatFileSize(f.size)}</span>
                      <button className="btn-icon-sm" onClick={() => removeFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <label className="btn btn-sm attach-btn" data-tour="attach-files-btn">
                  <input
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.log,.json,.csv,.yaml,.md"
                  />
                  📎 Attach files
                </label>
                <button
                  className="btn btn-primary btn-sm"
                  data-tour="comment-submit"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card" data-tour="task-sidebar">
            <dl>
              <dt>Status</dt>
              <dd><span className={`badge badge-${task.status === 'in-progress' ? 'progress' : task.status}`}>{task.status}</span></dd>

              <dt>Priority</dt>
              <dd data-tour="task-priority"><span className={`badge badge-${task.priority}`}>{task.priority}</span></dd>

              <dt>Assignee</dt>
              <dd data-tour="task-assignee">
                {task.assignee ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
              </dd>

              <dt>Created</dt>
              <dd>{new Date(task.createdAt).toLocaleDateString()}</dd>
            </dl>
          </div>
        </div>
      </div>

      {assignModalOpen && (
        <div className="modal-backdrop" onClick={() => setAssignModalOpen(false)}>
          <div className="modal" data-tour="assign-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Task</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Select a team member to assign this task to.
            </p>
            {USERS.map((user) => (
              <button
                key={user}
                className="btn"
                data-tour={`assign-user-${user.split(' ')[0].toLowerCase()}`}
                style={{ width: '100%', marginBottom: '0.5rem', justifyContent: 'flex-start' }}
                onClick={() => handleAssign(user)}
              >
                {user}
                {task.assignee === user && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--primary)' }}>Current</span>}
              </button>
            ))}
            <button className="btn" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setAssignModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {previewAttachment && (
        <div className="modal-backdrop" onClick={() => setPreviewModalOpen(false)}>
          <div className="preview-modal" data-tour="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <div className="preview-file-info">
                <span className="preview-icon">{getFileIcon(previewAttachment.category)}</span>
                <div>
                  <span className="preview-name">{previewAttachment.name}</span>
                  <span className="preview-meta">{formatFileSize(previewAttachment.size)} · {previewAttachment.category}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {previewAttachment.category !== 'image' && (
                  <button
                    className="btn btn-sm"
                    data-tour="preview-copy-btn"
                    onClick={() => navigator.clipboard.writeText(previewAttachment.content)}
                  >
                    📋 Copy
                  </button>
                )}
                <button className="btn btn-sm" onClick={() => setPreviewModalOpen(false)}>✕ Close</button>
              </div>
            </div>
            <div className="preview-content">
              {previewAttachment.category === 'image' ? (
                <div className="preview-image-container">
                  <img src={previewAttachment.content} alt={previewAttachment.name} className="preview-image" />
                </div>
              ) : (
                <pre className="preview-text" data-tour="preview-text-content">{previewAttachment.content}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
