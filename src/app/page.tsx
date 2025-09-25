'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp, Firestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, Auth, User } from "firebase/auth";

// --- KONFIGURASI PENTING ---
// Ganti dengan email yang akan Anda gunakan sebagai Admin
const ADMIN_EMAIL = "novoangga@gmail.com";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCxu3EjhffFR2UFPQkGjDXTq7aGHVCJNPA",
  authDomain: "sistem-arsip-gunungpati.firebaseapp.com",
  projectId: "sistem-arsip-gunungpati",
  storageBucket: "sistem-arsip-gunungpati.firebasestorage.app",
  messagingSenderId: "952353240263",
  appId: "1:952353240263:web:2325af4587e2b21559bae2"
};

// --- Inisialisasi Firebase ---
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase initialization error", e);
}

// --- Tipe Data untuk Arsip ---
type Arsip = {
    id?: string;
    noBerkas: string;
    kodeKlasifikasi: string;
    jenisArsip: string;
    kurunWaktu: string;
    tingkatPerkembangan: string;
    jumlah: string;
    keterangan: string;
    noDefinitif: string;
    lokasiSimpan: string;
    retensiAktif: string;
    retensiInaktif: string;
    nasibAkhir: string;
    kategoriArsip: string;
    fileUrl: string;
    createdAt?: any;
};

// --- KOMPONEN UTAMA ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('list');
  const [editingArsip, setEditingArsip] = useState<Arsip | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const isAdminUser = currentUser?.email === ADMIN_EMAIL;
      setIsAdmin(isAdminUser);
      setAuthLoading(false);
      
      // Logika Navigasi HANYA saat status login berubah
      if (isAdminUser) {
        setPage('home'); // Jika admin login, arahkan ke home
      } else {
        setPage('list'); // Jika logout atau bukan admin, arahkan ke daftar arsip
      }
    });
    return () => unsubscribe();
  }, []); // PERBAIKAN: Dependensi dikosongkan agar hanya berjalan sekali

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert("Login Gagal: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      alert("Logout Gagal: " + error.message);
    }
  };
  
  const navigateTo = (pageName: string) => {
    if(pageName !== 'input') setEditingArsip(null);
    setPage(pageName)
  };

  const handleStartEdit = (arsip: Arsip) => {
    setEditingArsip(arsip);
    navigateTo('input');
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat...</p></div>;
  }
  
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <Navbar navigateTo={navigateTo} currentPage={page} isAdmin={isAdmin} handleLogout={handleLogout} />
      <main className="p-4 md:p-8">
        {page === 'login' && <LoginPage handleLogin={handleLogin} />}
        {isAdmin && page === 'home' && <HomePage navigateTo={navigateTo} />}
        {isAdmin && page === 'input' && <InputArsipPage navigateTo={navigateTo} editingArsip={editingArsip} clearEditing={() => setEditingArsip(null)} />}
        {page === 'list' && <DaftarArsipPage navigateTo={navigateTo} isAdmin={isAdmin} handleStartEdit={handleStartEdit} />}
        {page === 'about' && <AboutPage />}
      </main>
      <Footer />
    </div>
  );
}

// --- KOMPONEN HALAMAN ---

