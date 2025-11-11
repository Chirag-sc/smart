// import React, { useState } from 'react';
// import integrationAPI from '../../services/integrationAPI';

// const GoogleClassroomIntegration = ({ integration, onUpdate }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [syncedCourses, setSyncedCourses] = useState([]);
//   const [showAssignmentForm, setShowAssignmentForm] = useState(false);
//   const [assignmentData, setAssignmentData] = useState({
//     title: '',
//     description: '',
//     dueDate: '',
//     courseId: ''
//   });

//   const handleConnect = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await integrationAPI.getGoogleAuthUrl();
//       window.open(response.data.authUrl, '_blank');
//     } catch (err) {
//       setError('Failed to initiate Google Classroom connection');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSyncCourses = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await integrationAPI.syncGoogleCourses();
//       setSyncedCourses(response.data.syncedCourses || []);
//       setSuccess(`Successfully synced ${response.data.syncedCourses?.length || 0} courses`);
//       onUpdate();
//     } catch (err) {
//       setError('Failed to sync courses from Google Classroom');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateAssignment = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       setError(null);
      
//       await integrationAPI.createGoogleAssignment(assignmentData.courseId, {
//         title: assignmentData.title,
//         description: assignmentData.description,
//         dueDate: assignmentData.dueDate
//       });
      
//       setSuccess('Assignment created successfully in Google Classroom');
//       setShowAssignmentForm(false);
//       setAssignmentData({
//         title: '',
//         description: '',
//         dueDate: '',
//         courseId: ''
//       });
//     } catch (err) {
//       setError('Failed to create assignment in Google Classroom');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDisconnect = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       await integrationAPI.disableIntegration('google_classroom');
//       setSuccess('Google Classroom integration disabled');
//       onUpdate();
//     } catch (err) {
//       setError('Failed to disable Google Classroom integration');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="text-lg font-semibold text-gray-900 mb-2">
//           Google Classroom Integration
//         </h3>
//         <p className="text-gray-600">
//           Sync your courses, students, and assignments with Google Classroom for seamless workflow.
//         </p>
//       </div>

//       {/* Status Card */}
//       <div className={`border rounded-lg p-4 ${
//         integration.isActive 
//           ? 'border-green-200 bg-green-50' 
//           : 'border-gray-200 bg-gray-50'
//       }`}>
//         <div className="flex items-center justify-between">
//           <div className="flex items-center">
//             <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//               <span className="text-blue-600 text-xl">📚</span>
//             </div>
//             <div className="ml-3">
//               <h4 className="font-medium text-gray-900">Google Classroom</h4>
//               <p className="text-sm text-gray-500">
//                 {integration.isActive 
//                   ? 'Connected and active' 
//                   : 'Not connected'
//                 }
//               </p>
//             </div>
//           </div>
//           <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//             integration.isActive
//               ? 'bg-green-100 text-green-800'
//               : 'bg-gray-100 text-gray-800'
//           }`}>
//             {integration.isActive ? 'Active' : 'Inactive'}
//           </span>
//         </div>
//       </div>

//       {/* Error/Success Messages */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="flex">
//             <div className="text-red-400">⚠️</div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">Error</h3>
//               <p className="text-sm text-red-700 mt-1">{error}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {success && (
//         <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//           <div className="flex">
//             <div className="text-green-400">✅</div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-green-800">Success</h3>
//               <p className="text-sm text-green-700 mt-1">{success}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Actions */}
//       <div className="space-y-4">
//         {!integration.isActive ? (
//           <div className="text-center py-8">
//             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <span className="text-gray-400 text-2xl">📚</span>
//             </div>
//             <h4 className="text-lg font-medium text-gray-900 mb-2">
//               Connect Google Classroom
//             </h4>
//             <p className="text-gray-600 mb-6">
//               Authorize Smart SIT to access your Google Classroom account
//             </p>
//             <button
//               onClick={handleConnect}
//               disabled={loading}
//               className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//             >
//               {loading ? 'Connecting...' : 'Connect Google Classroom'}
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {/* Sync Courses */}
//             <div className="bg-white border border-gray-200 rounded-lg p-4">
//               <h4 className="font-medium text-gray-900 mb-2">Sync Courses</h4>
//               <p className="text-sm text-gray-600 mb-4">
//                 Import courses and students from Google Classroom
//               </p>
//               <button
//                 onClick={handleSyncCourses}
//                 disabled={loading}
//                 className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
//               >
//                 {loading ? 'Syncing...' : 'Sync Courses'}
//               </button>
//             </div>

//             {/* Synced Courses */}
//             {syncedCourses.length > 0 && (
//               <div className="bg-white border border-gray-200 rounded-lg p-4">
//                 <h4 className="font-medium text-gray-900 mb-3">Recently Synced Courses</h4>
//                 <div className="space-y-2">
//                   {syncedCourses.map((course, index) => (
//                     <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                       <div>
//                         <p className="font-medium text-gray-900">{course.name}</p>
//                         <p className="text-sm text-gray-500">{course.code}</p>
//                       </div>
//                       <span className="text-green-600 text-sm">✓ Synced</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Create Assignment */}
//             <div className="bg-white border border-gray-200 rounded-lg p-4">
//               <div className="flex items-center justify-between mb-4">
//                 <h4 className="font-medium text-gray-900">Create Assignment</h4>
//                 <button
//                   onClick={() => setShowAssignmentForm(!showAssignmentForm)}
//                   className="text-blue-600 hover:text-blue-700 text-sm font-medium"
//                 >
//                   {showAssignmentForm ? 'Cancel' : 'Create New'}
//                 </button>
//               </div>
              
//               {showAssignmentForm && (
//                 <form onSubmit={handleCreateAssignment} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Assignment Title
//                     </label>
//                     <input
//                       type="text"
//                       value={assignmentData.title}
//                       onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
//                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       placeholder="Enter assignment title"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Description
//                     </label>
//                     <textarea
//                       value={assignmentData.description}
//                       onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
//                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       rows="3"
//                       placeholder="Enter assignment description"
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Due Date
//                     </label>
//                     <input
//                       type="datetime-local"
//                       value={assignmentData.dueDate}
//                       onChange={(e) => setAssignmentData({...assignmentData, dueDate: e.target.value})}
//                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       required
//                     />
//                   </div>
                  
//                   <div className="flex space-x-3">
//                     <button
//                       type="submit"
//                       disabled={loading}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//                     >
//                       {loading ? 'Creating...' : 'Create Assignment'}
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setShowAssignmentForm(false)}
//                       className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </form>
//               )}
//             </div>

//             {/* Disconnect */}
//             <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//               <h4 className="font-medium text-red-900 mb-2">Disconnect Integration</h4>
//               <p className="text-sm text-red-700 mb-4">
//                 This will disable the Google Classroom integration and stop automatic syncing.
//               </p>
//               <button
//                 onClick={handleDisconnect}
//                 disabled={loading}
//                 className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
//               >
//                 {loading ? 'Disconnecting...' : 'Disconnect'}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GoogleClassroomIntegration;
