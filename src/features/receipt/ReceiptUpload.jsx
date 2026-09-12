import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  uploadReceipt,
  setOriginalImageUrl,
} from './receiptSlice';
import { dataURLtoBlob } from '../../lib/receiptEdit';

function ReceiptUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { receiptData, loading, error } = useSelector((state) => state.receipt);

  useEffect(() => {
    if (error) {
      showCustomModal(error);
    }
  }, [error]);

  useEffect(() => {
    if (receiptData) {
      navigate('/details');
    }
  }, [receiptData, navigate]);

  const showCustomModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeCustomModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  const handleChooseFromGallery = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      showCustomModal('Silakan pilih atau ambil gambar resi terlebih dahulu.');
      return;
    }

    try {
      const imageBlob = dataURLtoBlob(selectedImage);
      await dispatch(uploadReceipt(imageBlob)).unwrap();
    } catch {
      // Error sudah ditangani lewat state.error + modal
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        dispatch(setOriginalImageUrl(reader.result));
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: 'environment' },
        },
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        showCustomModal(
          'Gagal mengakses kamera belakang atau tidak ditemukan. Mencoba kamera depan...'
        );
        try {
          const mediaStreamFront = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          setStream(mediaStreamFront);
          setIsCameraActive(true);
        } catch {
          showCustomModal(
            'Gagal mengakses kamera. Pastikan izin kamera telah diberikan.'
          );
        }
      } else {
        showCustomModal(
          'Gagal mengakses kamera. Pastikan izin kamera telah diberikan.'
        );
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject;
      currentStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setStream(null);
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageURL = canvas.toDataURL('image/png');
      setSelectedImage(imageURL);
      dispatch(setOriginalImageUrl(imageURL));
      stopCamera();
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleResetSelectedImage = () => {
    setSelectedImage(null);
    dispatch(setOriginalImageUrl(null));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          {selectedImage ? (
            <button
              className="text-gray-600 font-semibold"
              onClick={handleResetSelectedImage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <></>
          )}
          <h2 className="text-xl font-semibold text-gray-800 flex-grow text-center">
            Unggah Resi
          </h2>
          {!selectedImage && <div className="w-6 h-6"></div>}
        </div>

        <div
          className="relative rounded-md border-2 border-dashed border-gray-400 p-4 mb-4 flex items-center justify-center overflow-hidden"
          style={{ minHeight: '200px' }}
        >
          {selectedImage ? (
            <img
              src={selectedImage}
              alt="Resi yang dipilih"
              className="w-full h-auto object-contain rounded-md"
            />
          ) : isCameraActive ? (
            <video
              ref={videoRef}
              className="w-full h-auto rounded-md"
              autoPlay
              playsInline
            />
          ) : (
            <div className="text-center text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm mt-2">
                Pilih dari galeri atau ambil foto resi.
              </p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {selectedImage ? (
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSubmit}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Mengunggah...' : 'Submit'}
            </button>
            <button
              onClick={handleResetSelectedImage}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-md transition duration-300 ease-in-out"
              disabled={loading}
            >
              Batal
            </button>
          </div>
        ) : (
          <div>
            {isCameraActive ? (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleTakePhoto}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 rounded-md transition duration-300 ease-in-out"
                >
                  Ambil Foto
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 rounded-md transition duration-300 ease-in-out"
                >
                  Batalkan Kamera
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={handleChooseFromGallery}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition duration-300 ease-in-out"
                >
                  Pilih dari Galeri
                </button>
                <button
                  onClick={startCamera}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 rounded-md transition duration-300 ease-in-out"
                >
                  Ambil Foto
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-4">{modalMessage}</p>
            <button
              onClick={closeCustomModal}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiptUpload;
