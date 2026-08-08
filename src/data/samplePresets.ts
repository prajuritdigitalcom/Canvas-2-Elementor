export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  brandPrefixTarget: string;
  rawHtml: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'warung-nyaman-2',
    title: 'Warung Nyaman 2 (Kuliner / Restaurant)',
    description: 'Halaman promo restoran dengan menu grid, cart floating badge, dan mobile menu JS toggle.',
    brandPrefixTarget: 'wn2-',
    rawHtml: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Warung Nyaman 2 - Kuliner Khas Nusantara</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;1,600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              primary: '#D97706',
              dark: '#78350F',
              accent: '#FEF3C7',
              surface: '#FFFBEB'
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            display: ['"Playfair Display"', 'serif']
          }
        }
      }
    }
  </script>
</head>
<body class="bg-amber-50/50 text-slate-800 font-sans antialiased">
  <!-- Header Nav -->
  <header id="main-header" class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-xl shadow-md">
          WN
        </div>
        <div>
          <h1 class="font-display font-bold text-xl text-slate-900 leading-tight">Warung Nyaman 2</h1>
          <p class="text-xs text-amber-700 font-medium">Cita Rasa Asli Kediri</p>
        </div>
      </div>

      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <a href="#menu" class="hover:text-brand-primary transition-colors">Daftar Menu</a>
        <a href="#promo" class="hover:text-brand-primary transition-colors">Paket Hemat</a>
        <a href="#lokasi" class="hover:text-brand-primary transition-colors">Lokasi Cabang</a>
      </nav>

      <div class="flex items-center gap-3">
        <button id="cart-badge-btn" class="relative p-2 rounded-lg bg-amber-100 text-brand-dark hover:bg-amber-200 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <span id="cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
        </button>
        <button id="mobile-menu-toggle" class="md:hidden p-2 text-slate-600 hover:text-slate-900">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div id="mobile-menu" class="hidden md:hidden bg-white border-b border-amber-100 px-4 py-3 flex-col gap-2">
      <a href="#menu" class="block py-2 text-slate-700 hover:text-brand-primary">Daftar Menu</a>
      <a href="#promo" class="block py-2 text-slate-700 hover:text-brand-primary">Paket Hemat</a>
      <a href="#lokasi" class="block py-2 text-slate-700 hover:text-brand-primary">Lokasi Cabang</a>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="py-12 md:py-16 bg-gradient-to-b from-amber-100/50 to-amber-50/20">
    <div class="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <span class="inline-block px-3 py-1 bg-amber-200/80 text-brand-dark text-xs font-bold rounded-full mb-4">
          🔥 Resto Favorit Keluarga
        </span>
        <h2 class="font-display text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
          Resep Warisan Nusantara dengan Bahan Segar Pilihan
        </h2>
        <p class="text-slate-600 text-base md:text-lg mb-6 leading-relaxed">
          Nikmati Bebek Goreng Kremes Crispy, Ayam Bakar Madu, dan Sambal Bawang Khas yang bikin nambah Nasi Hangat Sepuasnya!
        </p>
        <div class="flex flex-wrap gap-4">
          <a href="https://wa.me/6281234567890" target="_blank" class="bg-brand-primary hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
            <span>Pesan via WhatsApp</span>
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/></svg>
          </a>
          <a href="#menu" class="bg-white hover:bg-amber-50 text-slate-800 border border-amber-200 font-bold px-6 py-3 rounded-xl transition-all">
            Lihat Menu Spesial
          </a>
        </div>
      </div>
      <div class="relative">
        <div class="rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200 aspect-video flex items-center justify-center text-slate-400 font-medium">
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" alt="Hidangan Restoran" class="w-full h-full object-cover">
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Menu List -->
  <section id="menu" class="py-12 max-w-6xl mx-auto px-4">
    <div class="text-center mb-10">
      <h3 class="font-display text-2xl md:text-3xl font-bold text-slate-900">Menu Rekomendasi Hari Ini</h3>
      <p class="text-slate-500 text-sm mt-1">Siap diantar hangat ke rumah atau kantormu</p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Menu Item 1 -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
        <div class="h-48 rounded-xl bg-slate-100 overflow-hidden mb-4 relative">
          <img src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=500&q=80" alt="Bebek Goreng" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <span class="absolute top-2 right-2 bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg">Best Seller</span>
        </div>
        <h4 class="font-bold text-lg text-slate-900">Bebek Goreng Kremes Utuh</h4>
        <p class="text-slate-500 text-xs mt-1 mb-3">Bebek empuk bumbu rempah kuning + kremesan gurih & sambal terasi.</p>
        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <span class="font-extrabold text-amber-600 text-lg">Rp 38.000</span>
          <button class="add-cart-btn bg-amber-100 hover:bg-brand-primary hover:text-white text-brand-dark font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
            <span>+ Tambah</span>
          </button>
        </div>
      </div>

      <!-- Menu Item 2 -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
        <div class="h-48 rounded-xl bg-slate-100 overflow-hidden mb-4 relative">
          <img src="https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500&q=80" alt="Ayam Bakar" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>
        <h4 class="font-bold text-lg text-slate-900">Ayam Bakar Madu Pedas</h4>
        <p class="text-slate-500 text-xs mt-1 mb-3">Daging ayam kampung bakar dengan kecap manis madu khas Kediri.</p>
        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <span class="font-extrabold text-amber-600 text-lg">Rp 28.000</span>
          <button class="add-cart-btn bg-amber-100 hover:bg-brand-primary hover:text-white text-brand-dark font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
            <span>+ Tambah</span>
          </button>
        </div>
      </div>

      <!-- Menu Item 3 -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
        <div class="h-48 rounded-xl bg-slate-100 overflow-hidden mb-4 relative">
          <img src="https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=500&q=80" alt="Es Dawet" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>
        <h4 class="font-bold text-lg text-slate-900">Es Dawet Durian Asli</h4>
        <p class="text-slate-500 text-xs mt-1 mb-3">Segarnya dawet beras pandan dengan santan gurih & topping durian segar.</p>
        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <span class="font-extrabold text-amber-600 text-lg">Rp 15.000</span>
          <button class="add-cart-btn bg-amber-100 hover:bg-brand-primary hover:text-white text-brand-dark font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
            <span>+ Tambah</span>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-sm">
    <p>© 2026 Warung Nyaman 2 - Hak Cipta Dilindungi.</p>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const menuToggle = document.getElementById('mobile-menu-toggle');
      const mobileMenu = document.getElementById('mobile-menu');
      const cartCount = document.getElementById('cart-count');
      const addBtns = document.querySelectorAll('.add-cart-btn');

      if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
          mobileMenu.classList.toggle('hidden');
          mobileMenu.classList.toggle('flex');
        });
      }

      let count = 2;
      addBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          count++;
          if (cartCount) cartCount.textContent = count;
          btn.textContent = '✓ Ditambahkan';
          setTimeout(() => { btn.innerHTML = '<span>+ Tambah</span>'; }, 1500);
        });
      });
    });
  </script>
