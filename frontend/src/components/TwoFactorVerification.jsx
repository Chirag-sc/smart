import React, { useState } from 'react';

const TwoFactorVerification = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  userEmail,
  loading = false 
}) => {
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (useBackupCode) {
      if (!backupCode.trim()) {
        setError('Please enter a backup code');
        return;
      }
      onVerify({ backupCode: backupCode.trim() });
    } else {
      if (!token.trim()) {
        setError('Please enter your 2FA code');
        return;
      }
      onVerify({ twoFactorToken: token.trim() });
    }
  };

  const resetForm = () => {
    setToken('');
    setBackupCode('');
    setError('');
    setUseBackupCode(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 text-sm">🔐</span>
            </div>
            <div>
              <h3 className="font-semibold">Security Verification</h3>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Please enter your 2FA code to complete the login process.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!useBackupCode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 2FA Code
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength="6"
                autoComplete="one-time-code"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="ABCDEF"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength="6"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter one of your backup codes
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setUseBackupCode(!useBackupCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {useBackupCode ? 'Use 2FA Code Instead' : 'Use Backup Code Instead'}
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Need Help?</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Make sure your device's time is synchronized</li>
            <li>• Check that you're using the correct authenticator app</li>
            <li>• If you've lost your device, use a backup code</li>
            <li>• Contact support if you're still having trouble</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;
