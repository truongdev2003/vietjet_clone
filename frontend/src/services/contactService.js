// Contact Service API
import api from '../config/axios';

const contactService = {
  /**
   * Submit contact form
   * @param {object} formData - Contact form data
   * @param {string} formData.name - Full name
   * @param {string} formData.email - Email address
   * @param {string} formData.phone - Phone number
   * @param {string} formData.subject - Message subject
   * @param {string} formData.message - Message content
   */
  submitContactForm: async (formData) => {
    try {
      const response = await api.post('/contact', formData);
      return response.data;
    } catch (error) {
      console.error('Error submitting contact form:', error);
      throw error;
    }
  },

  /**
   * Get contact information
   */
  getContactInfo: async () => {
    try {
      const response = await api.get('/contact/info');
      return response.data;
    } catch (error) {
      console.error('Error fetching contact info:', error);
      throw error;
    }
  },

  /**
   * Get FAQs
   */
  getFAQs: async () => {
    try {
      const response = await api.get('/contact/faqs');
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  },
};

export default contactService;
