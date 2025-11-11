// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import integrationAPI from '../services/integrationAPI';
// import GoogleClassroomIntegration from './integrations/GoogleClassroomIntegration';
// import ZoomIntegration from './integrations/ZoomIntegration';
// import SMSIntegration from './integrations/SMSIntegration';

// const IntegrationManager = ({ isOpen, onClose }) => {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState('overview');
//   const [integrations, setIntegrations] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (isOpen && user) {
//       fetchIntegrations();
//     } else if (isOpen && !user) {
//       setError('Please login to access integrations');
//     }
//   }, [isOpen, user]);

//   // Initialize integrations as empty array to prevent errors
//   useEffect(() => {
//     if (!Array.isArray(integrations)) {
//       setIntegrations([]);
//     }
//   }, [integrations]);

//   const fetchIntegrations = async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching integrations...');
//       const response = await integrationAPI.getIntegrations();
//       console.log('Integrations response:', response);
      
//       // Ensure we always have an array
//       // The response.data should contain the integrations array
//       const integrationsData = response.data?.data || response.data || [];
//       console.log('Integrations data:', integrationsData);
//       console.log('Integrations data type:', typeof integrationsData);
//       console.log('Integrations data is array:', Array.isArray(integrationsData));
//       console.log('Integrations data length:', integrationsData.length);
//       console.log('Full response object:', response);
//       console.log('Response data property:', response.data);
//       console.log('Response data type:', typeof response.data);
//       console.log('Response data is array:', Array.isArray(response.data));
      
//       if (integrationsData.length > 0) {
//         console.log('First integration:', integrationsData[0]);
//         console.log('First integration type:', integrationsData[0].type);
//         console.log('First integration isActive:', integrationsData[0].isActive);
//       }
//       setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
//     } catch (err) {
//       console.error('Error fetching integrations:', err);
      
//       // Handle different types of errors
//       if (err.response?.status === 401) {
//         setError('Please login to access integrations');
//       } else if (err.response?.status === 403) {
//         setError('You do not have permission to access integrations');
//       } else if (err.response?.status >= 500) {
//         setError('Server error. Please try again later.');
//       } else {
//         setError('Failed to load integrations. Please check your connection.');
//       }
      
//       // Set empty array on error to prevent crashes
//       setIntegrations([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getIntegrationStatus = (type) => {
//     console.log('🔍 getIntegrationStatus called with type:', type);
//     console.log('🔍 integrations array:', integrations);
//     console.log('🔍 integrations is array:', Array.isArray(integrations));
    
//     if (!Array.isArray(integrations)) {
//       console.log('🔍 integrations is not array, returning false');
//       return { isActive: false, isIntegrated: false };
//     }
    
//     const integration = integrations.find(integration => integration.type === type);
//     console.log('🔍 found integration:', integration);
//     console.log('🔍 integration isActive:', integration?.isActive);
    
//     return integration || { isActive: false, isIntegrated: false };
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//         {/* Header */}
//         <div className="flex justify-between items-center p-6 border-b">
//           <h2 className="text-2xl font-bold text-gray-900">Integration Manager</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 text-2xl"
//           >
//             ×
//           </button>
//         </div>

//         {/* Tabs */}
//         <div className="flex border-b">
//           <button
//             onClick={() => setActiveTab('overview')}
//             className={`px-6 py-3 font-medium ${
//               activeTab === 'overview'
//                 ? 'text-blue-600 border-b-2 border-blue-600'
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Overview
//           </button>
//           <button
//             onClick={() => setActiveTab('google')}
//             className={`px-6 py-3 font-medium ${
//               activeTab === 'google'
//                 ? 'text-blue-600 border-b-2 border-blue-600'
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Google Classroom
//           </button>
//           <button
//             onClick={() => setActiveTab('zoom')}
//             className={`px-6 py-3 font-medium ${
//               activeTab === 'zoom'
//                 ? 'text-blue-600 border-b-2 border-blue-600'
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Zoom
//           </button>
//           <button
//             onClick={() => setActiveTab('sms')}
//             className={`px-6 py-3 font-medium ${
//               activeTab === 'sms'
//                 ? 'text-blue-600 border-b-2 border-blue-600'
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             SMS/WhatsApp
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
//           {loading && (
//             <div className="flex items-center justify-center py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//               <span className="ml-2 text-gray-600">Loading integrations...</span>
//             </div>
//           )}

