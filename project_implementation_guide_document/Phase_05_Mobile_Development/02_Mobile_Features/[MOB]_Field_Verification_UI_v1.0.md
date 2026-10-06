# Field Verification UI

## Verification Form and Data Collection Interface

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Field Verification UI |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Mobile Development Team |
| **Reviewed By** | Technical Lead |
| **Classification** | Confidential |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Mobile Team | Initial field verification UI design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [UI Architecture](#2-ui-architecture)
3. [Verification Form Design](#3-verification-form-design)
4. [Photo Gallery Component](#4-photo-gallery-component)
5. [Signature Capture](#5-signature-capture)
6. [GPS Integration in Forms](#6-gps-integration-in-forms)
7. [Form Validation](#7-form-validation)
8. [Offline Form Handling](#8-offline-form-handling)
9. [Testing Approach](#9-testing-approach)
10. [Related Documents](#10-related-documents)

---

## 1. Executive Summary

This document defines the Field Verification UI for the ULMS CPV Mobile Application, providing a comprehensive interface for officers to collect and submit verification data in the field. The design emphasizes ease of use, data accuracy, and offline capability.

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Step Form** | Organized into logical sections |
| **Photo Gallery** | Visual management of captured photos |
| **Signature Capture** | Digital signature of applicant/witness |
| **GPS Integration** | Location verification per section |
| **Real-time Validation** | Immediate feedback on input |
| **Auto-Save Draft** | Preserve progress automatically |

---

## 2. UI Architecture

### 2.1 Screen Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Field Verification Flow                       │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   Verify     │────▶│   Photo      │────▶│  Document    │
    │   Address    │     │   Capture    │     │  Upload      │
    └──────────────┘     └──────────────┘     └──────────────┘
                                                      │
    ┌──────────────┐     ┌──────────────┐            │
    │   Submit     │◀────│   Signature  │◀───────────┘
    │   Review     │     │   Capture    │
    └──────────────┘     └──────────────┘
```

### 2.2 Component Structure

```typescript
// Component hierarchy
FieldVerificationScreen
├── VerificationProgressBar
├── VerificationForm
│   ├── ApplicantVerificationSection
│   ├── AddressVerificationSection
│   ├── PropertyConditionSection
│   └── NeighborVerificationSection
├── PhotoGallery
│   ├── PhotoThumbnail
│   ├── PhotoCaptureButton
│   └── PhotoReviewModal
├── DocumentUploadSection
│   └── DocumentPicker
├── SignatureCapture
│   ├── SignaturePad
│   └── ClearButton
└── FormActions
    ├── SaveDraftButton
    └── SubmitButton
```

---

## 3. Verification Form Design

### 3.1 Form Data Model

```typescript
// src/features/verification/types/verification.types.ts

export interface VerificationFormData {
  assignmentId: string;
  
  // Applicant Verification
  applicantPresent: boolean;
  applicantPresentReason?: string;
  verifiedName: string;
  verifiedPhone: string;
  verifiedOccupation: string;
  
  // Address Verification
  addressConfirmed: boolean;
  addressDiscrepancy?: string;
  addressType: 'OWNED' | 'RENTED' | 'FAMILY' | 'OTHER';
  residenceStability: 'LESS_THAN_1_YEAR' | '1_TO_3_YEARS' | 'MORE_THAN_3_YEARS';
  
  // Property Condition
  propertyType: 'HOUSE' | 'APARTMENT' | 'SHOP' | 'OFFICE' | 'OTHER';
  propertyCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  neighborhoodType: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED' | 'INDUSTRIAL';
  
  // Neighbor Verification
  neighborName?: string;
  neighborPhone?: string;
  neighborConfirmation: boolean;
  neighborComments?: string;
  
  // Photos
  photos: PhotoMetadata[];
  
  // Documents
  documents: DocumentMetadata[];
  
  // Signatures
  applicantSignature?: string; // Base64 image
  witnessSignature?: string;
  officerSignature?: string;
  
  // Location Data
  verificationLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  
  // Comments
  generalComments?: string;
  riskFactors?: string[];
  recommendations?: string;
}
```

### 3.2 Form Screen Implementation

```typescript
// src/features/verification/screens/FieldVerificationScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRoute, useNavigation } from '@react-navigation/native';
import { verificationSchema } from '../schemas/verificationSchema';
import { VerificationFormData } from '../types/verification.types';
import { ApplicantSection } from '../components/ApplicantSection';
import { AddressSection } from '../components/AddressSection';
import { PropertySection } from '../components/PropertySection';
import { PhotoSection } from '../components/PhotoSection';
import { SignatureSection } from '../components/SignatureSection';
import { VerificationProgress } from '../components/VerificationProgress';
import { FormActions } from '../components/FormActions';
import { useAutoSave } from '../hooks/useAutoSave';

const STEPS = [
  { key: 'applicant', label: 'Applicant', component: ApplicantSection },
  { key: 'address', label: 'Address', component: AddressSection },
  { key: 'property', label: 'Property', component: PropertySection },
  { key: 'photos', label: 'Photos', component: PhotoSection },
  { key: 'signature', label: 'Signature', component: SignatureSection },
];

export const FieldVerificationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { assignmentId } = route.params as { assignmentId: string };
  
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      assignmentId,
      photos: [],
      documents: [],
    },
  });

  // Auto-save draft every 30 seconds
  useAutoSave(form.watch, assignmentId, 30000);

  const CurrentStepComponent = STEPS[currentStep].component;

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, form]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async (data: VerificationFormData) => {
    try {
      // Navigate to review screen
      navigation.navigate('VerificationReview', { 
        assignmentId, 
        formData: data 
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  }, [assignmentId, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FormProvider {...form}>
        <View style={styles.header}>
          <Text style={styles.title}>Field Verification</Text>
          <VerificationProgress
            steps={STEPS.map((s) => s.label)}
            currentStep={currentStep}
          />
        </View>

        <ScrollView style={styles.formContainer}>
          <CurrentStepComponent />
        </ScrollView>

        <FormActions
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={form.handleSubmit(handleSubmit)}
          isValid={form.formState.isValid}
        />
      </FormProvider>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
});
```

---

## 4. Photo Gallery Component

### 4.1 Photo Gallery Implementation

```typescript
// src/features/verification/components/PhotoGallery.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PhotoMetadata } from '../types/verification.types';

interface PhotoGalleryProps {
  photos: PhotoMetadata[];
  requiredTypes: string[];
  onRemovePhoto: (id: string) => void;
  maxPhotos?: number;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  requiredTypes,
  onRemovePhoto,
  maxPhotos = 20,
}) => {
  const navigation = useNavigation();

  const getPhotosByType = (type: string) => {
    return photos.filter((p) => p.type === type);
  };

  const handleAddPhoto = (type: string) => {
    navigation.navigate('PhotoCapture', { photoType: type });
  };

  const handleViewPhoto = (photo: PhotoMetadata) => {
    navigation.navigate('PhotoReview', { photo });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Verification Photos</Text>
      
      {requiredTypes.map((type) => {
        const typePhotos = getPhotosByType(type);
        const isComplete = typePhotos.length > 0;

        return (
          <View key={type} style={styles.photoTypeSection}>
            <View style={styles.typeHeader}>
              <Text style={styles.typeLabel}>{type}</Text>
              {isComplete ? (
                <View style={styles.badgeComplete}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              ) : (
                <View style={styles.badgeRequired}>
                  <Text style={styles.badgeText}>Required</Text>
                </View>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photoRow}>
                {typePhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => handleViewPhoto(photo)}
                    style={styles.photoThumbnail}
                  >
                    <Image
                      source={{ uri: photo.thumbnailUri }}
                      style={styles.thumbnailImage}
                    />
                    <TouchableOpacity
                      onPress={() => onRemovePhoto(photo.id)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeText}>×</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}

                {photos.length < maxPhotos && (
                  <TouchableOpacity
                    onPress={() => handleAddPhoto(type)}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                    <Text style={styles.addButtonLabel}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        );
      })}

      <Text style={styles.photoCount}>
        {photos.length} / {maxPhotos} photos
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  photoTypeSection: {
    marginBottom: 16,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  badgeComplete: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeRequired: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  addButtonText: {
    fontSize: 24,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  addButtonLabel: {
    fontSize: 10,
    color: '#2196F3',
    marginTop: 4,
  },
  photoCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
```

---

## 5. Signature Capture

### 5.1 Signature Pad Component

```typescript
// src/features/verification/components/SignatureCapture.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';

interface SignatureCaptureProps {
  label: string;
  onSave: (signature: string) => void;
  onClear?: () => void;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  label,
  onSave,
  onClear,
}) => {
  const signatureRef = useRef<SignatureViewRef>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleOK = (signature: string) => {
    onSave(signature);
    setHasSignature(true);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
    onClear?.();
  };

  const handleConfirm = () => {
    if (!hasSignature) {
      Alert.alert('Signature Required', 'Please sign before confirming.');
      return;
    }
    signatureRef.current?.readSignature();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.signatureContainer}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleOK}
          onEmpty={() => setHasSignature(false)}
          autoClear={false}
          descriptionText="Sign above"
          confirmText="Save"
          clearText="Clear"
          webStyle={`
            .m-signature-pad {
              box-shadow: none;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
            }
            .m-signature-pad--footer {
              display: none;
            }
          `}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={handleClear}
          style={[styles.button, styles.clearButton]}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleConfirm}
          style={[styles.button, styles.saveButton, !hasSignature && styles.disabledButton]}
          disabled={!hasSignature}
        >
          <Text style={styles.saveButtonText}>Confirm Signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  signatureContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
});
```

---

## 6. GPS Integration in Forms

### 6.1 Location Verification Component

```typescript
// src/features/verification/components/LocationVerification.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocation } from '../../../services/gps/useLocation';
import { AccuracyIndicator } from '../../../components/feedback/AccuracyIndicator';

export const LocationVerification: React.FC = () => {
  const { location, accuracy, isAccurate, isLoading } = useLocation(10);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Verification</Text>
      
      {isLoading ? (
        <Text style={styles.loadingText}>Acquiring GPS signal...</Text>
      ) : (
        <>
          <AccuracyIndicator accuracy={accuracy} />
          
          {location && (
            <View style={styles.coordinates}>
              <Text style={styles.coordText}>
                Lat: {location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordText}>
                Long: {location.longitude.toFixed(6)}
              </Text>
              <Text style={styles.timeText}>
                Updated: {new Date(location.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}

          {!isAccurate && (
            <Text style={styles.warningText}>
              Please move to an open area for better GPS accuracy before continuing.
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  coordinates: {
    marginTop: 8,
  },
  coordText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
  },
});
```

---

## 7. Form Validation

### 7.1 Validation Schema

```typescript
// src/features/verification/schemas/verificationSchema.ts
import { z } from 'zod';

export const verificationSchema = z.object({
  assignmentId: z.string().uuid(),
  
  applicantPresent: z.boolean(),
  applicantPresentReason: z.string().optional(),
  verifiedName: z.string().min(2, 'Name must be at least 2 characters'),
  verifiedPhone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh phone number'),
  verifiedOccupation: z.string().min(2, 'Occupation is required'),
  
  addressConfirmed: z.boolean(),
  addressDiscrepancy: z.string().optional(),
  addressType: z.enum(['OWNED', 'RENTED', 'FAMILY', 'OTHER']),
  residenceStability: z.enum(['LESS_THAN_1_YEAR', '1_TO_3_YEARS', 'MORE_THAN_3_YEARS']),
  
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'SHOP', 'OFFICE', 'OTHER']),
  propertyCondition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  neighborhoodType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'MIXED', 'INDUSTRIAL']),
  
  photos: z.array(z.object({
    id: z.string(),
    type: z.string(),
    uri: z.string(),
  })).min(3, 'At least 3 photos are required'),
  
  applicantSignature: z.string().min(1, 'Applicant signature is required'),
  officerSignature: z.string().min(1, 'Officer signature is required'),
  
  verificationLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    timestamp: z.number(),
  }),
  
  generalComments: z.string().max(1000, 'Comments must be less than 1000 characters').optional(),
});
```

---

## 8. Offline Form Handling

### 8.1 Auto-Save Hook

```typescript
// src/features/verification/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { UseFormWatch } from 'react-hook-form';
import { VerificationFormData } from '../types/verification.types';
import { verificationStorage } from '../storage/verificationStorage';

export const useAutoSave = (
  watch: UseFormWatch<VerificationFormData>,
  assignmentId: string,
  intervalMs: number = 30000
) => {
  const watchedValues = watch();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const saveDraft = () => {
      verificationStorage.saveDraft(assignmentId, watchedValues);
      console.log('Draft auto-saved');
    };

    // Debounced auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(saveDraft, intervalMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [watchedValues, assignmentId, intervalMs]);
};
```

---

## 9. Testing Approach

```typescript
// __tests__/verification/FieldVerificationScreen.test.tsx
describe('FieldVerificationScreen', () => {
  it('should render all form sections', () => {
    // Test form rendering
  });

  it('should validate required fields', async () => {
    // Test validation
  });

  it('should auto-save draft', () => {
    // Test auto-save functionality
  });
});
```

---

## 10. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| `[MOB]_React_Native_CPV_App_Architecture_v1.0.md` | Overall architecture | `01_Mobile_Architecture/` |
| `[MOB]_Camera_Integration_Design_v1.0.md` | Photo capture | `01_Mobile_Architecture/` |
| `[MOB]_CPV_Assignment_Flow_v1.0.md` | Assignment workflow | `02_Mobile_Features/` |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
