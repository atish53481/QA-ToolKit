import { useState, useRef } from 'react';
const col = (active) => ({ flex: 1, border: ('2px solid ' + (active ? '#f59e0b' : '#e5e7eb')), borderRadius: 8, padding: 16, minWidth: 0 });
const zone = (over) => ({ border: ('2px dashed ' + (over ? '#f59e0b' : '#d1d5db')), borderRadius: 6, padding: '24px 12px', textAlign: 'center', cursor: 'pointer', background: over ? '#fffbeb' : 'transparent', marginTop: 12 });

export default function ScreenshotInput({ onScreenshotChange }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const ref = useRef();

  const load = (f) => {
    const reader = new FileReader();
    reader.onload = e => { setPreview(e.target.result); onScreenshotChange(e.target.result); };
    reader.readAsDataURL(f);
  };

  return (
    <div style={col(!!preview)}>
      <strong style={{ fontSize: 14 }}>Screenshot</strong>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>PNG - JPG — for Bug Report</div>
      <div style={zone(dragging)}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) load(f); }}
        onClick={() => ref.current.click()}>
        {preview
          ? <img src={preview} alt="screenshot" style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4 }} />
          : <><div style={{ fontSize: 24 }}>Image</div><div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Drop screenshot or click to browse</div></>}
        <input ref={ref} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) load(e.target.files[0]); }} />
      </div>
    </div>
  );
}
