"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, ExternalLink, Save, Edit3 } from 'lucide-react';
import { getScreenshotUrl, getPageDisplayName } from '@/lib/report-utils';
import type { Screenshot } from '@/types';
import type { ScreenshotModalProps, EditScreenshotData } from '../../types';

export function ScreenshotModal({
  screenshot,
  isOpen,
  onClose,
  mode,
  onSave
}: ScreenshotModalProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [editData, setEditData] = useState<EditScreenshotData>({
    url: '',
    customPageName: ''
  });

  // Initialize edit data when screenshot changes
  useEffect(() => {
    if (screenshot) {
      setEditData({
        url: screenshot.url,
        customPageName: screenshot.data?.customPageName || ''
      });
    }
  }, [screenshot]);

  // Reset editing state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsEditing(mode === 'edit');
    }
  }, [isOpen, mode]);

  if (!isOpen || !screenshot) return null;

  const handleSave = () => {
    if (!onSave) return;

    const updatedScreenshot: Screenshot = {
      ...screenshot,
      url: editData.url,
      data: {
        ...screenshot.data,
        customPageName: editData.customPageName.trim() || undefined
      }
    };

    onSave(updatedScreenshot);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setEditData({
      url: screenshot.url,
      customPageName: screenshot.data?.customPageName || ''
    });
    setIsEditing(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const imageUrl = getScreenshotUrl(screenshot, ''); // You may need to pass captureJobId here
  const displayName = getPageDisplayName(screenshot.url, screenshot.data?.customPageName);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {isEditing ? (
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="page-name" className="text-sm font-medium">
                    Page Name (Optional)
                  </Label>
                  <Input
                    id="page-name"
                    value={editData.customPageName}
                    onChange={(e) => setEditData(prev => ({ ...prev, customPageName: e.target.value }))}
                    placeholder="Enter custom page name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="page-url" className="text-sm font-medium">
                    Page URL
                  </Label>
                  <Input
                    id="page-url"
                    value={editData.url}
                    onChange={(e) => setEditData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/page"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-slate-900 truncate">
                  {displayName}
                </h2>
                <p className="text-slate-600 truncate mt-1">
                  {screenshot.url}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {/* External link button */}
            {!isEditing && screenshot.url.startsWith('http') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(screenshot.url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            )}
            
            {/* Edit/Save/Cancel buttons */}
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            ) : (
              onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )
            )}
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image Content */}
        <div className="flex-1 overflow-auto p-6">
          {screenshot.success && screenshot.data?.path ? (
            <div className="flex justify-center">
              <img 
                src={imageUrl}
                alt={displayName}
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: 'calc(90vh - 200px)' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div 
                className="hidden flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-lg p-12"
                style={{ minHeight: '300px' }}
              >
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Image not available</p>
                <p className="text-sm mt-1">The screenshot could not be loaded</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-lg p-12">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">Screenshot not available</p>
              <p className="text-sm mt-1">
                {screenshot.success ? 'No image path found' : 'Screenshot capture failed'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}