# BOCC Meeting Interface
## ULMS v2.0 Branch Officers Credit Committee

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | BOCC Meeting Interface |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. BOCC Interface

The Branch Officers Credit Committee (BOCC) interface manages in-branch credit committee meetings for loan approvals.

## 2. Components

```typescript
// BOCCMeetingPage.tsx
export function BOCCMeetingPage(): React.ReactElement {
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const { data: pendingCases } = useGetBOCCPendingCasesQuery();

  return (
    <Box>
      <PageHeader title="BOCC Meeting" />
      
      {/* Case Selection */}
      <CaseSelectionTable
        cases={pendingCases}
        selected={selectedCases}
        onSelectionChange={setSelectedCases}
      />
      
      {/* Meeting Minutes */}
      <MeetingMinutesForm
        cases={selectedCases}
        onSubmit={handleMeetingComplete}
      />
      
      {/* Attendance */}
      <AttendanceSheet />
      
      {/* Decision Recording */}
      <DecisionRecording cases={selectedCases} />
    </Box>
  );
}
```

## 3. Features

- Case selection for meeting agenda
- Attendance recording
- Digital minutes generation
- Decision recording (Approve/Reject/Defer)
- Minutes print/export

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
