'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, ImagePlus, Star, Trash2, Upload, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

type MediaFile = { file: File; url: string; kind: 'image' | 'video' };

function fileKey(file: File) { return `${file.name}-${file.size}-${file.lastModified}`; }

export function ProductMediaPicker({
  imageFiles,
  videoFiles,
  onImagesChange,
  onVideosChange,
}: {
  imageFiles?: FileList;
  videoFiles?: FileList;
  onImagesChange: (files: FileList) => void;
  onVideosChange: (files: FileList) => void;
}) {
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const imageItems = useMemo<MediaFile[]>(() => Array.from(imageFiles || []).map((file) => ({ file, url: URL.createObjectURL(file), kind: 'image' })), [imageFiles]);
  const videoItems = useMemo<MediaFile[]>(() => Array.from(videoFiles || []).map((file) => ({ file, url: URL.createObjectURL(file), kind: 'video' })), [videoFiles]);

  useEffect(() => () => [...imageItems, ...videoItems].forEach((item) => URL.revokeObjectURL(item.url)), [imageItems, videoItems]);

  const updateFiles = (kind: MediaFile['kind'], files: File[]) => {
    const validTypes = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES;
    const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    const invalid = files.find((file) => !validTypes.includes(file.type) || file.size > maxBytes);
    if (invalid) {
      setError(kind === 'image' ? 'Use JPG, PNG, WebP, or HEIC images up to 25 MB each.' : 'Use MP4, MOV, or WebM videos up to 250 MB each.');
      return;
    }
    setError('');
    const current = kind === 'image' ? Array.from(imageFiles || []) : Array.from(videoFiles || []);
    const merged = [...current, ...files].filter((file, index, all) => all.findIndex((candidate) => fileKey(candidate) === fileKey(file)) === index);
    const transfer = new DataTransfer();
    merged.forEach((file) => transfer.items.add(file));
    if (kind === 'image') onImagesChange(transfer.files);
    else onVideosChange(transfer.files);
  };

  const removeFile = (kind: MediaFile['kind'], index: number) => {
    const files = kind === 'image' ? Array.from(imageFiles || []) : Array.from(videoFiles || []);
    files.splice(index, 1);
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    if (kind === 'image') onImagesChange(transfer.files);
    else onVideosChange(transfer.files);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const files = Array.from(imageFiles || []);
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    [files[index], files[target]] = [files[target], files[index]];
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    onImagesChange(transfer.files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    updateFiles('image', Array.from(event.dataTransfer.files).filter((file) => IMAGE_TYPES.includes(file.type)));
    updateFiles('video', Array.from(event.dataTransfer.files).filter((file) => VIDEO_TYPES.includes(file.type)));
  };

  return (
    <div className="space-y-5">
      <div onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background text-primary"><Upload className="size-5" /></div>
        <p className="mt-3 text-sm font-semibold">Add photos and videos</p>
        <p className="mt-1 text-xs text-muted-foreground">Original quality is accepted. Agora handles optimization after upload.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => imageInput.current?.click()}><ImagePlus className="mr-2 size-4" />Add photos</Button>
          <Button type="button" variant="outline" onClick={() => videoInput.current?.click()}><Video className="mr-2 size-4" />Add videos</Button>
        </div>
        <input ref={imageInput} className="hidden" type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif" capture="environment" onChange={(event) => updateFiles('image', Array.from(event.target.files || []))} />
        <input ref={videoInput} className="hidden" type="file" multiple accept="video/mp4,video/quicktime,video/webm" capture="environment" onChange={(event) => updateFiles('video', Array.from(event.target.files || []))} />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      {imageItems.length === 0 && videoItems.length === 0 && <p className="text-sm text-muted-foreground">Add at least one clear product photo. Square images around 1000 × 1000 px work best.</p>}
      {(imageItems.length > 0 || videoItems.length > 0) && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {imageItems.map((item, index) => <div key={fileKey(item.file)} className="group relative overflow-hidden rounded-lg border bg-background"><img src={item.url} alt={`Product image ${index + 1}`} className="aspect-square w-full object-cover" /><div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 rounded-md bg-black/65 p-1 text-white"><button type="button" className="p-1 disabled:opacity-40" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Move image left"><GripVertical className="size-3.5" /></button>{index === 0 ? <span className="flex items-center gap-1 text-[10px] font-semibold"><Star className="size-3 fill-current" />Main</span> : <span className="text-[10px]">{index + 1}</span>}<button type="button" className="p-1 text-rose-200 hover:text-white" onClick={() => removeFile('image', index)} aria-label="Remove image"><Trash2 className="size-3.5" /></button></div></div>)}
        {videoItems.map((item, index) => <div key={fileKey(item.file)} className="group relative overflow-hidden rounded-lg border bg-black"><video src={item.url} muted preload="metadata" className="aspect-square w-full object-cover" /><div className="absolute inset-x-1 bottom-1 flex items-center justify-between rounded-md bg-black/65 p-1 text-white"><span className="flex items-center gap-1 text-[10px] font-semibold"><Video className="size-3" />Video {index + 1}</span><button type="button" className="p-1 text-rose-200 hover:text-white" onClick={() => removeFile('video', index)} aria-label="Remove video"><Trash2 className="size-3.5" /></button></div></div>)}
      </div>}
    </div>
  );
}
