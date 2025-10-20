/**
 * React Hook for Data Masking
 * Custom hooks to mask sensitive data in React components
 */

import { useCallback, useMemo } from 'react';
import DataMaskingUtils from '../utils/dataMasking';

/**
 * Hook to mask sensitive user data
 * @param {Object} user - User object
 * @param {Object} options - Masking options
 * @returns {Object} Masked user data
 */
export function useMaskedUser(user, options = {}) {
  const {
    maskEmail = true,
    maskPhone = true,
    maskDateOfBirth = true,
    maskDocuments = true
  } = options;

  return useMemo(() => {
    if (!user) return null;

    const masked = { ...user };

    // Mask contact info
    if (masked.contactInfo) {
      if (maskEmail && masked.contactInfo.email) {
        masked.contactInfo.email = DataMaskingUtils.maskEmail(masked.contactInfo.email);
      }
      if (maskPhone && masked.contactInfo.phone) {
        masked.contactInfo.phone = DataMaskingUtils.maskPhone(masked.contactInfo.phone);
      }
      if (maskPhone && masked.contactInfo.alternatePhone) {
        masked.contactInfo.alternatePhone = DataMaskingUtils.maskPhone(masked.contactInfo.alternatePhone);
      }
    }

    // Mask personal info
    if (masked.personalInfo) {
      if (maskDateOfBirth && masked.personalInfo.dateOfBirth) {
        masked.personalInfo.dateOfBirth = DataMaskingUtils.maskDateOfBirth(masked.personalInfo.dateOfBirth);
      }
    }

    // Mask documents
    if (maskDocuments && masked.documents && Array.isArray(masked.documents)) {
      masked.documents = masked.documents.map(doc => ({
        ...doc,
        number: DataMaskingUtils.maskDocumentNumber(doc.number)
      }));
    }

    return masked;
  }, [user, maskEmail, maskPhone, maskDateOfBirth, maskDocuments]);
}

/**
 * Hook to mask booking data
 * @param {Object} booking - Booking object
 * @returns {Object} Masked booking data
 */
export function useMaskedBooking(booking) {
  return useMemo(() => {
    if (!booking) return null;

    const masked = { ...booking };

    // Mask contact info
    if (masked.contactInfo) {
      if (masked.contactInfo.phone) {
        masked.contactInfo.phone = DataMaskingUtils.maskPhone(masked.contactInfo.phone);
      }
      if (masked.contactInfo.email) {
        masked.contactInfo.email = DataMaskingUtils.maskEmail(masked.contactInfo.email);
      }
    }

    // Mask passengers
    if (masked.passengers && Array.isArray(masked.passengers)) {
      masked.passengers = masked.passengers.map(passenger => ({
        ...passenger,
        document: passenger.document ? {
          ...passenger.document,
          number: DataMaskingUtils.maskDocumentNumber(passenger.document.number)
        } : null
      }));
    }

    return masked;
  }, [booking]);
}

/**
 * Hook to mask payment data
 * @param {Object} payment - Payment object
 * @returns {Object} Masked payment data
 */
export function useMaskedPayment(payment) {
  return useMemo(() => {
    if (!payment) return null;

    const masked = { ...payment };

    // Mask card info
    if (masked.paymentMethod?.card) {
      if (masked.paymentMethod.card.holderName) {
        masked.paymentMethod.card.holderName = DataMaskingUtils.maskName(
          masked.paymentMethod.card.holderName
        );
      }
      // Card number should already be masked (only last 4 digits stored)
    }

    // Mask bank transfer
    if (masked.paymentMethod?.bankTransfer) {
      if (masked.paymentMethod.bankTransfer.accountHolder) {
        masked.paymentMethod.bankTransfer.accountHolder = DataMaskingUtils.maskName(
          masked.paymentMethod.bankTransfer.accountHolder
        );
      }
      if (masked.paymentMethod.bankTransfer.accountNumber) {
        masked.paymentMethod.bankTransfer.accountNumber = DataMaskingUtils.maskBankAccount(
          masked.paymentMethod.bankTransfer.accountNumber
        );
      }
    }

    return masked;
  }, [payment]);
}

/**
 * Hook to get masking utilities as callbacks
 * @returns {Object} Masking utility functions
 */
export function useMaskingUtils() {
  const maskEmail = useCallback((email) => {
    return DataMaskingUtils.maskEmail(email);
  }, []);

  const maskPhone = useCallback((phone) => {
    return DataMaskingUtils.maskPhone(phone);
  }, []);

  const maskDocument = useCallback((documentNumber, lastDigits = 4) => {
    return DataMaskingUtils.maskDocumentNumber(documentNumber, lastDigits);
  }, []);

  const maskCard = useCallback((cardNumber) => {
    return DataMaskingUtils.maskCardNumber(cardNumber);
  }, []);

  const maskName = useCallback((name) => {
    return DataMaskingUtils.maskName(name);
  }, []);

  const formatPhone = useCallback((phone, shouldMask = false) => {
    return DataMaskingUtils.formatPhoneDisplay(phone, shouldMask);
  }, []);

  const formatCard = useCallback((card, shouldMask = true) => {
    return DataMaskingUtils.formatCardDisplay(card, shouldMask);
  }, []);

  return {
    maskEmail,
    maskPhone,
    maskDocument,
    maskCard,
    maskName,
    formatPhone,
    formatCard
  };
}

/**
 * Hook for conditional masking based on user role/permissions
 * @param {string} userRole - Current user's role
 * @returns {Object} Masking configuration
 */
export function useMaskingConfig(userRole) {
  return useMemo(() => {
    // Admin can see more, regular users see masked data
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    return {
      shouldMaskEmail: !isAdmin,
      shouldMaskPhone: !isAdmin,
      shouldMaskDocument: true, // Always mask documents
      shouldMaskPayment: true,  // Always mask payment info
      shouldMaskDateOfBirth: !isAdmin
    };
  }, [userRole]);
}

export default {
  useMaskedUser,
  useMaskedBooking,
  useMaskedPayment,
  useMaskingUtils,
  useMaskingConfig
};
