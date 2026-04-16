import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, Attachment } from '../data';
import { fileToAttachment, formatFileSize, getFileIcon, inferAttachmentCategory } from '../data';

interface Props {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments'>) => void;
}

export default function CreateTask({ addTask }: Props) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('open');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (nextFiles: FileList | null) => {
    if (!nextFiles) return;
    setFiles((prev) => [...prev, ...Array.from(nextFiles)].slice(0, 8));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    let attachments: Attachment[] = [];

    try {
      attachments = await Promise.all(
        files.map((file, index) => fileToAttachment(file, Date.now() + index))
      );
    } finally {
      setIsSubmitting(false);
    }

    addTask({ title, description, priority, status, assignee: null, attachments });
    navigate('/tasks');
  };

  return (
    <div className="page">
      <div className="page-header page-header-form">
        <div>
          <span className="page-kicker">Task Composer</span>
          <h2 className="page-title">Create a new task</h2>
          <p className="page-subtitle">
            Capture the core details, set the initial priority, and add attachments so the ticket is ready for review.
          </p>
        </div>
      </div>

      <form className="card create-task-card" data-tour="create-form" onSubmit={handleSubmit}>
        <div className="form-group" data-tour="field-title">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>

        <div className="form-group" data-tour="field-description">
          <label htmlFor="desc">Description</label>
          <textarea
            id="desc"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in detail..."
          />
        </div>

        <div className="form-grid-two">
          <div className="form-group" data-tour="field-priority">
            <label htmlFor="priority">Priority</label>
            <select id="priority" className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group" data-tour="field-status">
            <label htmlFor="status">Initial Status</label>
            <select id="status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="attachments">Attachments</label>
          <div className="upload-dropzone">
            <div className="upload-copy">
              <span className="upload-title">Attach files</span>
              <span className="upload-subtitle">Images open in the preview modal, text-like files render inline in the demo.</span>
            </div>
            <label className="btn btn-sm attach-btn" htmlFor="attachments">
              Add files
            </label>
            <input
              id="attachments"
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                handleFileSelect(e.target.files);
                e.currentTarget.value = '';
              }}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.log,.json,.csv,.yaml,.yml,.md"
            />
          </div>

          {files.length > 0 && (
            <div className="selected-files attachment-upload-list">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="selected-file">
                  <span className="selected-file-icon">
                    {getFileIcon(inferAttachmentCategory(file.name, file.type))}
                  </span>
                  <span>{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <button type="button" className="btn-icon-sm" onClick={() => removeFile(index)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate('/tasks')}>Cancel</button>
          <button type="submit" className="btn btn-primary" data-tour="submit-btn" disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? 'Preparing...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
