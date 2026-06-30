import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { FiCamera, FiType, FiCheck, FiAlertCircle, FiUpload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import './QRScan.css';

const QRScan = () => {
    const [mode, setMode] = useState('camera'); // 'camera', 'upload', or 'manual'
    const [manualCode, setManualCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scannedProduct, setScannedProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannerError, setScannerError] = useState(null);
    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);
    const isMountedRef = useRef(true);
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const isProcessingRef = useRef(false);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (html5QrCodeRef.current) {
                try {
                    html5QrCodeRef.current.stop().catch(() => { });
                } catch (e) { }
                html5QrCodeRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (mode === 'camera' && !scannedProduct && isMountedRef.current) {
            const timer = setTimeout(() => startScanner(), 200);
            return () => clearTimeout(timer);
        }
    }, [mode, scannedProduct]);

    const startScanner = async () => {
        if (!isMountedRef.current) return;

        try {
            setScannerError(null);

            // Check if browser supports mediaDevices
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setScannerError('Browser does not support camera access or is not in a secure context (HTTPS/localhost).');
                return;
            }

            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                } catch (e) { }
                html5QrCodeRef.current = null;
            }

            const element = document.getElementById("qr-reader");
            if (!element) {
                setTimeout(() => startScanner(), 300);
                return;
            }

            const formatsToSupport = [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.UPC_A,
            ];

            html5QrCodeRef.current = new Html5Qrcode("qr-reader", { formatsToSupport });

            const config = {
                fps: 30,
                qrbox: { width: 300, height: 300 },
                aspectRatio: 1.0,
                disableFlip: false,
                experimentalFeatures: { useBarCodeDetectorIfSupported: true }
            };

            // Log attempt
            console.log('Attempting to start camera...');

            await html5QrCodeRef.current.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                (errorMessage) => {
                    // This is called on every frame where no code is found, skip it
                }
            ).catch(err => {
                console.error('Html5Qrcode start error:', err);
                throw err;
            });

            if (isMountedRef.current) setScanning(true);
        } catch (error) {
            console.error('Detailed Scanner error:', error);
            if (isMountedRef.current) {
                let msg = 'Unable to access camera.';
                if (error.name === 'NotAllowedError') msg = 'Camera permission denied. Please enable it in browser settings.';
                else if (error.name === 'NotFoundError') msg = 'No camera found on this device.';
                else if (error.name === 'NotReadableError') msg = 'Camera is already in use by another application.';
                else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    msg = 'Camera requires HTTPS. Please use the https:// link provided.';
                }

                setScannerError(`${msg} Error: ${error.name || 'Unknown'}`);
            }
        }
    };

    const stopScanner = useCallback(async () => {
        setScanning(false);
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch (error) { }
            html5QrCodeRef.current = null;
        }
    }, []);

    const onScanSuccess = async (decodedText) => {
        if (isProcessingRef.current || !isMountedRef.current) return;
        isProcessingRef.current = true;

        console.log('Code detected:', decodedText);
        toast.info(`Scanned: ${decodedText}`);

        await stopScanner();
        await searchProduct(decodedText);

        isProcessingRef.current = false;
    };

    // Handle image file upload
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setScannerError(null);

        try {
            const formatsToSupport = [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_E,
            ];

            const scanner = new Html5Qrcode("qr-file-reader", { formatsToSupport });

            const result = await scanner.scanFile(file, true);
            console.log('Image scan result:', result);
            toast.success(`Found code: ${result}`);

            await searchProduct(result);

            scanner.clear();
        } catch (error) {
            console.error('Image scan error:', error);
            toast.error('No QR code or barcode found in the image. Please try another image.');
            setScannerError('Could not find a code in this image.');
        } finally {
            setLoading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleManualSearch = async () => {
        if (!manualCode.trim()) {
            toast.error('Please enter a product code');
            return;
        }
        await searchProduct(manualCode.trim());
    };

    const searchProduct = async (qrCode) => {
        setLoading(true);
        try {
            const response = await productService.getByQR(qrCode);
            setScannedProduct(response.data);
            toast.success('Product found!');
        } catch (error) {
            toast.error('Product not found. Please try again.');
            if (mode === 'camera' && isMountedRef.current) {
                setTimeout(() => startScanner(), 1500);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (scannedProduct) {
            const success = await addToCart(scannedProduct._id);
            if (success) navigate('/cart');
        }
    };

    const resetScan = () => {
        setScannedProduct(null);
        setManualCode('');
        setScannerError(null);
        if (mode === 'camera') {
            setTimeout(() => startScanner(), 500);
        }
    };

    const switchMode = async (newMode) => {
        if (newMode === mode) return;
        await stopScanner();
        setMode(newMode);
        setScannerError(null);
    };

    return (
        <div className="scan-page page">
            <div className="container container-md">
                <div className="page-header text-center">
                    <h1 className="page-title">Scan & Shop</h1>
                    <p className="page-subtitle">Scan QR codes or barcodes to add items to your cart</p>
                </div>

                {/* Mode Toggle - 3 options */}
                <div className="mode-toggle">
                    <button
                        className={`mode-btn ${mode === 'camera' ? 'active' : ''}`}
                        onClick={() => switchMode('camera')}
                    >
                        <FiCamera /> Camera
                    </button>
                    <button
                        className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
                        onClick={() => switchMode('upload')}
                    >
                        <FiUpload /> Upload
                    </button>
                    <button
                        className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
                        onClick={() => switchMode('manual')}
                    >
                        <FiType /> Manual
                    </button>
                </div>

                {/* Hidden element for file scanning */}
                <div id="qr-file-reader" style={{ display: 'none' }}></div>

                {!scannedProduct ? (
                    <div className="scan-area">
                        {mode === 'camera' && (
                            <div className="camera-container">
                                {scannerError ? (
                                    <div className="scanner-error">
                                        <FiAlertCircle size={48} />
                                        <p>{scannerError}</p>
                                        <button className="btn btn-primary" onClick={() => startScanner()}>
                                            Try Again
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="camera-frame">
                                            <div id="qr-reader"></div>
                                        </div>
                                        <p className="scan-hint">
                                            {scanning ? 'Point camera at QR code or barcode' : 'Starting camera...'}
                                        </p>
                                        {loading && <p className="loading-text">Searching product...</p>}
                                    </>
                                )}
                            </div>
                        )}

                        {mode === 'upload' && (
                            <div className="upload-container">
                                <div className="upload-box">
                                    <FiUpload size={48} />
                                    <h3>Upload QR Code Image</h3>
                                    <p>Take a photo or choose an image with a QR code or barcode</p>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleImageUpload}
                                        className="file-input"
                                        id="qr-image-input"
                                    />
                                    <label htmlFor="qr-image-input" className="btn btn-primary btn-lg">
                                        {loading ? 'Scanning...' : 'Choose Image or Take Photo'}
                                    </label>
                                </div>

                                {scannerError && (
                                    <div className="upload-error">
                                        <FiAlertCircle />
                                        <span>{scannerError}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'manual' && (
                            <div className="manual-entry">
                                <div className="form-group">
                                    <label className="form-label">Product Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter product code (e.g., SM-123456-AB12)"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary btn-lg w-full"
                                    onClick={handleManualSearch}
                                    disabled={loading}
                                >
                                    {loading ? 'Searching...' : 'Search Product'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="product-result animate-slideUp">
                        <div className="result-icon success">
                            <FiCheck size={40} />
                        </div>
                        <h2>Product Found!</h2>

                        <div className="product-details card">
                            <div className="product-image-large">
                                <img src={scannedProduct.image || '/images/default-product.png'} alt={scannedProduct.name} />
                            </div>
                            <div className="product-info-large">
                                <span className="product-category">{scannedProduct.category}</span>
                                <h3>{scannedProduct.name}</h3>
                                <p className="product-price-large">₹{scannedProduct.price.toFixed(2)}</p>
                                <p className="stock-info">
                                    {scannedProduct.stock > 0 ? (
                                        <span className="text-success">✓ {scannedProduct.stock} items in stock</span>
                                    ) : (
                                        <span className="text-error">✗ Out of stock</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="result-actions">
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleAddToCart}
                                disabled={scannedProduct.stock === 0}
                            >
                                Add to Cart
                            </button>
                            <button className="btn btn-outline btn-lg" onClick={resetScan}>
                                Scan Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScan;
