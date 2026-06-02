import React, { useState, useRef, DragEvent } from 'react';
import {
  FolderOpen,
  FileCheck,
  AlertCircle,
  UploadCloud,
  HelpCircle as QuestionIcon,
} from 'lucide-react';
import { processImportedAssets } from '../utils/assetImport';
import type { ProcessedMMDFiles } from '../utils/mmdFiles';

interface FileUploaderProps {
  onModelLoaded: (data: ProcessedMMDFiles | ProcessedMMDFiles[]) => void;
}

export default function FileUploader({ onModelLoaded }: FileUploaderProps) {
  const [activeTab, setActiveTab] = useState<'folder' | 'zip'>('folder');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const emitLoaded = (models: ProcessedMMDFiles[], fileCount: number) => {
    const first = models[0];
    const vmdTotal = models.reduce((n, m) => n + m.vmdBlobUrls.length, 0);
    const camNote = models.some((m) => m.hasCameraVmd) ? ' + camera VMD' : '';
    const multiNote = models.length > 1 ? ` (${models.length} characters)` : '';
    const vmdNote = vmdTotal > 0 ? ` + ${vmdTotal} VMD` : '';
    setSuccess(
      `Loaded "${first?.name ?? 'model'}"${multiNote} — ${fileCount} files${vmdNote}${camNote}. Press PLAY if motion did not start.`
    );
    onModelLoaded(models.length === 1 ? models[0]! : models);
  };

  const runImport = async (files: File[]) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await processImportedAssets(files);
      if ('error' in result) {
        throw new Error(result.error);
      }
      if (result.kind === 'hdr_only') {
        throw new Error('HDR only — drop into the 3D viewport for environment lighting.');
      }
      if (result.kind === 'vmd_only') {
        throw new Error('VMD only — load a .pmx/.pmd model first, then add motions.');
      }
      if (result.skippedFormats.length > 0) {
        console.warn('[Import] Skipped:', result.skippedFormats.join(', '));
      }
      emitLoaded(result.models, files.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processFolderFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await runImport(Array.from(files));
  };

  const processZipFile = async (file: File) => {
    if (!file) return;
    await runImport([file]);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);

    if (!e.dataTransfer.files?.length) return;

    const file = e.dataTransfer.files[0];
    if (file.name.endsWith('.zip')) {
      setActiveTab('zip');
      void processZipFile(file);
    } else {
      setError("To upload an uncompressed folder, use 'Choose Folder' for browser directory selection.");
    }
  };

  return (
    <div className="bg-[#ece9d8] border-2 border-t-[#fff] border-l-[#fff] border-b-[#808080] border-r-[#808080] p-3 space-y-3 font-sans" id="mmd-file-uploader">
      <div className="flex bg-[#d4d0c8] p-0.5 gap-1 border border-[#808080]">
        <button
          onClick={() => { setActiveTab('folder'); setError(null); }}
          className={`flex-1 py-1 text-[11px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'folder'
              ? 'bg-[#ece9d8] border-t-white border-l-white border-b-transparent border-r-[#808080] pt-1.5 pb-2 -mb-1 z-10'
              : 'bg-[#d4d0c8] border-transparent text-zinc-650 hover:bg-[#ece9d8]/60'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Directory Folder
        </button>
        <button
          onClick={() => { setActiveTab('zip'); setError(null); }}
          className={`flex-1 py-1 text-[11px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'zip'
              ? 'bg-[#ece9d8] border-t-white border-l-white border-b-transparent border-r-[#808080] pt-1.5 pb-2 -mb-1 z-10'
              : 'bg-[#d4d0c8] border-transparent text-zinc-650 hover:bg-[#ece9d8]/60'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          ZIP Archive
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all min-h-[140px] cursor-pointer ${
          dragging ? 'border-blue-700 bg-blue-100/40 text-blue-900' : 'border-[#808080] bg-white hover:bg-zinc-50'
        }`}
        onClick={() => {
          if (activeTab === 'folder') folderInputRef.current?.click();
          else zipInputRef.current?.click();
        }}
      >
        <input
          type="file"
          ref={folderInputRef}
          className="hidden"
          onChange={(e) => void processFolderFiles(e.target.files)}
          {...({ webkitdirectory: '', directory: '', multiple: true } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        <input
          type="file"
          ref={zipInputRef}
          className="hidden"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void processZipFile(f);
            e.target.value = '';
          }}
        />

        {loading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-pink-650 border-t-transparent animate-spin rounded-full" />
            <p className="text-xs font-bold text-zinc-700">Processing files…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-2 bg-[#f0f0ff] rounded-none inline-block border border-blue-200">
              {activeTab === 'folder' ? (
                <FolderOpen className="w-6 h-6 text-blue-700" />
              ) : (
                <UploadCloud className="w-6 h-6 text-sky-600" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-extrabold text-[#000080] hover:underline">
                {activeTab === 'folder' ? 'CHOOSE MODEL DIRECTORY' : 'SELECT .ZIP ARCHIVE'}
              </p>
              <p className="text-[9px] text-zinc-500 font-bold leading-tight">
                {activeTab === 'folder'
                  ? 'Up to 4× .pmx/.pmd + .vmd + textures (duo spacing auto)'
                  : 'ZIP with models, VMD, textures — multi-character OK'}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-100 border border-red-300 flex items-start gap-1.5 text-[10px] text-red-800 font-bold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-2 bg-emerald-50 border border-emerald-300 flex items-start gap-1.5 text-[10px] text-emerald-800 font-bold">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="text-[9px] text-zinc-500 leading-normal border-t border-zinc-300 pt-2 flex items-center gap-1">
        <QuestionIcon className="w-3 h-3 text-zinc-400" />
        <span>
          .pmx .pmd .vmd .zip · textures .png .jpg .tga … · map: .glb .gltf .obj (ingest only)
        </span>
      </div>
    </div>
  );
}
