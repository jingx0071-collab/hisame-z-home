'use client';

import { useState, useEffect, useRef } from 'react';

type Sticker = {
  id: number;
  url: string;
  storage_path: string;
  is_gif: boolean;
  added_at: string;
};

type Props = {
  onSelect: (url: string) => void;
  onClose: () => void;
};

async function compressNonGif(file: File): Promise<string> {
  // GIF 不压缩，直接 base64
  if (file.type === 'image/gif') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('read fail'));
      reader.readAsDataURL(file);
    });
  }

  // 其他图片压缩
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas fail'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('img fail'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('read fail'));
    reader.readAsDataURL(file);
  });
}

export default function StickerPicker({ onSelect, onClose }: Props) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStickers = async () => {
    try {
      const res = await fetch('/api/stickers');
      const data = await res.json();
      setStickers(data.stickers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStickers();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('表情包太大了（>8MB）');
      return;
    }
    setUploading(true);
    try {
      const dataUri = await compressNonGif(file);
      const res = await fetch('/api/stickers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: dataUri }),
      });
      const data = await res.json();
      if (data.error) {
        alert('上传失败：' + data.error);
      } else if (data.sticker) {
        setStickers((prev) => [data.sticker, ...prev]);
      }
    } catch (e) {
      alert('上传出错');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/stickers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setStickers((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleStickerClick = (s: Sticker) => {
    if (confirmDelete === s.id) return;
    onSelect(s.url);
  };

  const handleStickerLongPress = (id: number) => {
    setConfirmDelete(id);
  };

  return (
    <>
      <div className="sticker-backdrop" onClick={onClose} />
      <div className="sticker-panel">
        <div className="sticker-panel-header">
          <span>表情包</span>
          <button className="sticker-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="sticker-grid">
          <button
            className="sticker-add"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '...' : '+'}
          </button>

          {loading ? (
            <div className="sticker-loading">载入中……</div>
          ) : (
            stickers.map((s) => (
              <div key={s.id} className="sticker-cell">
                <button
                  className="sticker-img-btn"
                  onClick={() => handleStickerClick(s)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleStickerLongPress(s.id);
                  }}
                >
                  <img src={s.url} alt="" loading="lazy" />
                </button>
                {confirmDelete === s.id && (
                  <div className="sticker-confirm">
                    <button
                      className="sticker-confirm-yes"
                      onClick={() => handleDelete(s.id)}
                    >
                      删除
                    </button>
                    <button
                      className="sticker-confirm-no"
                      onClick={() => setConfirmDelete(null)}
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="sticker-hint">
          点击发送 · 长按删除
        </div>
      </div>
    </>
  );
}
