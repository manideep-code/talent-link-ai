import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

const FileUpload = ({ 
  label, 
  accept = '*',
  onChange, 
  value, 
  preview = false,
  helperText = '',
  required = false
}) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getFileName = () => {
    if (value instanceof File) {
      return value.name;
    }
    if (typeof value === 'string') {
      return value.split('/').pop();
    }
    return '';
  };

  const getPreviewUrl = () => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    return '';
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />
        
        <button
          onClick={() => inputRef.current?.click()}
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
        >
          <Upload size={20} className="text-indigo-600" />
          <div className="text-left">
            <p className="text-sm font-medium text-gray-700">
              {getFileName() ? `Selected: ${getFileName()}` : 'Click to upload or drag and drop'}
            </p>
            {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
          </div>
        </button>
      </div>

      {preview && getPreviewUrl() && value instanceof File && value.type.startsWith('image/') && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={getPreviewUrl()}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleClear}
            type="button"
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {value && value !== '' && (
        <button
          onClick={handleClear}
          type="button"
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Remove file
        </button>
      )}
    </div>
  );
};

export default FileUpload;

