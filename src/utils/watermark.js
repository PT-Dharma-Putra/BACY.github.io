const watermarkedCache = new Map();

/**
 * Menghasilkan Data URL gambar dengan watermark (Logo + Teks)
 * @param {string} src - URL sumber gambar
 * @returns {Promise<string>} - Mengembalikan Data URL gambar ber-watermark
 */
export async function getWatermarkedDataUrl(src) {
    // Gunakan cache jika sudah pernah diproses
    if (watermarkedCache.has(src)) {
        return watermarkedCache.get(src);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const logo = new Image();
        
        const isCrossOrigin = (url) => {
            if (!url) return false;
            if (url.startsWith('/') || url.startsWith('.') || !url.includes('://')) {
                return false;
            }
            try {
                const urlObj = new URL(url, window.location.origin);
                return urlObj.origin !== window.location.origin;
            } catch (e) {
                return false;
            }
        };

        if (isCrossOrigin(src)) {
            img.crossOrigin = "anonymous";
        }
        
        let imagesLoaded = 0;
        const totalImages = 2;

        const checkLoaded = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                processImage();
            }
        };

        const processImage = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Canvas 2D context is not supported');
                }
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                // 1. Gambar original
                ctx.drawImage(img, 0, 0);
                
                // 2. Tambahkan Logo PT BACY (tanpa background)
                const logoScale = 0.15;
                const logoWidth = canvas.width * logoScale;
                const logoHeight = (logo.height / logo.width) * logoWidth;
                const padding = canvas.width * 0.02;
                
                const logoX = canvas.width - logoWidth - padding;
                const logoY = canvas.height - logoHeight - padding;
                
                ctx.save();
                ctx.globalAlpha = 0.8; // Membuat logo semi-transparan agar menyatu dengan gambar
                ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
                ctx.restore();
                
                // 3. Tambahkan Teks Watermark
                const fontSize = Math.max(img.width * 0.04, 24);
                ctx.font = `bold ${fontSize}px Montserrat, Arial, sans-serif`;
                ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText("PT BACY", 0, 0);
                ctx.restore();

                const result = canvas.toDataURL('image/jpeg', 0.8);
                watermarkedCache.set(src, result);
                resolve(result);
            } catch (e) {
                console.error("Gagal melakukan pemrosesan canvas watermark:", e);
                reject(e);
            }
        };

        img.onload = checkLoaded;
        logo.onload = checkLoaded;
        img.onerror = (err) => {
            console.error("Gagal memuat gambar proyek:", src, err);
            reject(new Error(`Gagal memuat gambar proyek: ${src}`));
        };
        logo.onerror = (err) => {
            console.error("Gagal memuat logo watermark: /images/logo_bacy.png", err);
            reject(new Error("Gagal memuat logo watermark: /images/logo_bacy.png"));
        };

        img.src = src;
        logo.src = "/images/logo_bacy.png";
    });
}

/**
 * Pre-generate watermark untuk gambar secara background
 */
export async function preloadWatermark(src) {
    try {
        await getWatermarkedDataUrl(src);
    } catch (e) {
        console.warn('Preload watermark gagal untuk:', src);
    }
}

/**
 * Mengambil gambar ber-watermark secara sinkron dari cache jika ada
 * @param {string} src 
 * @returns {string|undefined}
 */
export function getWatermarkedFromCache(src) {
    return watermarkedCache.get(src);
}

