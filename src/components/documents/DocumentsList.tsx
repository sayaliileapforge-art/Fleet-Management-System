import { useState, useEffect } from 'react';
import { Plus, Search, FileText, X, Upload, Image, Eye, Calendar, Tag, Link, User, Trash2 } from 'lucide-react';
import { supabase, vehicleService, driverService } from '../../services/supabase';

interface Document {
  id: string;
  name: string;
  category: string;
  linkedTo: string;
  linkedType: string;
  uploadDate: string;
  expiry: string;
  status: string;
  createdAt: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
}

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Insurance',
    linkedType: 'Vehicle',
    linkedTo: '',
    expiry: '',
    status: 'Valid'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);
  const [viewFileData, setViewFileData] = useState<{ data: string; type: string; name: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, vehiclesData, driversData] = await Promise.all([
        supabase.from('Document').select('*').order('createdAt', { ascending: false }),
        vehicleService.getAll(),
        driverService.getAll()
      ]);
      
      setDocuments(docsData.data || []);
      setVehicles(vehiclesData || []);
      setDrivers(driversData || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let fileUrl = null;
      let fileName = null;
      let fileType = null;
      
      // If there's a file, upload it to Supabase Storage
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Upload error details:', uploadError);
          alert(`Upload error: ${uploadError.message || JSON.stringify(uploadError)}`);
          throw new Error('Failed to upload file');
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
        fileName = selectedFile.name;
        fileType = selectedFile.type;
      }
      
      // Build document data
      const documentData: any = {
        name: formData.name,
        category: formData.category,
        linkedType: formData.linkedType,
        linkedTo: formData.linkedTo,
        uploadDate: today,
        expiry: formData.expiry || null,
        status: formData.status,
        fileUrl: fileUrl,
        fileName: fileName,
        fileType: fileType
      };
      
      const { data, error } = await supabase
        .from('Document')
        .insert([documentData])
        .select();

      if (error) throw error;

      await loadData();
      setFormData({
        name: '',
        category: 'Insurance',
        linkedType: 'Vehicle',
        linkedTo: '',
        expiry: '',
        status: 'Valid'
      });
      setSelectedFile(null);
      setFilePreview(null);
      setShowAddModal(false);
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  // Function to view document with file
  const handleViewDocument = async (doc: Document) => {
    setViewDocument(doc);
    
    // If document has a fileUrl, fetch it
    if (doc.fileUrl) {
      try {
        // For images, we can use the URL directly
        if (doc.fileType?.startsWith('image/')) {
          setViewFileData({
            data: doc.fileUrl,
            type: doc.fileType,
            name: doc.fileName || doc.name
          });
        } else {
          // For other files, provide download link
          setViewFileData({
            data: doc.fileUrl,
            type: doc.fileType || 'application/octet-stream',
            name: doc.fileName || doc.name
          });
        }
      } catch (error) {
        console.error('Error loading file:', error);
        setViewFileData(null);
      }
    } else {
      setViewFileData(null);
    }
  };

  // Function to delete document
  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // If document has a file in storage, delete it
      if (doc.fileUrl) {
        const filePath = doc.fileUrl.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('documents')
            .remove([filePath]);
        }
      }
      
      const { error } = await supabase
        .from('Document')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      alert('Document deleted successfully!');
      await loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const filtered = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.linkedTo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all documents with expiry reminders</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Upload Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upload Document</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Vehicle Insurance Policy"
                  required
                />
              </div>

              {/* Document File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Photo/File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  {selectedFile ? (
                    <div className="space-y-2">
                      {filePreview ? (
                        <div className="relative inline-block">
                          <img 
                            src={filePreview} 
                            alt="Preview" 
                            className="max-h-32 mx-auto rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <FileText className="w-8 h-8" />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 truncate max-w-full">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <div className="p-3 bg-blue-50 rounded-full">
                            <Upload className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC up to 10MB</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Insurance">Insurance</option>
                  <option value="Registration">Registration</option>
                  <option value="License">License</option>
                  <option value="Permit">Permit</option>
                  <option value="Invoice">Invoice</option>
                  <option value="POD">POD</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link To</label>
                <select
                  value={formData.linkedType}
                  onChange={(e) => setFormData({...formData, linkedType: e.target.value, linkedTo: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Vehicle">Vehicle</option>
                  <option value="Driver">Driver</option>
                  <option value="General">General</option>
                </select>
              </div>

              {formData.linkedType === 'Vehicle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
                  <select
                    value={formData.linkedTo}
                    onChange={(e) => setFormData({...formData, linkedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNo || v.name}>{v.vehicleNo} - {v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.linkedType === 'Driver' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
                  <select
                    value={formData.linkedTo}
                    onChange={(e) => setFormData({...formData, linkedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Valid">Valid</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={!formData.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Documents</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{documents.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Valid</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{documents.filter(d => d.status === 'Valid').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Expiring Soon</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">{documents.filter(d => d.status === 'Expiring Soon').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{documents.filter(d => d.status === 'Active').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Insurance">Insurance</option>
            <option value="Registration">Registration</option>
            <option value="License">License</option>
            <option value="Permit">Permit</option>
            <option value="Invoice">Invoice</option>
            <option value="POD">POD</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Document ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Linked To</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No documents found. Click "Upload Document" to add one.'}
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleViewDocument(doc)}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 hover:text-blue-600 hover:underline">{doc.name}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{doc.linkedTo || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.uploadDate || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.expiry || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        doc.status === 'Valid' ? 'bg-green-100 text-green-700' :
                        doc.status === 'Expiring Soon' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewDocument(doc)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Document Modal */}
      {viewDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Document Details</h2>
              <button 
                onClick={() => setViewDocument(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Document Preview */}
              <div className="flex justify-center">
                {viewFileData ? (
                  viewFileData.type.startsWith('image/') ? (
                    <div className="max-w-full">
                      <img 
                        src={viewFileData.data} 
                        alt={viewDocument.name}
                        className="max-h-64 rounded-lg shadow-lg"
                      />
                      <p className="text-center text-sm text-gray-500 mt-2">{viewFileData.name}</p>
                      <div className="flex justify-center mt-3">
                        <a 
                          href={viewFileData.data} 
                          download={viewFileData.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Download File
                        </a>
                      </div>
                    </div>
                  ) : viewFileData.type === 'application/pdf' ? (
                    <div className="w-full">
                      <iframe
                        src={viewFileData.data}
                        className="w-full h-64 rounded-lg border border-gray-200"
                        title={viewDocument.name}
                      />
                      <p className="text-center text-sm text-gray-500 mt-2">{viewFileData.name}</p>
                      <div className="flex justify-center mt-3">
                        <a 
                          href={viewFileData.data} 
                          download={viewFileData.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="p-6 bg-blue-50 rounded-xl inline-block">
                        <FileText className="w-16 h-16 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{viewFileData.name}</p>
                      <div className="flex justify-center mt-3">
                        <a 
                          href={viewFileData.data} 
                          download={viewFileData.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          <Upload className="w-4 h-4" />
                          Download File
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-6 bg-gray-100 rounded-xl text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">No file attached</p>
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">{viewDocument.name}</h3>
                <span className={`inline-flex px-3 py-1 mt-2 text-sm font-medium rounded-full ${
                  viewDocument.status === 'Valid' ? 'bg-green-100 text-green-700' :
                  viewDocument.status === 'Expiring Soon' ? 'bg-orange-100 text-orange-700' :
                  viewDocument.status === 'Expired' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {viewDocument.status}
                </span>
              </div>

              {/* Document Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Tag className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">{viewDocument.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Link className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Linked To ({viewDocument.linkedType})</p>
                    <p className="font-medium text-gray-900">{viewDocument.linkedTo || 'Not linked'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Upload Date</p>
                    <p className="font-medium text-gray-900">{viewDocument.uploadDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className={`font-medium ${
                      viewDocument.status === 'Expiring Soon' ? 'text-orange-600' :
                      viewDocument.status === 'Expired' ? 'text-red-600' :
                      'text-gray-900'
                    }`}>
                      {viewDocument.expiry || 'No expiry'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Document ID</p>
                    <p className="font-medium text-gray-900 text-sm">{viewDocument.id}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setViewDocument(null);
                  setViewFileData(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {viewFileData && (
                <button
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Download the file
                    const link = document.createElement('a');
                    link.href = viewFileData.data;
                    link.download = viewFileData.name;
                    link.click();
                  }}
                >
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
