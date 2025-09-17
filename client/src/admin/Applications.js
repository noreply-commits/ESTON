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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const modalRef = useRef(null); // for PDF

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

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setApplications(data.applications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const exportToExcel = () => {
    const exportData = applications.map(app => ({
      'Application ID': app.id,
      'First Name': app.first_name || '',
      'Last Name': app.last_name || '',
      'Phone Number': app.phone_number || '',
      'Email': app.email || '',
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
    XLSX.writeFile(workbook, `applications_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadPDF = async () => {
    const element = modalRef.current;
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`application_${selectedApplication?.id}.pdf`);
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

        {/* ... Header + Search/Filters + Table (unchanged for brevity) ... */}

        {/* MODAL */}
        {showModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div ref={modalRef} className="relative mx-auto w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 p-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadPDF}
                    title="Download PDF"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedApplication(null);
                    }}
                    className="text-gray-400 hover:text-gray-700 focus:outline-none text-2xl"
                    title="Close"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div><strong>ID:</strong> {selectedApplication.id}</div>
                  <div><strong>Name:</strong> {selectedApplication.first_name} {selectedApplication.middle_name} {selectedApplication.last_name}</div>
                  <div><strong>Phone:</strong> {selectedApplication.phone_number}</div>
                  <div><strong>Email:</strong> {selectedApplication.email}</div>
                  <div><strong>Gender:</strong> {selectedApplication.gender}</div>
                  <div><strong>Nationality:</strong> {selectedApplication.nationality}</div>
                  <div><strong>Residential Address:</strong> {selectedApplication.residential_address}</div>
                  <div><strong>Street Address:</strong> {selectedApplication.street_address}</div>
                  <div><strong>Street Address Line 2:</strong> {selectedApplication.street_address_line_2}</div>
                  <div><strong>City/State/Province:</strong> {selectedApplication.city_state_province}</div>
                  <div><strong>Country:</strong> {selectedApplication.country}</div>
                  <div><strong>Course:</strong> {selectedApplication.course_name || selectedApplication.course}</div>
                  <div><strong>Institution Name:</strong> {selectedApplication.institution_name}</div>
                  <div><strong>Highest Education:</strong> {selectedApplication.highest_education}</div>
                  <div><strong>Date of Birth:</strong> {selectedApplication.date_of_birth}</div>
                  <div><strong>Reason For Course:</strong> {selectedApplication.reason_for_course}</div>
                  <div><strong>How Heard:</strong> {selectedApplication.how_hear}</div>
                  <div><strong>Declaration:</strong> {selectedApplication.declaration ? 'Yes' : 'No'}</div>
                  <div><strong>Status:</strong> {selectedApplication.status}</div>
                  <div><strong>Application Date:</strong> {formatDate(selectedApplication.application_date)}</div>
                  <div className="md:col-span-2"><strong>Admin Notes:</strong> {selectedApplication.admin_notes || 'No notes'}</div>
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
    </div>
  );
};

export default AdminApplications;
