import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from '../../lib/translations';

interface FileWithPreview extends File {
  preview?: string;
}

interface DocumentUploaderProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

export default function DocumentUploader({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'],
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const t = useTranslation();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    },
    [files, maxFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes.reduce((acc, type) => {
      const mimeType = type === '.pdf' ? { 'application/pdf': [] } :
                      type === '.doc' || type === '.docx' ? { 'application/msword': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] } :
                      type === '.txt' ? { 'text/plain': [] } :
                      type === '.xls' || type === '.xlsx' ? { 'application/vnd.ms-excel': [], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [] } :
                      { [type]: [] };
      return { ...acc, ...mimeType };
    }, {}),
  });

  const removeFile = (e: React.MouseEvent, fileToRemove: FileWithPreview) => {
    e.preventDefault();
    e.stopPropagation();
    
    const updatedFiles = files.filter((file) => file !== fileToRemove);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
    
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Safely get translation with fallback
  const getTranslation = (key: string, params?: Record<string, string>) => {
    try {
      const translation = t(key);
      if (params && translation) {
        return Object.entries(params).reduce(
          (str, [key, value]) => str.replace(`{${key}}`, value),
          translation
        );
      }
      return translation || key;
    } catch (error) {
      return key;
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
        } ${isDragReject ? 'border-error-500 bg-error-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <UploadCloud
            size={36}
            className={`mb-3 ${
              isDragActive ? 'text-primary-500' : 'text-gray-400'
            }`}
          />
          <p className="text-base text-gray-700">
            {isDragActive
              ? getTranslation('dropFilesHere')
              : getTranslation('dragAndDrop')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {getTranslation('maxFiles', { count: maxFiles.toString() })} {formatFileSize(maxSize)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {getTranslation('acceptedFileTypes')}: {acceptedFileTypes.join(', ')}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {getTranslation('selectedFiles')} ({files.length}/{maxFiles})
          </h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary-100 rounded-md text-primary-700 mr-3">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => removeFile(e, file)}
                  className="text-gray-500 hover:text-error-500"
                  aria-label={getTranslation('removeFile')}
                >
                  <X size={16} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { DocumentUploader }