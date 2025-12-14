// src/components/common/ToastProvider.tsx
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="bottom-right"
      gutter={12}
      containerStyle={{
        bottom: 24,
        right: 24,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          fontSize: '14px',
          maxWidth: '400px',
          border: '1px solid rgba(255,255,255,0.1)',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
        },
        loading: {
          iconTheme: {
            primary: '#6366F1',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default ToastProvider;