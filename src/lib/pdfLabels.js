/**
 * App UI + PDF strings keyed by ISO 639-1.
 * Non-Latin locales fall back to English — jsPDF Helvetica is WinAnsi-only.
 */
const LABELS = {
  id: {
    // Common
    cancel: 'Batal',
    ok: 'OK',
    save: 'Simpan',
    edit: 'Edit',
    total: 'Total',
    discount: 'Diskon',
    tax: 'Pajak',
    itemsTitle: 'Item',
    noItemsFound: 'Tidak ada item.',
    sharedCost: 'Biaya bersama',
    loginRequired: 'Login Google dulu sebelum menggunakan aplikasi.',

    // Upload
    uploadTitle: 'Unggah Resi',
    loggedIn: 'Sudah login',
    quotaRemaining: 'Sisa kuota',
    quotaFree: (freeRemaining, freeLimit) =>
      `free ${freeRemaining}/${freeLimit}`,
    quotaCredit: (credit) => `+ kredit ${credit}`,
    logout: 'Logout',
    loginRequiredHint: 'Login Google wajib sebelum OCR (5× gratis / bulan).',
    chooseGalleryOrPhoto: 'Pilih dari galeri atau ambil foto resi.',
    selectedReceiptAlt: 'Resi yang dipilih',
    submitting: 'Mengunggah...',
    submit: 'Submit',
    takePhoto: 'Ambil Foto',
    cancelCamera: 'Batalkan Kamera',
    chooseFromGallery: 'Pilih dari Galeri',
    loginFirst: 'Silakan login dengan Google terlebih dahulu.',
    selectImageFirst: 'Silakan pilih atau ambil gambar resi terlebih dahulu.',
    cameraBackFailed:
      'Gagal mengakses kamera belakang atau tidak ditemukan. Mencoba kamera depan...',
    cameraFailed:
      'Gagal mengakses kamera. Pastikan izin kamera telah diberikan.',

    // Receipt details
    receiptDetailsTitle: 'Detail resi',
    loadingReceiptDetails: 'Memuat detail resi...',
    errorPrefix: 'Error',
    goBack: 'Kembali',
    uploadedReceipt: 'Resi terunggah',
    itemCountPayment: (count, paymentLabel) =>
      `${count} item, Pembayaran: ${paymentLabel}`,
    uploadedReceiptAlt: 'Resi terunggah',
    tapToEnlarge: 'Ketuk untuk memperbesar',
    closePreview: 'Tutup pratinjau',
    detailsSection: 'Detail',
    shopName: 'Nama toko',
    shopAddress: 'Alamat toko',
    date: 'Tanggal',
    totalWithDpp: (totalLabel, dppLabel) =>
      `Total: ${totalLabel}, DPP: ${dppLabel}`,
    totalLabelOnly: (totalLabel) => `Total: ${totalLabel}`,
    serviceCharge: 'Service Charge',
    additionalTax: 'Pajak tambahan',
    itemNamePlaceholder: 'Nama item',
    pricePlaceholder: 'Harga',
    quantityPlaceholder: 'Jumlah',
    qtyLabel: (qty) => `Jml: ${qty}`,
    confirmAndSplit: 'Konfirmasi & bagi',
    leaveDetailsTitle: 'Keluar dari detail resi?',
    leaveDetailsUnsaved:
      'Perubahan yang belum disimpan akan hilang, dan data resi ini akan dihapus. Anda yakin ingin keluar?',
    leaveDetailsSaved:
      'Data resi ini akan dihapus dan Anda kembali ke halaman awal. Anda yakin ingin keluar?',
    confirmLeave: 'Ya, keluar',
    taxResetAlert:
      'DPP tidak terdeteksi atau 0, pajak (Tax) telah direset menjadi 0.',

    // Add friends
    addFriendsTitle: 'Tambah teman',
    namePlaceholder: 'Nama',
    removeFriend: 'Hapus teman',
    addAnotherFriend: 'Tambah teman lain',
    done: 'Selesai',
    minTwoFriends: 'Minimal harus ada dua teman.',
    enterAtLeastOneFriend: 'Harap masukkan setidaknya satu nama teman.',
    duplicateFriendNames:
      'Terdapat nama teman yang sama. Harap gunakan nama yang unik.',

    // Split bill
    splitBillTitle: 'Bagi tagihan',
    receiptAlt: 'Resi',
    noReceiptImage: 'Tidak ada gambar resi',
    shareTogether: 'Bagi bareng',
    shareTogetherHelp:
      'Item seperti kantong plastik bisa dibayar bareng. Tekan ikon orang di item, biayanya dibagi rata ke semua.',
    equalSplitHint: 'Rp rata',
    allItemsShared: 'Semua item sudah jadi biaya bersama.',
    noItemsInReceipt: 'Tidak ada item di resi.',
    itemCount: (count) => `${count} item`,
    assignedRemaining: (assigned, remaining) =>
      `(${assigned} sudah dibagi, ${remaining} tersisa)`,
    shareTogetherTitle: 'Bagi bareng: biaya dibagi rata ke semua orang',
    makeSharedAria: (name) => `Jadikan ${name} bagi bareng`,
    splitEvenlyAmongAll: 'Dibagi rata ke semua orang',
    undoShare: 'Batalkan',
    splitAmongPeople: (count, amountLabel) =>
      `Dibagi rata ke ${count} orang · ${amountLabel}/orang`,
    addFriendsToShare: 'Tambah teman dulu untuk membagi biaya ini.',
    whosSplitting: 'Siapa yang bagi?',
    noFriendsAdded: 'Belum ada teman.',
    totalItemsLabel: 'Total item:',
    assignedLabel: 'Sudah dibagi:',
    remainingLabel: 'Sisa:',
    splitAndCharge: 'Bagi & Tagih',
    leaveSplitWarning:
      'Anda memiliki item yang belum dibagi. Apakah Anda yakin ingin meninggalkan halaman ini?',
    selectPersonFirst:
      'Silakan pilih orang yang akan mengassign item terlebih dahulu.',
    availableQtyOnly: (name, qty) =>
      `Kuantitas yang tersedia untuk ${name} hanya ${qty}.`,
    totalQtyOnly: (name, qty) =>
      `Kuantitas total untuk ${name} hanya ${qty}.`,
    notFullyAssigned:
      'Belum semua item dibagi habis atau ada kelebihan pembagian. Pastikan total assigned sama dengan grand total.',

    // Split Complete + PDF
    title: 'Split Selesai',
    youPaid: 'Kamu bayar',
    totalPaid: 'Total dibayar',
    noParticipants: 'Tidak ada peserta atau item yang dibagi.',
    items: 'ITEM',
    noItems: 'Tidak ada item',
    feeSummary: 'RINGKASAN BIAYA',
    personTotal: (name) => `Total ${name}`,
    subtotal: 'Subtotal',
    taxAndService: 'Pajak & Service Charge',
    otherFees: 'Biaya lain',
    exportPdf: 'Unduh PDF',
    preparingPdf: 'Menyiapkan PDF...',
    exportPdfNow: 'Unduh PDF sekarang',
    exportError: 'Gagal unduh PDF. Coba lagi.',
    startNewBill: 'Buat tagihan baru',
    finishConfirmTitle: 'Selesai membagi tagihan?',
    finishConfirmBody:
      'Unduh PDF dulu ya, biar catatan pembagiannya tidak hilang. Kalau lanjut, data ini akan terhapus.',
    notYet: 'Belum',
    confirmNewBill: 'Ya, buat baru',
    generatedBy: (appName) => `Dibuat oleh ${appName}`,
  },
  en: {
    // Common
    cancel: 'Cancel',
    ok: 'OK',
    save: 'Save',
    edit: 'Edit',
    total: 'Total',
    discount: 'Discount',
    tax: 'Tax',
    itemsTitle: 'Items',
    noItemsFound: 'No items found.',
    sharedCost: 'Shared cost',
    loginRequired: 'Sign in with Google before using the app.',

    // Upload
    uploadTitle: 'Upload Receipt',
    loggedIn: 'Logged in',
    quotaRemaining: 'Quota left',
    quotaFree: (freeRemaining, freeLimit) =>
      `free ${freeRemaining}/${freeLimit}`,
    quotaCredit: (credit) => `+ credit ${credit}`,
    logout: 'Logout',
    loginRequiredHint:
      'Google login required before OCR (5 free / month).',
    chooseGalleryOrPhoto: 'Choose from gallery or take a receipt photo.',
    selectedReceiptAlt: 'Selected receipt',
    submitting: 'Uploading...',
    submit: 'Submit',
    takePhoto: 'Take Photo',
    cancelCamera: 'Cancel Camera',
    chooseFromGallery: 'Choose from Gallery',
    loginFirst: 'Please sign in with Google first.',
    selectImageFirst: 'Please select or capture a receipt image first.',
    cameraBackFailed:
      'Could not access the rear camera. Trying the front camera...',
    cameraFailed:
      'Could not access the camera. Please allow camera permission.',

    // Receipt details
    receiptDetailsTitle: 'Receipt details',
    loadingReceiptDetails: 'Loading receipt details...',
    errorPrefix: 'Error',
    goBack: 'Go Back',
    uploadedReceipt: 'Uploaded receipt',
    itemCountPayment: (count, paymentLabel) =>
      `${count} item${count !== 1 ? 's' : ''}, Payment: ${paymentLabel}`,
    uploadedReceiptAlt: 'Uploaded Receipt',
    tapToEnlarge: 'Tap to enlarge',
    closePreview: 'Close preview',
    detailsSection: 'Details',
    shopName: 'Shop Name',
    shopAddress: 'Shop Address',
    date: 'Date',
    totalWithDpp: (totalLabel, dppLabel) =>
      `Total: ${totalLabel}, DPP: ${dppLabel}`,
    totalLabelOnly: (totalLabel) => `Total: ${totalLabel}`,
    serviceCharge: 'Service Charge',
    additionalTax: 'Additional Tax Amount',
    itemNamePlaceholder: 'Item Name',
    pricePlaceholder: 'Price',
    quantityPlaceholder: 'Quantity',
    qtyLabel: (qty) => `Qty: ${qty}`,
    confirmAndSplit: 'Confirm and split',
    leaveDetailsTitle: 'Leave receipt details?',
    leaveDetailsUnsaved:
      'Unsaved changes will be lost, and this receipt data will be cleared. Are you sure you want to leave?',
    leaveDetailsSaved:
      'This receipt data will be cleared and you will return to the start. Are you sure you want to leave?',
    confirmLeave: 'Yes, leave',
    taxResetAlert:
      'DPP was not detected or is 0, so tax has been reset to 0.',

    // Add friends
    addFriendsTitle: 'Add friends',
    namePlaceholder: 'Name',
    removeFriend: 'Remove friend',
    addAnotherFriend: 'Add another friend',
    done: 'Done',
    minTwoFriends: 'You need at least two friends.',
    enterAtLeastOneFriend: 'Please enter at least one friend name.',
    duplicateFriendNames:
      'Duplicate friend names found. Please use unique names.',

    // Split bill
    splitBillTitle: 'Split bill',
    receiptAlt: 'Receipt',
    noReceiptImage: 'No Receipt Image',
    shareTogether: 'Share together',
    shareTogetherHelp:
      'Items like plastic bags can be paid together. Tap the people icon on an item to split the cost evenly.',
    equalSplitHint: 'Equal share',
    allItemsShared: 'All items are already shared costs.',
    noItemsInReceipt: 'No items found in the receipt.',
    itemCount: (count) => `${count} item${count > 1 ? 's' : ''}`,
    assignedRemaining: (assigned, remaining) =>
      `(${assigned} assigned, ${remaining} remaining)`,
    shareTogetherTitle: 'Share together: cost split evenly among everyone',
    makeSharedAria: (name) => `Make ${name} shared`,
    splitEvenlyAmongAll: 'Split evenly among everyone',
    undoShare: 'Undo',
    splitAmongPeople: (count, amountLabel) =>
      `Split among ${count} people · ${amountLabel}/person`,
    addFriendsToShare: 'Add friends first to split this cost.',
    whosSplitting: "Who's splitting?",
    noFriendsAdded: 'No friends added.',
    totalItemsLabel: 'Total items:',
    assignedLabel: 'Assigned:',
    remainingLabel: 'Remaining:',
    splitAndCharge: 'Split and Charge',
    leaveSplitWarning:
      'You still have unassigned items. Are you sure you want to leave this page?',
    selectPersonFirst: 'Please select a person before assigning items.',
    availableQtyOnly: (name, qty) =>
      `Only ${qty} available for ${name}.`,
    totalQtyOnly: (name, qty) =>
      `Total quantity for ${name} is only ${qty}.`,
    notFullyAssigned:
      'Not all items are fully assigned, or there is an over-assignment. Make sure assigned total matches the grand total.',

    // Split Complete + PDF
    title: 'Split Complete',
    youPaid: 'You paid',
    totalPaid: 'Total paid',
    noParticipants: 'No participants found or items assigned.',
    items: 'ITEMS',
    noItems: 'No items',
    feeSummary: 'FEE SUMMARY',
    personTotal: (name) => `Total ${name}`,
    subtotal: 'Subtotal',
    taxAndService: 'Tax & Service Charge',
    otherFees: 'Other fees',
    exportPdf: 'Export PDF',
    preparingPdf: 'Preparing PDF...',
    exportPdfNow: 'Export PDF now',
    exportError: 'Failed to export PDF. Try again.',
    startNewBill: 'Start a new bill',
    finishConfirmTitle: 'Finish splitting this bill?',
    finishConfirmBody:
      'Export a PDF first so your split notes are not lost. Continuing will clear this data.',
    notYet: 'Not yet',
    confirmNewBill: 'Yes, start new',
    generatedBy: (appName) => `Generated by ${appName}`,
  },
};

export function normalizeUiLanguage(languageCode) {
  const code = String(languageCode || 'en')
    .trim()
    .toLowerCase()
    .slice(0, 2);
  return code === 'id' ? 'id' : 'en';
}

export function getUiLabels(languageCode) {
  return LABELS[normalizeUiLanguage(languageCode)];
}

export function getPdfLabels(languageCode) {
  return getUiLabels(languageCode);
}

export function getSplitCompleteLabels(languageCode) {
  return getUiLabels(languageCode);
}