</body>
</html>`
  },
  {
    id: 'family-aqiqah',
    title: 'Family Aqiqah (Jasa Layanan / Paket Pricing)',
    description: 'Halaman pilihan paket aqiqah dengan selector paket interaktif dan kalkulasi otomatis.',
    brandPrefixTarget: 'fa-',
    rawHtml: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Aqiqah - Layanan Aqiqah Syar'i & Siap Saji</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            aqiqah: {
              emerald: '#059669',
              light: '#ECFDF5',
              dark: '#064E3B'
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans">
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="text-center mb-8">
      <span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">Sesuai Syariat & Praktis</span>
      <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Pilihan Paket Family Aqiqah</h1>
      <p class="text-slate-600 mt-2 text-sm max-w-lg mx-auto">Kambing sehat bebas penyakit, disembelih profesional & dimasak lezat tanpa bau prengus.</p>
    </div>

    <!-- Pricing Cards Grid -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg relative">
        <span class="absolute -top-3 right-6 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">Paling Laris</span>
        <h3 class="text-xl font-bold text-slate-900">Paket Anak Laki-Laki (2 Kambing)</h3>
        <p class="text-slate-500 text-xs mt-1">Ideal untuk 80-100 porsi prasmanan / nasi box</p>
        <div class="my-4 text-3xl font-extrabold text-emerald-600">Rp 3.800.000</div>
        <ul class="text-xs text-slate-600 space-y-2 mb-6">
          <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> 2 Ekor Kambing Jantan Sehat</li>
          <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> Olahan Gulai & Sate Empuk</li>
          <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> Gratis Sertifikat & Boneka</li>
        </ul>
        <button id="select-paket-1" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors">Pilih Paket Laki-Laki</button>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-xl font-bold text-slate-900">Paket Anak Perempuan (1 Kambing)</h3>
        <p class="text-slate-500 text-xs mt-1">Ideal untuk 40-50 porsi prasmanan / nasi box</p>
        <div class="my-4 text-3xl font-extrabold text-emerald-600">Rp 2.100.000</div>
        <ul class="text-xs text-slate-600 space-y-2 mb-6">
          <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> 1 Ekor Kambing Betina / Jantan</li>
          <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> Olahan Tengkleng & Sate</li>
          <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> Gratis Delivery Area Kota</li>
        </ul>
        <button id="select-paket-2" class="w-full bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 font-bold py-2.5 rounded-xl transition-colors">Pilih Paket Perempuan</button>
      </div>
    </div>

    <!-- Order Form Summary -->
    <div id="order-box" class="bg-emerald-900 text-white p-6 rounded-2xl shadow-xl">
      <h4 class="font-bold text-lg mb-2">Formulir Pemesanan Cepat</h4>
      <p class="text-emerald-200 text-xs mb-4">Paket Dipilih: <span id="selected-package-label" class="font-bold text-white">Paket Laki-Laki (Rp 3.800.000)</span></p>
      <form id="aqiqah-form" class="space-y-3">
        <div>
          <label class="block text-xs text-emerald-200 mb-1">Nama Ayah/Bunda</label>
          <input type="text" id="form-name" required placeholder="Contoh: Bpk. Ahmad" class="w-full px-3 py-2 rounded-lg bg-emerald-800 text-white placeholder-emerald-400 border border-emerald-700 text-sm focus:outline-none focus:border-emerald-300">
        </div>
        <div>
          <label class="block text-xs text-emerald-200 mb-1">Nomor WhatsApp</label>
          <input type="tel" id="form-phone" required placeholder="08123456789" class="w-full px-3 py-2 rounded-lg bg-emerald-800 text-white placeholder-emerald-400 border border-emerald-700 text-sm focus:outline-none focus:border-emerald-300">
        </div>
        <button type="submit" class="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold py-3 rounded-xl transition-colors">Kirim Pesanan Sekarang</button>
      </form>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const btn1 = document.getElementById('select-paket-1');
      const btn2 = document.getElementById('select-paket-2');
      const label = document.getElementById('selected-package-label');
      const form = document.getElementById('aqiqah-form');

      if (btn1 && label) {
        btn1.addEventListener('click', function() {
          label.textContent = 'Paket Anak Laki-Laki (Rp 3.800.000)';
        });
      }
      if (btn2 && label) {
        btn2.addEventListener('click', function() {
          label.textContent = 'Paket Anak Perempuan (Rp 2.100.000)';
        });
      }
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          const name = document.getElementById('form-name').value;
          alert('Terima kasih ' + name + ', tim Family Aqiqah akan menghubungi Anda via WhatsApp!');
        });
      }
    });
  </script>
</body>
</html>`
  },
  {
    id: 'parama-satya-pertiwi',
    title: 'Parama Satya Pertiwi (Real Estate Corporate)',
    description: 'Halaman promo perumahan mewah dengan tab filter unit dan modal detail properti.',
    brandPrefixTarget: 'psp-',
    rawHtml: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PT. Parama Satya Pertiwi - Hunian Modern & Investasi Properti</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            psp: {
              navy: '#0B192C',
              blue: '#1E3E62',
              gold: '#D4AF37',
              gray: '#F1F5F9'
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-900 text-slate-100 font-sans">
  <!-- Hero Section -->
  <header class="border-b border-slate-800 bg-psp-navy">
    <div class="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded bg-amber-500 text-slate-900 font-bold flex items-center justify-center">PSP</div>
        <span class="font-bold text-lg text-white tracking-wide">Parama Satya Pertiwi</span>
      </div>
      <button class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider">Hubungi Sales</button>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-12">
    <div class="text-center max-w-2xl mx-auto mb-10">
      <h2 class="text-3xl md:text-4xl font-extrabold text-white">Cluster Grand Satya Residence</h2>
      <p class="text-slate-400 text-sm mt-2">Hunian eksklusif bergaya Scandinavian Modern dengan sistem Smart Home terintegrasi.</p>
    </div>

    <!-- Unit Filter Tabs -->
    <div class="flex justify-center gap-3 mb-8">
      <button class="tab-btn active bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs" data-type="all">Semua Tipe</button>
      <button class="tab-btn bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-lg text-xs hover:bg-slate-700" data-type="tipe36">Tipe 36/72</button>
      <button class="tab-btn bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-lg text-xs hover:bg-slate-700" data-type="tipe45">Tipe 45/90</button>
    </div>

    <!-- Unit Cards -->
    <div class="grid md:grid-cols-2 gap-6">
      <div class="unit-card bg-slate-800/80 rounded-2xl border border-slate-700/60 p-5" data-category="tipe36">
        <div class="h-48 rounded-xl bg-slate-700 mb-4 overflow-hidden relative">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" class="w-full h-full object-cover">
          <span class="absolute top-2 left-2 bg-slate-900/80 text-amber-400 font-bold text-[10px] px-2 py-1 rounded">Tipe 36/72</span>
        </div>
        <h3 class="text-xl font-bold text-white mb-1">Satya Premier A1</h3>
        <p class="text-slate-400 text-xs mb-4">2 Kamar Tidur | 1 Kamar Mandi | Carport 1 Mobil</p>
        <div class="flex items-center justify-between pt-3 border-t border-slate-700">
          <span class="text-amber-400 font-extrabold text-lg">Rp 450 Juta</span>
          <button class="view-detail-btn bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-2 rounded-lg">Brosur PDF</button>
        </div>
      </div>

      <div class="unit-card bg-slate-800/80 rounded-2xl border border-slate-700/60 p-5" data-category="tipe45">
        <div class="h-48 rounded-xl bg-slate-700 mb-4 overflow-hidden relative">
          <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80" class="w-full h-full object-cover">
          <span class="absolute top-2 left-2 bg-slate-900/80 text-amber-400 font-bold text-[10px] px-2 py-1 rounded">Tipe 45/90</span>
        </div>
        <h3 class="text-xl font-bold text-white mb-1">Satya Executive B2</h3>
        <p class="text-slate-400 text-xs mb-4">3 Kamar Tidur | 2 Kamar Mandi | Carport 2 Mobil</p>
        <div class="flex items-center justify-between pt-3 border-t border-slate-700">
          <span class="text-amber-400 font-extrabold text-lg">Rp 680 Juta</span>
          <button class="view-detail-btn bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-2 rounded-lg">Brosur PDF</button>
        </div>
      </div>
    </div>
  </main>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const tabs = document.querySelectorAll('.tab-btn');
      const cards = document.querySelectorAll('.unit-card');

      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          tabs.forEach(t => {
            t.classList.remove('bg-amber-500', 'text-slate-950');
            t.classList.add('bg-slate-800', 'text-slate-300');
          });
          this.classList.remove('bg-slate-800', 'text-slate-300');
          this.classList.add('bg-amber-500', 'text-slate-950');

          const category = this.getAttribute('data-type');
          cards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
              card.style.display = 'block';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    });
  </script>
</body>
</html>`
  }
];
