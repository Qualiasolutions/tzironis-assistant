"use client";

import { useState, FormEvent, useRef, ChangeEvent, useEffect } from "react";
import axios from "axios";
import { Brain, Check, Loader2, RefreshCw, Send, FileUp, List, Trash2 } from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";
import { useSession } from "next-auth/react";

interface Source {
  url?: string;
  filename?: string;
  type: string;
}

export default function KnowledgePage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState("https://tzironis.gr");
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(3);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<any>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  
  // Query state
  const [isQuerying, setIsQuerying] = useState(false);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<{
    answer: string;
    sources: Array<{ url?: string; filename?: string; title: string; type: string; similarity: number }>;
  } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Sources state
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  // Handle crawl form submission
  const handleCrawlSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setIsCrawling(true);
    setCrawlResult(null);
    setCrawlError(null);
    
    try {
      const response = await axios.post("/api/knowledge-base/crawl", {
        url: crawlUrl,
        maxPages,
        maxDepth,
      });
      
      setCrawlResult(response.data);
      loadSources(); // Refresh sources after crawling
    } catch (error: any) {
      console.error("Error crawling website:", error);
      setCrawlError(
        error.response?.data?.error || 
        error.message || 
        "An unknown error occurred"
      );
    } finally {
      setIsCrawling(false);
    }
  };
  
  // Handle query form submission
  const handleQuerySubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsQuerying(true);
    setQueryResult(null);
    setQueryError(null);
    
    try {
      const response = await axios.post("/api/knowledge-base/query", {
        query,
        limit: 5,
      });
      
      setQueryResult(response.data);
    } catch (error: any) {
      console.error("Error querying knowledge base:", error);
      setQueryError(
        error.response?.data?.error || 
        error.message || 
        "An unknown error occurred"
      );
    } finally {
      setIsQuerying(false);
    }
  };
  
  // Handle file upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadResult(null);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/knowledge-base/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult(response.data);
      loadSources(); // Refresh sources after upload
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setUploadError(
        error.response?.data?.error || 
        error.message || 
        "An unknown error occurred"
      );
    } finally {
      setIsUploading(false);
    }
  };
  
  // Load sources
  const loadSources = async () => {
    setIsLoadingSources(true);
    
    try {
      const response = await axios.get('/api/knowledge-base/sources');
      setSources(response.data.sources || []);
    } catch (error: any) {
      console.error("Error loading sources:", error);
    } finally {
      setIsLoadingSources(false);
    }
  };
  
  // Clear knowledge base
  const clearKnowledgeBase = async () => {
    if (!confirm(t("kbClearConfirm"))) return;
    
    setIsClearing(true);
    setClearError(null);
    
    try {
      await axios.delete('/api/knowledge-base/clear');
      loadSources(); // Refresh sources after clearing
    } catch (error: any) {
      console.error("Error clearing knowledge base:", error);
      setClearError(
        error.response?.data?.error || 
        error.message || 
        "An unknown error occurred"
      );
    } finally {
      setIsClearing(false);
    }
  };
  
  // Load sources on initial render
  useEffect(() => {
    loadSources();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">
            {t("navKnowledgeBase")}
          </h1>
        </div>
        
        {/* Knowledge Base Sources */}
        <div className="rounded-lg border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t("kbSourcesTitle")}</h2>
            <div className="flex gap-2">
              <button
                onClick={loadSources}
                disabled={isLoadingSources}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
              >
                {isLoadingSources ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t("kbRefresh")}
              </button>
              
              {session && (
                <button
                  onClick={clearKnowledgeBase}
                  disabled={isClearing}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {t("kbClear")}
                </button>
              )}
            </div>
          </div>
          
          {clearError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-red-600">
              <p>{clearError}</p>
            </div>
          )}
          
          <div className="border rounded-md">
            {isLoadingSources ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                {t("kbLoadingSources")}
              </div>
            ) : sources.length > 0 ? (
              <ul className="divide-y">
                {sources.map((source, index) => (
                  <li key={index} className="p-3 flex items-center justify-between">
                    <div>
                      {source.type === 'web' ? (
                        <a 
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          <List className="h-4 w-4 mr-2" />
                          {source.url}
                        </a>
                      ) : (
                        <div className="flex items-center text-gray-700">
                          <FileUp className="h-4 w-4 mr-2" />
                          {source.filename}
                        </div>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {source.type === 'web' ? t("kbSourceWeb") : t("kbSourceFile")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {t("kbNoSources")}
              </div>
            )}
          </div>
        </div>
        
        {/* Website Crawler */}
        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t("kbCrawlerTitle")}</h2>
          <p className="text-gray-600 mb-6">
            {t("kbCrawlerDesc")}
          </p>
          
          <form onSubmit={handleCrawlSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("kbUrlLabel")}
              </label>
              <input
                type="url"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("kbMaxPagesLabel")}
                </label>
                <input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  min={1}
                  max={200}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("kbMaxDepthLabel")}
                </label>
                <input
                  type="number"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  min={1}
                  max={5}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCrawling}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-accent disabled:opacity-50"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("kbCrawling")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {t("kbStartCrawling")}
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Crawl results */}
          {crawlError && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-red-600">
              <p className="font-medium">{t("kbError")}</p>
              <p>{crawlError}</p>
            </div>
          )}
          
          {crawlResult && (
            <div className="mt-4 rounded-md bg-green-50 p-4 text-green-600">
              <div className="flex items-center gap-2 font-medium">
                <Check className="h-5 w-5" />
                <p>{crawlResult.message}</p>
              </div>
              <ul className="mt-2 list-inside list-disc">
                <li>{t("pagesProcessed")}: {crawlResult.pagesProcessed}</li>
                <li>{t("chunksStored")}: {crawlResult.chunksStored}</li>
              </ul>
            </div>
          )}
        </div>
        
        {/* File Upload */}
        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t("kbUploadTitle")}</h2>
          <p className="text-gray-600 mb-6">
            {t("kbUploadDesc")}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("kbFileLabel")}
              </label>
              <div className="flex items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".txt,.md,.json,.csv"
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-accent disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("kbUploading")}
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4" />
                      {t("kbSelectFile")}
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t("kbFileTypes")}
              </p>
            </div>
          </div>
          
          {/* Upload results */}
          {uploadError && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-red-600">
              <p className="font-medium">{t("kbError")}</p>
              <p>{uploadError}</p>
            </div>
          )}
          
          {uploadResult && (
            <div className="mt-4 rounded-md bg-green-50 p-4 text-green-600">
              <div className="flex items-center gap-2 font-medium">
                <Check className="h-5 w-5" />
                <p>{uploadResult.message}</p>
              </div>
              <ul className="mt-2 list-inside list-disc">
                <li>{t("kbFileName")}: {uploadResult.filename}</li>
                <li>{t("chunksStored")}: {uploadResult.chunksStored}</li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Knowledge Base Query */}
        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t("kbQueryTitle")}</h2>
          <p className="text-gray-600 mb-6">
            {t("kbQueryDesc")}
          </p>
          
          <form onSubmit={handleQuerySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("kbQuestion")}
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What services does Tzironis offer?"
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isQuerying || !query.trim()}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-accent disabled:opacity-50"
              >
                {isQuerying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("kbSearching")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("kbSearch")}
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Query results */}
          {queryError && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-red-600">
              <p className="font-medium">{t("kbError")}</p>
              <p>{queryError}</p>
            </div>
          )}
          
          {queryResult && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-white p-4 shadow border">
                <h3 className="text-md font-medium mb-2">{t("kbAnswer")}</h3>
                <div className="whitespace-pre-wrap text-gray-700">
                  {queryResult.answer}
                </div>
              </div>
              
              {queryResult.sources.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-2">{t("kbSources")}</h3>
                  <ul className="space-y-2">
                    {queryResult.sources.map((source, index) => (
                      <li key={index} className="rounded border p-3">
                        {source.type === 'web' ? (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            {source.title || source.url}
                          </a>
                        ) : (
                          <div className="font-medium text-gray-700">
                            {source.title || source.filename}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          {t("kbRelevance")} {Math.round(source.similarity * 100)}%
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 