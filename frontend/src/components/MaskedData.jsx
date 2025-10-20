/**
 * React Components for Displaying Masked Data
 * Ready-to-use components for showing sensitive information safely
 */

import PropTypes from 'prop-types';
import React from 'react';
import DataMaskingUtils from '../utils/dataMasking';

/**
 * Display masked phone number
 */
export const MaskedPhone = ({ phone, showIcon = true, className = '' }) => {
  if (!phone) return null;

  const masked = DataMaskingUtils.maskPhone(phone);
  
  return (
    <span className={`masked-phone ${className}`}>
      {showIcon && '📱 '}
      {masked}
    </span>
  );
};

MaskedPhone.propTypes = {
  phone: PropTypes.string,
  showIcon: PropTypes.bool,
  className: PropTypes.string
};

/**
 * Display masked email
 */
export const MaskedEmail = ({ email, showIcon = true, className = '' }) => {
  if (!email) return null;

  const masked = DataMaskingUtils.maskEmail(email);
  
  return (
    <span className={`masked-email ${className}`}>
      {showIcon && '📧 '}
      {masked}
    </span>
  );
};

MaskedEmail.propTypes = {
  email: PropTypes.string,
  showIcon: PropTypes.bool,
  className: PropTypes.string
};

/**
 * Display masked document number (passport/ID)
 */
export const MaskedDocument = ({ 
  documentNumber, 
  documentType = 'passport',
  lastDigits = 4,
  className = '' 
}) => {
  if (!documentNumber) return null;

  const masked = DataMaskingUtils.maskDocumentNumber(documentNumber, lastDigits);
  const icon = documentType === 'passport' ? '🛂' : '🪪';
  
  return (
    <span className={`masked-document ${className}`}>
      <span className="document-icon">{icon}</span>
      {' '}
      <span className="document-number">{masked}</span>
    </span>
  );
};

MaskedDocument.propTypes = {
  documentNumber: PropTypes.string,
  documentType: PropTypes.oneOf(['passport', 'national_id', 'driver_license']),
  lastDigits: PropTypes.number,
  className: PropTypes.string
};

/**
 * Display masked card number
 */
export const MaskedCard = ({ 
  cardNumber, 
  cardBrand,
  className = '' 
}) => {
  if (!cardNumber) return null;

  const masked = DataMaskingUtils.maskCardNumber(cardNumber);
  const brandIcon = {
    visa: '💳',
    mastercard: '💳',
    jcb: '💳',
    amex: '💳'
  };
  
  return (
    <span className={`masked-card ${className}`}>
      {brandIcon[cardBrand] || '💳'}
      {' '}
      {masked}
    </span>
  );
};

MaskedCard.propTypes = {
  cardNumber: PropTypes.string,
  cardBrand: PropTypes.oneOf(['visa', 'mastercard', 'jcb', 'amex', 'discover']),
  className: PropTypes.string
};

/**
 * Display masked name
 */
export const MaskedName = ({ name, className = '' }) => {
  if (!name) return null;

  const masked = DataMaskingUtils.maskName(name);
  
  return (
    <span className={`masked-name ${className}`}>
      {masked}
    </span>
  );
};

MaskedName.propTypes = {
  name: PropTypes.string,
  className: PropTypes.string
};

/**
 * Display masked bank account
 */
export const MaskedBankAccount = ({ 
  accountNumber, 
  bankName,
  className = '' 
}) => {
  if (!accountNumber) return null;

  const masked = DataMaskingUtils.maskBankAccount(accountNumber);
  
  return (
    <div className={`masked-bank-account ${className}`}>
      {bankName && (
        <div className="bank-name">{bankName}</div>
      )}
      <div className="account-number">
        🏦 {masked}
      </div>
    </div>
  );
};

MaskedBankAccount.propTypes = {
  accountNumber: PropTypes.string,
  bankName: PropTypes.string,
  className: PropTypes.string
};

/**
 * Display contact info with masking
 */
export const MaskedContactInfo = ({ 
  email, 
  phone, 
  alternatePhone,
  className = '' 
}) => {
  return (
    <div className={`masked-contact-info ${className}`}>
      {email && (
        <div className="contact-item">
          <MaskedEmail email={email} />
        </div>
      )}
      {phone && (
        <div className="contact-item">
          <MaskedPhone phone={phone} />
        </div>
      )}
      {alternatePhone && (
        <div className="contact-item">
          <span className="label">Alternate: </span>
          <MaskedPhone phone={alternatePhone} showIcon={false} />
        </div>
      )}
    </div>
  );
};

MaskedContactInfo.propTypes = {
  email: PropTypes.string,
  phone: PropTypes.string,
  alternatePhone: PropTypes.string,
  className: PropTypes.string
};

/**
 * Display passenger info with masking
 */
export const MaskedPassengerInfo = ({ 
  passenger,
  showDocument = true,
  className = '' 
}) => {
  if (!passenger) return null;

  return (
    <div className={`masked-passenger-info ${className}`}>
      <div className="passenger-name">
        {passenger.title} {passenger.firstName} {passenger.lastName}
      </div>
      {showDocument && passenger.document && (
        <div className="passenger-document">
          <MaskedDocument 
            documentNumber={passenger.document.number}
            documentType={passenger.document.type}
          />
        </div>
      )}
    </div>
  );
};

MaskedPassengerInfo.propTypes = {
  passenger: PropTypes.shape({
    title: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    document: PropTypes.shape({
      type: PropTypes.string,
      number: PropTypes.string
    })
  }),
  showDocument: PropTypes.bool,
  className: PropTypes.string
};

/**
 * Sensitive Data Display with Toggle
 * Shows masked data by default, can reveal on click (with confirmation)
 */
export const SensitiveDataDisplay = ({ 
  value,
  type = 'text',
  maskFunction,
  requireConfirm = true,
  confirmMessage = 'Are you sure you want to reveal this sensitive information?',
  className = ''
}) => {
  const [isRevealed, setIsRevealed] = React.useState(false);

  const handleToggle = () => {
    if (!isRevealed && requireConfirm) {
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    setIsRevealed(!isRevealed);
  };

  const displayValue = isRevealed ? value : (
    maskFunction ? maskFunction(value) : value
  );

  return (
    <div className={`sensitive-data-display ${className}`}>
      <span className="sensitive-value">{displayValue}</span>
      <button 
        className="toggle-reveal-btn"
        onClick={handleToggle}
        type="button"
        title={isRevealed ? 'Hide' : 'Reveal'}
      >
        {isRevealed ? '🙈 Hide' : '👁️ Reveal'}
      </button>
    </div>
  );
};

SensitiveDataDisplay.propTypes = {
  value: PropTypes.string.isRequired,
  type: PropTypes.string,
  maskFunction: PropTypes.func,
  requireConfirm: PropTypes.bool,
  confirmMessage: PropTypes.string,
  className: PropTypes.string
};

// Export all components
export default {
  MaskedPhone,
  MaskedEmail,
  MaskedDocument,
  MaskedCard,
  MaskedName,
  MaskedBankAccount,
  MaskedContactInfo,
  MaskedPassengerInfo,
  SensitiveDataDisplay
};