function LoginPage({ handleLogin }: { handleLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-green-800">Login Admin</h2>
        <form onSubmit={onSubmit} className="space-y-6">
          <InputField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <InputField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div>
            <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function HomePage({ navigateTo }: { navigateTo: (page: string) => void }) {
  return (
    <div className="text-center py-20 md:py-32">
      <img src="https://i.ibb.co/6bs02P8/Lambang-Kota-Semarang.png" alt="Logo Kota Semarang" className="mx-auto h-20 w-20 mb-6" />
      <h1 className="text-4xl md:text-6xl font-bold text-green-800 mb-4">Sistem Daftar Arsip Inaktif</h1>
      <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Kecamatan Gunungpati</p>
      <div className="flex justify-center gap-4 flex-wrap">
        <button onClick={() => navigateTo('input')} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-green-700">
          <PlusIcon /> Input Arsip Baru
        </button>
        <button onClick={() => navigateTo('list')} className="flex items-center gap-2 bg-white text-green-600 border border-green-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-green-50">
          <FolderIcon /> Lihat Daftar Arsip
        </button>
      </div>
    </div>
  );
}

function InputArsipPage({ navigateTo, editingArsip, clearEditing }: { navigateTo: (page: string) => void; editingArsip: Arsip | null; clearEditing: () => void; }) {
  const initialState: Arsip = {
    noBerkas: '', kodeKlasifikasi: '', jenisArsip: '', kurunWaktu: new Date().getFullYear().toString(),
    tingkatPerkembangan: 'asli', jumlah: '', keterangan: '', noDefinitif: '',
    lokasiSimpan: '', retensiAktif: '', retensiInaktif: '', nasibAkhir: 'permanen',
    kategoriArsip: 'biasa', fileUrl: ''
  };
  const [formData, setFormData] = useState<Arsip>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingArsip) {
      setFormData(editingArsip);
    } else {
      setFormData(initialState);
    }
  }, [editingArsip]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileUrl) {
      setError('Link lampiran wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      if (!db) throw new Error("Database not initialized");
      
      if (editingArsip && editingArsip.id) {
        const docRef = doc(db, 'arsip', editingArsip.id);
        const { id, ...dataToUpdate } = formData; 
        await updateDoc(docRef, dataToUpdate);
        alert('Arsip berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'arsip'), { ...formData, createdAt: serverTimestamp() });
        alert('Arsip berhasil disimpan!');
      }
      
      clearEditing();
      navigateTo('list');

    } catch (err: any) {
      setError('Gagal menyimpan data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
      clearEditing();
      navigateTo('list');
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-green-800 mb-6">{editingArsip ? 'Edit Arsip' : 'Formulir Input Arsip Baru'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InputField label="No. Berkas" name="noBerkas" value={formData.noBerkas} onChange={handleChange} required />
            <InputField label="Kode Klasifikasi" name="kodeKlasifikasi" value={formData.kodeKlasifikasi} onChange={handleChange} required />
            <InputField label="Jenis Arsip" name="jenisArsip" value={formData.jenisArsip} onChange={handleChange} required />
            <InputField label="Kurun Waktu (Tahun)" name="kurunWaktu" type="number" value={formData.kurunWaktu} onChange={handleChange} required />
             <SelectField label="Tingkat Perkembangan" name="tingkatPerkembangan" value={formData.tingkatPerkembangan} onChange={handleChange} options={['asli', 'copy', 'salinan', 'scan']} />
            <InputField label="Jumlah" name="jumlah" value={formData.jumlah} onChange={handleChange} placeholder="cth: 3 lembar" required/>
          </div>
          <div className="space-y-4">
            <InputField label="Keterangan" name="keterangan" value={formData.keterangan} onChange={handleChange} />
            <InputField label="No. Definitif Folder & Box" name="noDefinitif" value={formData.noDefinitif} onChange={handleChange} placeholder="cth: Fol. 1, Box 1" required />
            <InputField label="Lokasi Simpan" name="lokasiSimpan" value={formData.lokasiSimpan} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-4">
                 <InputField label="Retensi Aktif (thn)" name="retensiAktif" type="number" value={formData.retensiAktif} onChange={handleChange} />
                 <InputField label="Retensi Inaktif (thn)" name="retensiInaktif" type="number" value={formData.retensiInaktif} onChange={handleChange} />
            </div>
             <SelectField label="Keterangan Nasib Akhir" name="nasibAkhir" value={formData.nasibAkhir} onChange={handleChange} options={['permanen', 'musnah', 'dinilai kembali']} />
             <SelectField label="Kategori Arsip" name="kategoriArsip" value={formData.kategoriArsip} onChange={handleChange} options={['biasa', 'terjaga', 'rahasia']} />
          </div>
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700">Link Lampiran File (URL Web)</label>
                <button type="button" onClick={() => window.open('https://drive.google.com/drive/my-drive', '_blank')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLinkIcon /> Buka Google Drive
                </button>
            </div>
            <input type="text" name="fileUrl" id="fileUrl" value={formData.fileUrl} onChange={(e) => handleChange(e as any)} placeholder="Tempel link URL file di sini setelah mengunggahnya" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={handleCancel} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
          <button type="submit" disabled={isSubmitting} className="py-2 px-6 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300">
            {isSubmitting ? 'Menyimpan...' : (editingArsip ? 'Simpan Perubahan' : 'Simpan Arsip')}
          </button>
        </div>
      </form>
    </div>
  );
}


function DaftarArsipPage({ navigateTo, isAdmin, handleStartEdit }: { navigateTo: (page: string) => void; isAdmin: boolean; handleStartEdit: (arsip: Arsip) => void; }) {
  const [arsipList, setArsipList] = useState<Arsip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Arsip | null>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'arsip'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const arsips: Arsip[] = [];
      querySnapshot.forEach((doc) => {
        arsips.push({ id: doc.id, ...doc.data() } as Arsip);
      });
      arsips.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setArsipList(arsips);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!itemToDelete || !itemToDelete.id) return;
    try {
      await deleteDoc(doc(db, "arsip", itemToDelete.id));
      alert(`Arsip "${itemToDelete.noBerkas}" berhasil dihapus.`);
      setItemToDelete(null); 
    } catch (error) {
      console.error("Error removing document: ", error);
      alert("Gagal menghapus arsip.");
      setItemToDelete(null);
    }
  };

  const filteredArsip = arsipList.filter(arsip =>
    Object.values(arsip).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  const handlePrint = () => window.print();
  
  const downloadPDF = async () => {
    try {
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const doc = new jsPDF('landscape');
        (doc as any).autoTable({
            html: '#arsipTable',
            startY: 30,
            headStyles: { fillColor: [210, 244, 222] },
            didParseCell: function(data: any) {
                if ((data.column.dataKey === 'lampiran' || data.column.dataKey === 'aksi') && data.section === 'body') {
                    data.cell.text = '';
                }
            }
        });
        doc.text('Daftar Arsip Inaktif - Kecamatan Gunungpati', 20, 20);
        doc.save('daftar-arsip.pdf');
    } catch (err) {
        console.error("Gagal membuat atau memuat PDF:", err);
        alert("Gagal mengunduh PDF. Pastikan library jspdf sudah terpasang.");
    }
  };

  const downloadCSV = () => {
    const headers = ['No. Berkas', 'Kode Klasifikasi', 'Jenis Arsip', 'Kurun Waktu', 'Jumlah', 'Lokasi Simpan', 'Link File'];
    const rows = filteredArsip.map(arsip => [
      `"${arsip.noBerkas || ''}"`, `"${arsip.kodeKlasifikasi || ''}"`, `"${arsip.jenisArsip || ''}"`,
      `"${arsip.kurunWaktu || ''}"`, `"${arsip.jumlah || ''}"`, `"${arsip.lokasiSimpan || ''}"`,
      `"${arsip.fileUrl || ''}"`
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "daftar-arsip.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-lg" id="print-area">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 print-hide">
          <h2 className="text-2xl font-bold text-green-800">Daftar Arsip</h2>
          <input type="text" placeholder="Cari arsip..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border p-2 rounded-md w-full md:w-64" />
        </div>
        <div className="flex flex-col md:flex-row justify-end items-center mb-4 gap-2 print-hide">
          <ActionButton onClick={handlePrint} icon={<PrintIcon />} text="Print" />
          <ActionButton onClick={downloadCSV} icon={<DownloadIcon />} text="Unduh CSV" />
          <ActionButton onClick={downloadPDF} icon={<DownloadIcon />} text="Unduh PDF" />
          {isAdmin && (
            <button onClick={() => navigateTo('input')} className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700">
              <PlusIcon /> Input Arsip Baru
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          {loading ? <p>Memuat data...</p> : (
              <table className="w-full text-sm text-left text-gray-500" id="arsipTable">
                  <thead className="text-xs text-green-900 uppercase bg-green-200">
                      <tr>
                          <th scope="col" className="px-4 py-3">No.</th>
                          <th scope="col" className="px-4 py-3">No. Berkas</th>
                          <th scope="col" className="px-4 py-3">Jenis Arsip</th>
                          <th scope="col" className="px-4 py-3">Kurun Waktu</th>
                          <th scope="col" className="px-4 py-3">Lokasi</th>
                          <th scope="col" className="px-4 py-3 print-hide" data-jspdf-skip="true">Lampiran</th>
                          {isAdmin && <th scope="col" className="px-4 py-3 print-hide" data-jspdf-skip="true">Aksi</th>}
                      </tr>
                  </thead>
                  <tbody>
                  {filteredArsip.map((arsip, index) => (
                      <tr key={arsip.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{arsip.noBerkas}</td>
                          <td className="px-4 py-3">{arsip.jenisArsip}</td>
                          <td className="px-4 py-3">{arsip.kurunWaktu}</td>
                          <td className="px-4 py-3">{arsip.lokasiSimpan}</td>
                          <td className="px-4 py-3 print-hide">
                              <a href={arsip.fileUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                  Lihat File
                              </a>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 print-hide">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleStartEdit(arsip)} className="text-blue-500 hover:text-blue-700 p-1">
                                  <EditIcon />
                                </button>
                                <button onClick={() => setItemToDelete(arsip)} className="text-red-500 hover:text-red-700 p-1">
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          )}
                      </tr>
                  ))}
                  {filteredArsip.length === 0 && (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-10">Tidak ada data.</td></tr>
                  )}
                  </tbody>
              </table>
          )}
        </div>
        <style>{`
              @media print {
                  body * { visibility: hidden; }
                  #print-area, #print-area * { visibility: visible; }
                  #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                  .print-hide { display: none; }
              }
          `}</style>
      </div>
      
      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4">Konfirmasi Penghapusan</h3>
            <p>Apakah Anda yakin ingin menghapus arsip dengan No. Berkas: <span className="font-semibold">"{itemToDelete.noBerkas}"</span>?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setItemToDelete(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
              <button onClick={handleDelete} className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Tentang Sistem Arsip Inaktif</h2>
      <div className="space-y-4 text-gray-700">
        <p>Website ini dirancang sebagai solusi modern untuk pengelolaan arsip inaktif di lingkungan Kantor Kecamatan Gunungpati. Tujuannya adalah untuk mempermudah proses penyimpanan, pencarian, dan pemeliharaan arsip yang sudah tidak aktif digunakan dalam kegiatan sehari-hari namun masih memiliki nilai guna.</p>
        <h3 className="text-xl font-semibold text-green-700 pt-4">Mengapa Digitalisasi Arsip Penting?</h3>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Efisiensi Ruang:</strong> Mengurangi kebutuhan ruang fisik untuk menyimpan tumpukan dokumen.</li>
          <li><strong>Kemudahan Akses:</strong> Mempercepat proses pencarian dan penemuan kembali arsip kapanpun dibutuhkan.</li>
          <li><strong>Keamanan Data:</strong> Melindungi arsip dari risiko kerusakan fisik seperti kebakaran, kebanjiran, atau serangan hama.</li>
          <li><strong>Transparansi & Akuntabilitas:</strong> Memudahkan pelacakan dan audit dokumen pemerintahan.</li>
        </ul>
        <p>Dengan beralih ke sistem digital, kita tidak hanya mengamankan aset informasi penting, tetapi juga meningkatkan efisiensi dan efektivitas kerja di era modern.</p>
      </div>
    </div>
  );
}

// --- KOMPONEN BANTUAN ---

function Navbar({ navigateTo, currentPage, isAdmin, handleLogout }: { navigateTo: (page: string) => void, currentPage: string, isAdmin: boolean, handleLogout: () => Promise<void> }) {
  const NavLink = ({ pageName, children, adminOnly = false }: { pageName: string, children: React.ReactNode, adminOnly?: boolean }) => {
    if (adminOnly && !isAdmin) return null;
    return (
      <button onClick={() => navigateTo(pageName.toLowerCase().replace(/ /g, ''))} className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${ currentPage === pageName.toLowerCase().replace(/ /g, '') ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-green-50 hover:text-green-700' }`}>
        {children}
      </button>
    );
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <nav className="container mx-auto px-4 md:px-8 flex justify-between items-center py-3">
        <div className="flex items-center gap-2"> <ArchiveIcon /> <span className="text-lg font-bold text-green-800">Arsip Digital</span></div>
        <div className="flex items-center gap-2 md:gap-4">
          <NavLink pageName="home" adminOnly={true}>Home</NavLink>
          <NavLink pageName="input" adminOnly={true}>Input Arsip</NavLink>
          <NavLink pageName="list">Daftar Arsip</NavLink>
          <NavLink pageName="about">Tentang</NavLink>
          {isAdmin ? (
            <button onClick={handleLogout} className="py-2 px-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">Logout</button>
          ) : (
            <NavLink pageName="login">Login</NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}


const Footer = () => ( <footer className="text-center py-4 mt-10 text-sm text-gray-500"><p>&copy; {new Date().getFullYear()} Sistem Arsip Digital Kecamatan Gunungpati. All rights reserved.</p></footer>);
const InputField = ({ label, name, value, onChange, type = 'text', placeholder, required = false }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; required?: boolean }) => (<div><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"/></div>);
const SelectField = ({ label, name, value, onChange, options, required = false }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; required?: boolean }) => (<div><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><select name={name} id={name} value={value} onChange={onChange} required={required} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">{options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}</select></div>);
const ActionButton = ({ onClick, icon, text }: { onClick: () => void; icon: React.ReactNode; text: string }) => (<button onClick={onClick} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 font-semibold py-2 px-4 rounded-md hover:bg-gray-100">{icon}{text}</button>);

// --- IKON SVG ---
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const FolderIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>);
const ArchiveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>);
const PrintIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>);
const DownloadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
const ExternalLinkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>);

