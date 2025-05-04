# Trading Journal Forex

Aplikasi web untuk mencatat jurnal trading forex dengan fitur analisis profit/loss dan dampak berita ekonomi.

## Fitur Utama

- **Sistem Login**: Proteksi dengan username dan password
- **Input Trading**:
  - Input manual currency pair
  - Catatan lengkap setiap transaksi
  - Analisis dampak berita ekonomi
- **Manajemen Data**:
  - Edit dan hapus entri trading
  - Export data ke Excel
  - Import data dari Excel
- **Analisis**:
  - Statistik performa trading
  - Kalender Profit/Loss
  - Analisis dampak berita ekonomi terhadap trading
- **Chart Visualisasi**:
  - Grafik performa bulanan
  - Distribusi hasil trading
  - Dampak berita ekonomi

## Cara Instalasi

1. Download file ZIP repository
2. Ekstrak ke folder yang diinginkan
3. Buka file `index.html` di browser web

## Cara Menggunakan

1. **Login**:
   - Username: `admin`
   - Password: `admin`

2. **Input Trading**:
   - Isi form di tab Journal
   - Currency pair bisa diinput manual (contoh: EUR/USD, GBP/JPY)

3. **Edit/Hapus**:
   - Klik tombol Edit/Delete di kolom Actions

4. **Export/Import**:
   - Export: Download data dalam format Excel
   - Import: Upload file Excel yang sebelumnya diexport

5. **Analisis**:
   - Lihat statistik di tab Statistics
   - Pantau kalender Profit/Loss di tab Calendar
   - Analisis dampak berita di tab Economic News

## Deploy ke Vercel

1. Upload ke GitHub
2. Buat proyek baru di Vercel
3. Connect ke repository GitHub
4. Deploy aplikasi

## Catatan Keamanan

1. Ganti password default sebelum digunakan untuk produksi
2. Data disimpan di browser lokal (localStorage)
3. Selalu backup data dengan export ke Excel

## Teknologi

- HTML5, CSS3, JavaScript
- Chart.js untuk visualisasi data
- SheetJS untuk import/export Excel
- LocalStorage untuk penyimpanan data
