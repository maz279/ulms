# Loan Proposal Viewer

## Loan Application Proposal Display Component

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Loan Proposal Viewer |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Frontend Development Team |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Frontend Team | Initial version |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Proposal Structure](#2-proposal-structure)
3. [Component Design](#3-component-design)
4. [Document Viewer](#4-document-viewer)
5. [Related Documents](#5-related-documents)

---

## 1. Executive Summary

This document defines the Loan Proposal Viewer component for displaying comprehensive loan application information during the approval process.

---

## 2. Proposal Structure

### 2.1 Proposal Data Model

```typescript
// features/workflow/types/proposal.types.ts

export interface LoanProposal {
  applicationId: string;
  status: string;
  submittedAt: string;
  
  applicant: {
    name: string;
    nidNumber: string;
    dateOfBirth: string;
    address: string;
    mobileNumber: string;
    email?: string;
  };
  
  loanDetails: {
    type: string;
    amount: number;
    purpose: string;
    tenureMonths: number;
    interestRate: number;
    proposedEMI: number;
  };
  
  employment: {
    employerName: string;
    designation: string;
    monthlyIncome: number;
    employmentType: string;
  };
  
  cibReport?: {
    score: number;
    riskGrade: string;
    totalOutstanding: number;
  };
  
  documents: Document[];
  
  workflow: {
    currentStage: string;
    assignedTo?: string;
    history: WorkflowEvent[];
  };
}
```

---

## 3. Component Design

### 3.1 Loan Proposal Viewer

```typescript
// features/workflow/components/LoanProposalViewer/LoanProposalViewer.tsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Divider,
} from '@mui/material';
import { useGetLoanProposalQuery } from '../../api/workflowApi';
import { DocumentViewer } from '../DocumentViewer';
import { CIBSummary } from '../CIBSummary';

interface LoanProposalViewerProps {
  applicationId: string;
}

export function LoanProposalViewer({ applicationId }: LoanProposalViewerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { data: proposal } = useGetLoanProposalQuery(applicationId);

  if (!proposal) return <Typography>Loading...</Typography>;

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h5">{proposal.applicationId}</Typography>
          <Chip 
            label={proposal.status} 
            color={getStatusColor(proposal.status)}
          />
        </Box>
        <Typography color="text.secondary">
          Submitted: {new Date(proposal.submittedAt).toLocaleDateString()}
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Applicant" />
        <Tab label="Loan Details" />
        <Tab label="Financials" />
        <Tab label="CIB Report" />
        <Tab label="Documents" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && <ApplicantTab applicant={proposal.applicant} />}
        {activeTab === 1 && <LoanDetailsTab details={proposal.loanDetails} />}
        {activeTab === 2 && <FinancialsTab employment={proposal.employment} />}
        {activeTab === 3 && <CIBSummary cib={proposal.cibReport} />}
        {activeTab === 4 && <DocumentsTab documents={proposal.documents} />}
      </Box>
    </Paper>
  );
}

function ApplicantTab({ applicant }: { applicant: any }) {
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell component="th">Name</TableCell>
          <TableCell>{applicant.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th">NID Number</TableCell>
          <TableCell>{applicant.nidNumber}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th">Date of Birth</TableCell>
          <TableCell>{applicant.dateOfBirth}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th">Address</TableCell>
          <TableCell>{applicant.address}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th">Mobile</TableCell>
          <TableCell>{applicant.mobileNumber}</TableCell>
        </TableRow>
        {applicant.email && (
          <TableRow>
            <TableCell component="th">Email</TableCell>
            <TableCell>{applicant.email}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function LoanDetailsTab({ details }: { details: any }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <InfoCard label="Loan Type" value={details.type} />
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoCard 
          label="Amount" 
          value={`BDT ${details.amount.toLocaleString()}`} 
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoCard label="Tenure" value={`${details.tenureMonths} months`} />
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoCard label="Interest Rate" value={`${details.interestRate}%`} />
      </Grid>
      <Grid item xs={12}>
        <InfoCard label="Purpose" value={details.purpose} />
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoCard 
          label="Proposed EMI" 
          value={`BDT ${details.proposedEMI.toLocaleString()}`} 
        />
      </Grid>
    </Grid>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Paper>
  );
}
```

---

## 4. Document Viewer

```typescript
// features/workflow/components/DocumentViewer/DocumentViewer.tsx
import { useState } from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Dialog } from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';

export function DocumentViewer({ documents }: { documents: Document[] }) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  return (
    <>
      <List>
        {documents.map((doc) => (
          <ListItem
            key={doc.id}
            secondaryAction={
              <Box>
                <IconButton onClick={() => setSelectedDoc(doc)}>
                  <Visibility />
                </IconButton>
                <IconButton href={doc.downloadUrl}>
                  <Download />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={doc.name}
              secondary={doc.type}
            />
          </ListItem>
        ))}
      </List>

      <Dialog
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        maxWidth="lg"
        fullWidth
      >
        {selectedDoc?.type === 'PDF' ? (
          <iframe
            src={selectedDoc.url}
            style={{ width: '100%', height: '80vh' }}
          />
        ) : (
          <img
            src={selectedDoc?.url}
            alt={selectedDoc?.name}
            style={{ maxWidth: '100%' }}
          />
        )}
      </Dialog>
    </>
  );
}
```

---

## 5. Related Documents

| Document | Purpose |
|----------|---------|
| `[WF]_Workflow_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
