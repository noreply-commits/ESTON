import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Check,
  X,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminNavbar from './AdminNavbar';

const API_URL = process.env.REACT_APP_API_URL;

const AdminApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchApplications();
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm, statusFilter]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/applications?search=${searchTerm}&status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus, notes = '') => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, admin_notes: notes, review_date: new Date().toISOString() }
          : app
      ));

      setShowModal(false);
      setSelectedApplication(null);
      alert('Application status updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredApplications = applications; // Filtering is now handled by the backend

  const exportToExcel = () => {
    const exportData = filteredApplications.map(app => ({
      'Application ID': app.id,
      'First Name': app.user_first_name || app.first_name || '',
      'Last Name': app.user_last_name || app.last_name || '',
      'Phone Number': app.phone_number || '',
      'Email': app.user_email || app.email || '',
      'Gender': app.gender || '',
      'Nationality': app.nationality || '',
      'Residential Address': app.residential_address || '',
      'Street Address': app.street_address || '',
      'Country': app.country || '',
      'Course Name': app.course_name || '',
      'Highest Education': app.highest_education || '',
      'Status': app.status,
      'Application Date': formatDate(app.application_date),
      'Admin Notes': app.admin_notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    const fileName = `applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Applications</h1>
          <p className="text-gray-600">Review and manage all course applications</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, course, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={exportToExcel}
                disabled={filteredApplications.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={fetchApplications}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
        <tr>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-2 py-4 whitespace-nowrap">{application.id}</td>
                    <td className="px-2 py-4 whitespace-nowrap">{application.first_name} {application.last_name}</td>
                    <td className="px-2 py-4 whitespace-nowrap">{application.phone_number}</td>
                    <td className="px-2 py-4 whitespace-nowrap">{application.email}</td>
                    <td className="px-2 py-4 whitespace-nowrap">{application.course_name || application.course}</td>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        <div className="flex items-center">
                          {getStatusIcon(application.status)}
                          <span className="ml-1 capitalize">{application.status}</span>
                        </div>
                      </span>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap">{formatDate(application.application_date)}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* No Applications Message */}
        {filteredApplications.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mt-6">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600">
              {applications.length === 0 
                ? 'There are no applications to review yet.'
                : 'No applications match your current filters.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative mx-auto w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 p-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApplication(null);
                }}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
                title="Close"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div><span className="font-semibold text-gray-700">ID:</span> {selectedApplication.id}</div>
                <div><span className="font-semibold text-gray-700">Name:</span> {selectedApplication.first_name} {selectedApplication.middle_name} {selectedApplication.last_name}</div>
                <div><span className="font-semibold text-gray-700">Phone Number:</span> {selectedApplication.phone_number}</div>
                <div><span className="font-semibold text-gray-700">Email:</span> {selectedApplication.email}</div>
                <div><span className="font-semibold text-gray-700">Gender:</span> {selectedApplication.gender}</div>
                <div><span className="font-semibold text-gray-700">Nationality:</span> {selectedApplication.nationality}</div>
                <div><span className="font-semibold text-gray-700">Residential Address:</span> {selectedApplication.residential_address}</div>
                <div><span className="font-semibold text-gray-700">Street Address:</span> {selectedApplication.street_address}</div>
                <div><span className="font-semibold text-gray-700">Street Address Line 2:</span> {selectedApplication.street_address_line_2}</div>
                <div><span className="font-semibold text-gray-700">City/State/Province:</span> {selectedApplication.city_state_province}</div>
                <div><span className="font-semibold text-gray-700">Country:</span> {selectedApplication.country}</div>
                <div><span className="font-semibold text-gray-700">Course:</span> {selectedApplication.course_name || selectedApplication.course}</div>
                <div><span className="font-semibold text-gray-700">Institution Name:</span> {selectedApplication.institution_name}</div>
                <div><span className="font-semibold text-gray-700">Highest Education:</span> {selectedApplication.highest_education}</div>
                <div><span className="font-semibold text-gray-700">Date of Birth:</span> {selectedApplication.date_of_birth}</div>
                <div><span className="font-semibold text-gray-700">Reason For Course:</span> {selectedApplication.reason_for_course}</div>
                <div><span className="font-semibold text-gray-700">How Heard:</span> {selectedApplication.how_hear}</div>
                <div><span className="font-semibold text-gray-700">Declaration:</span> {selectedApplication.declaration ? 'Yes' : 'No'}</div>
                <div><span className="font-semibold text-gray-700">Status:</span> {selectedApplication.status}</div>
                <div><span className="font-semibold text-gray-700">Application Date:</span> {formatDate(selectedApplication.application_date)}</div>
                <div className="md:col-span-2"><span className="font-semibold text-gray-700">Admin Notes:</span> {selectedApplication.admin_notes || 'No notes'}</div>
              </div>
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedApplication(null);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
