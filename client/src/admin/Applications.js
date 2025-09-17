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

// 🔧 New imports
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // 📌 Ref for the modal to generate PDF
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchApplications();
    }, 500);

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

  // 📌 PDF download function
  const downloadPDF = async () => {
    if (!pdfRef.current) return;

    const element = pdfRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pdfHeight);
    pdf.save(`application_${selectedApplication?.id || 'download'}.pdf`);
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

  const filteredApplications = applications;

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

  // The rest of your component stays the same until the modal...
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ... rest of UI above remains unchanged ... */}

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

            {/* 📌 Wrap modal content in ref */}
            <div className="px-6 py-6" ref={pdfRef}>
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
            </div>

            {/* 📌 Download and Close buttons */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={downloadPDF}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow mr-4"
              >
                Download as PDF
              </button>
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
      )}
    </div>
  );
};

export default AdminApplications;