//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
//               <div className="flex">
//                 <div className="text-red-400">⚠️</div>
//                 <div className="ml-3">
//                   <h3 className="text-sm font-medium text-red-800">Error</h3>
//                   <p className="text-sm text-red-700 mt-1">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {!loading && !error && (
//             <>
//               {activeTab === 'overview' && (
//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                       Integration Overview
//                     </h3>
//                     <p className="text-gray-600 mb-6">
//                       Connect Smart SIT with external services to enhance your teaching experience.
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     {/* Google Classroom */}
//                     <div className="bg-white border border-gray-200 rounded-lg p-6">
//                       <div className="flex items-center mb-4">
//                         <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                           <span className="text-blue-600 text-xl">📚</span>
//                         </div>
//                         <div className="ml-3">
//                           <h4 className="font-semibold text-gray-900">Google Classroom</h4>
//                           <p className="text-sm text-gray-500">Sync courses & assignments</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           getIntegrationStatus('google_classroom').isActive
//                             ? 'bg-green-100 text-green-800'
//                             : 'bg-gray-100 text-gray-800'
//                         }`}>
//                           {getIntegrationStatus('google_classroom').isActive ? 'Active' : 'Inactive'}
//                         </span>
//                         <button
//                           onClick={() => setActiveTab('google')}
//                           className="text-blue-600 hover:text-blue-700 text-sm font-medium"
//                         >
//                           Manage →
//                         </button>
//                       </div>
//                     </div>

//                     {/* Zoom */}
//                     <div className="bg-white border border-gray-200 rounded-lg p-6">
//                       <div className="flex items-center mb-4">
//                         <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                           <span className="text-blue-600 text-xl">🎥</span>
//                         </div>
//                         <div className="ml-3">
//                           <h4 className="font-semibold text-gray-900">Zoom</h4>
//                           <p className="text-sm text-gray-500">Virtual meetings & classes</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           getIntegrationStatus('zoom').isActive
//                             ? 'bg-green-100 text-green-800'
//                             : 'bg-gray-100 text-gray-800'
//                         }`}>
//                           {getIntegrationStatus('zoom').isActive ? 'Active' : 'Inactive'}
//                         </span>
//                         <button
//                           onClick={() => setActiveTab('zoom')}
//                           className="text-blue-600 hover:text-blue-700 text-sm font-medium"
//                         >
//                           Manage →
//                         </button>
//                       </div>
//                     </div>

//                     {/* SMS */}
//                     <div className="bg-white border border-gray-200 rounded-lg p-6">
//                       <div className="flex items-center mb-4">
//                         <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                           <span className="text-blue-600 text-xl">📱</span>
//                         </div>
//                         <div className="ml-3">
//                           <h4 className="font-semibold text-gray-900">SMS/WhatsApp</h4>
//                           <p className="text-sm text-gray-500">Notifications & alerts</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           getIntegrationStatus('sms').isActive
//                             ? 'bg-green-100 text-green-800'
//                             : 'bg-gray-100 text-gray-800'
//                         }`}>
//                           {getIntegrationStatus('sms').isActive ? 'Active' : 'Inactive'}
//                         </span>
//                         <button
//                           onClick={() => setActiveTab('sms')}
//                           className="text-blue-600 hover:text-blue-700 text-sm font-medium"
//                         >
//                           Manage →
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                     <h4 className="font-medium text-blue-900 mb-2">💡 Benefits of Integrations</h4>
//                     <ul className="text-sm text-blue-800 space-y-1">
//                       <li>• Automatically sync courses and students from Google Classroom</li>
//                       <li>• Create and manage virtual classes with Zoom</li>
//                       <li>• Send instant SMS notifications to students and parents</li>
//                       <li>• Streamline your workflow with seamless data synchronization</li>
//                     </ul>
//                   </div>
//                 </div>
//               )}

//               {activeTab === 'google' && (
//                 <GoogleClassroomIntegration
//                   integration={getIntegrationStatus('google_classroom')}
//                   onUpdate={fetchIntegrations}
//                 />
//               )}

//               {activeTab === 'zoom' && (
//                 <ZoomIntegration
//                   integration={getIntegrationStatus('zoom')}
//                   onUpdate={fetchIntegrations}
//                 />
//               )}

//               {activeTab === 'sms' && (
//                 <SMSIntegration
//                   integration={getIntegrationStatus('sms')}
//                   onUpdate={fetchIntegrations}
//                 />
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IntegrationManager;
