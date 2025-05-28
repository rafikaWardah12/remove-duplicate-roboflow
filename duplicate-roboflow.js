const fs = require('fs');
const path = require('path');

// Folder lokasi
const labelsPath = path.join('E:', 'Skripsi', 'fatsecret-scrapping', 'labels');
const imagesPath = path.join('E:', 'Skripsi', 'fatsecret-scrapping', 'images');

// Folder duplicate
const duplicateFolder = path.join(__dirname, 'duplicate');
const duplicateLabels = path.join(duplicateFolder, 'labels');
const duplicateImages = path.join(duplicateFolder, 'images');

// Buat folder duplicate/labels dan duplicate/images jika belum ada
[duplicateFolder, duplicateLabels, duplicateImages].forEach(folder => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
});

const readFileTrimmed = (filepath) => {
    const content = fs.readFileSync(filepath, 'utf8').trim();
    return content.split('\n').map(line => line.trim()).filter(Boolean);
}

const moveFile = (src, dest) => {
    if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
        console.log(`📂 Pindahkan: ${src} → ${dest}`);
    }
}

// Ambil semua file label .txt
const labelFiles = fs.readdirSync(labelsPath).filter(file => file.endsWith('.txt'));

for (let i = 0; i < labelFiles.length; i++) {
    const file1 = labelFiles[i];
    const file1Path = path.join(labelsPath, file1);
    if (!fs.existsSync(file1Path)) {
        console.log(`File tidak ditemukan: ${file1Path}`);
        continue; // Lewati jika file tidak ada
    }
    const content1 = readFileTrimmed(file1Path);

    for (let j = i + 1; j < labelFiles.length; j++) {
        const file2 = labelFiles[j];
        const file2Path = path.join(labelsPath, file2);
        if (!fs.existsSync(file2Path)) {
            console.log(`File tidak ditemukan: ${file2Path}`);
            continue; // Lewati jika file tidak ada
        }

        const content2 = readFileTrimmed(file2Path);
        if (content1 === content2) {
            console.log(`🗑️ Duplikat ditemukan: ${file1} dan ${file2} — menghapus ${file2}`);

            // Hapus file label duplikat
            fs.unlinkSync(file2Path);

            // Cari dan hapus file gambar yang sesuai dengan file2
            const baseName = path.parse(file2).name; // tanpa ekstensi
            const imageJpg = path.join(imagesPath, `${baseName}.jpg`);
            const imageJpeg = path.join(imagesPath, `${baseName}.jpeg`);

            if (fs.existsSync(imageJpg)) {
                fs.unlinkSync(imageJpg);
                console.log(`🖼️ Hapus gambar: ${imageJpg}`);
            } else if (fs.existsSync(imageJpeg)) {
                fs.unlinkSync(imageJpeg);
                console.log(`🖼️ Hapus gambar: ${imageJpeg}`);
            }

            break; // Berhenti di sini karena file2 sudah dihapus
        }

        const duplicates = content1.filter(line => content2.includes(line));

        if (duplicates.length > 0) {
            console.log(`⚠️ ${file1} dan ${file2} TIDAK IDENTIK, tapi ada ${duplicates.length} baris duplikat.`);

            const outputFile = path.join(duplicateFolder, `${file1}_vs_${file2}.txt`);
            fs.writeFileSync(outputFile, duplicates.join('\n'), 'utf8');

            moveFile(file1Path, path.join(duplicateLabels, file1));
            moveFile(file2Path, path.join(duplicateLabels, file2));

            const baseNames = [file1, file2].map(f => path.parse(f).name);
            baseNames.forEach(base => {
                ['jpg', 'jpeg'].forEach(ext => {
                    const imagePath = path.join(imagesPath, `${base}.${ext}`);
                    const destPath = path.join(duplicateImages, `${base}.${ext}`);
                    moveFile(imagePath, destPath);
                });
            });
        } else {
            console.log(`❌ ${file1} dan ${file2} benar-benar berbeda.`);
        }
    }
}