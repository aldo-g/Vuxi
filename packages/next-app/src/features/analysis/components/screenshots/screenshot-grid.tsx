"use client";

import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { getScreenshotUrl, getPageDisplayName } from '@/lib/report-utils';
import type { Screenshot } from '@/types';

interface ScreenshotGridProps {
  screenshots: Screenshot[];
  captureJobId: string;
  onScreenshotClick: (index: number) => void;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
  onAddClick: () => void;
}

export function ScreenshotGrid({
  screenshots,
  captureJobId,
  onScreenshotClick,
  onEditClick,
  onDeleteClick,
  onAddClick
}: ScreenshotGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {screenshots.map((screenshot, index) => {
        const imageUrl = getScreenshotUrl(screenshot, captureJobId);
        const pageName = getPageDisplayName(screenshot.url, screenshot.data?.customPageName);
        
        return (
          <ScreenshotCard
            key={index}
            screenshot={screenshot}
            imageUrl={imageUrl}
            pageName={pageName}
            index={index}
            onScreenshotClick={onScreenshotClick}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        );
      })}
      
      <AddScreenshotCard onAddClick={onAddClick} />
    </div>
  );
}

interface ScreenshotCardProps {
  screenshot: Screenshot;
  imageUrl: string;
  pageName: string;
  index: number;
  onScreenshotClick: (index: number) => void;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
}

function ScreenshotCard({
  screenshot,
  imageUrl,
  pageName,
  index,
  onScreenshotClick,
  onEditClick,
  onDeleteClick
}: ScreenshotCardProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group relative">
      {/* URL Title */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (screenshot.url.startsWith('http')) {
                window.open(screenshot.url, '_blank', 'noopener,noreferrer');
              }
            }}
            disabled={!screenshot.url.startsWith('http')}
            className={`flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center transition-all ${
              screenshot.url.startsWith('http')
                ? 'hover:bg-blue-200 hover:scale-105 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            title={
              screenshot.url.startsWith('http')
                ? `Open ${screenshot.url} in new tab`
                : 'No valid URL available'
            }
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 text-sm leading-tight">
              {pageName}
            </h3>
          </div>
        </div>
      </div>

      {/* Screenshot Image */}
      <div 
        className="aspect-video bg-slate-100 relative flex items-center justify-center cursor-pointer"
        onClick={() => onScreenshotClick(index)}
      >
        {imageUrl ? (
          <>
            <img 
              src={imageUrl}
              alt={`Screenshot of ${screenshot.url}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                      <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span class="text-sm text-center">Image Not Available</span>
                    </div>
                  `;
                }
              }}
            />
            {/* View overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-slate-700">Click to view full size</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No preview available</span>
          </div>
        )}

        {/* Custom indicator */}
        {screenshot.success && screenshot.data?.isCustom && (
          <div className="absolute top-3 left-3 bg-green-100 border border-green-200 rounded-full px-2 py-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-700 font-medium">Custom</span>
          </div>
        )}
      </div>

      {/* Footer with URL and Actions */}
      <div className="p-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Globe className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-600 font-mono break-all leading-relaxed">
              {screenshot.url}
            </span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(index);
              }}
              className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all"
              title="Replace screenshot"
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(index);
              }}
              className="w-7 h-7 bg-white border border-red-200 rounded-md flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all"
              title="Delete screenshot"
            >
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddScreenshotCard({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div 
      className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer group"
      onClick={onAddClick}
    >
      {/* Add Title */}
      <div className="p-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-slate-200 group-hover:bg-slate-300 rounded-lg flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-600 group-hover:text-slate-700 text-sm leading-tight transition-colors">
              Add Screenshot
            </h3>
          </div>
        </div>
      </div>

      {/* Add Content */}
      <div className="aspect-video flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-500 transition-colors">
          <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Upload Screenshot</span>
          <span className="text-xs mt-1">Click to select image</span>
        </div>
      </div>

      {/* Footer for consistency */}
      <div className="p-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <Globe className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-slate-500 font-mono break-all leading-relaxed">
            Add new page...
          </span>
        </div>
      </div>
    </div>
  );
}