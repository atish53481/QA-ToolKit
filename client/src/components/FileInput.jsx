import { useState, useRef } from 'react';
const col = (active) => ({ flex: 1, border: ('2px solid ' + (active ? '#8b5cf6' : '#e5e7eb')), borderRadius: 8, padding: 16, minWidth: 0 });
const zone = (over) => ({ border: ('2px dashed ' + (over ? '#8b5cf6' : '#d1d5db')), borderRadius: 6, padding: '24px 12px', textAlign: 'center', cursor: 'pointer', background: over ? '#f5f3ff' : 'transparent', marginTop: 12 });

export default function FileInput({ onFileChange }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const ref = useRef();

  const upload = async (f) => {
    setUploading(true); setError(''); setFile(f);
    const fd = new FormData(); fd.append('file', f);
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setPreview(data.text.slice(0, 300)); onFileChange(data.text, data.filename);
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <div style={col(!!file)}>
      <strong style={{ fontSize: 14 }}>Import File</strong>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>PDF - DOCX - XLSX</div>
      <div style={zone(dragging)}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
        onClick={() => ref.current.click()}>
        <div style={{ fontSize: 24 }}>File</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{uploading ? 'Uploading...' : 'Drop file or click to browse'}</div>
        <input ref={ref} type="file" accept=".pdf,.docx,.xlsx" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) upload(e.target.files[0]); }} />
      </div>
      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{error}</div>}
      {preview && <div style={{ marginTop: 10, padding: 8, background: '#faf5ff', borderRadius: 4, fontSize: 11, color: '#6b7280' }}><strong style={{ color: '#7c3aed' }}>{file?.name}</strong><div style={{ marginTop: 4 }}>{preview}...</div></div>}
    </div>
  );
}
