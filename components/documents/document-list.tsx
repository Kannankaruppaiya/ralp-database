'use client';

import React, { useState } from 'react';
import { ClinicalDocument } from '@/types/document';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { formatDate } from '@/lib/formatters';
import { FileText, Eye, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';
import Link from 'next/link';

export function DocumentList({ documents }: { documents: ClinicalDocument[] }) {
  const [selectedDoc, setSelectedDoc] = useState<ClinicalDocument | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Uploaded Clinical Notes & Letters</span>
        </h3>
        <Link href="/data-ingestion/upload">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <FileUp className="h-3.5 w-3.5" />
            <span>Upload Document</span>
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded Date</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Extraction Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>{doc.title}</span>
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline">{doc.docType}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {formatDate(doc.uploadedAt)}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {doc.uploadedBy}
                </TableCell>
                <TableCell>
                  <Badge variant={doc.parsedStatus === 'reviewed' ? 'success' : 'warning'} className="text-[10px]">
                    {doc.parsedStatus} ({doc.extractedFieldCount || 0} fields)
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Text</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Raw Text Viewer Modal */}
      {selectedDoc && (
        <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>{selectedDoc.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {selectedDoc.rawText || 'No raw extracted text preview available for this document.'}
          </div>
        </Dialog>
      )}
    </div>
  );
}

export function DocumentViewer() {
  return null;
}

export function DocumentMetadata() {
  return null;
}

export function DocumentSource() {
  return null;
}
