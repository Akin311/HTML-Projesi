document.addEventListener('DOMContentLoaded', function () {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const totalPriceElement = document.getElementById('total-price');
    const discountedPriceElement = document.getElementById('indirimli-fiyat');
    const shippingCostElement = document.getElementById('shipping-cost');
    const discountRowElement = document.getElementById('discount-row');
    const discountAmountElement = document.getElementById('discount-amount');
    const shippingMessageElement = document.getElementById('shipping-message');
    const amountToFreeShippingElement = document.getElementById('amount-to-free-shipping');
    const saveCartButton = document.getElementById('save-cart');
    const clearCartButton = document.getElementById('clear-cart');
    const giftPackageCheckbox = document.getElementById('gift-package');
    const quickBuyButton = document.getElementById('quick-buy');
    const confirmCartButton = document.getElementById('confirm-cart');
    const kuponKoduInput = document.getElementById('kupon-kodu');
    const indirimUygula = document.getElementById('indirim-uygula');
    
    // Sepet işlemleri ile ilgili sabitler
    const FREE_SHIPPING_THRESHOLD = 500; // 500 TL ve üzeri alışverişlerde ücretsiz kargo
    const SHIPPING_COST = 29.90; // Normal kargo ücreti
    const GIFT_PACKAGE_COST = 19.90; // Hediye paketi ücreti

    // Kupon kodları listesi
    const COUPON_CODES = [
        { code: 'HOSGELDIN10', discount: 0.10, minAmount: 100 },
        { code: 'SIKBUTIK20', discount: 0.20, minAmount: 300 },
        { code: 'YENIUYE15', discount: 0.15, minAmount: 150 },
        { code: 'HAFTASONU25', discount: 0.25, minAmount: 400 }
    ];
    
    // Aktif kupon kodu
    let activeCoupon = null;

    // Beden seçenekleri
    const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // İlgili ürünleri ekleyeceğimiz mock verisi
    const recentlyViewedProducts = [
        { id: 1, name: 'Kısa Kollu Bluz', price: 199.99, image: 'images/urun5.webp' },
        { id: 2, name: 'Uzun Kollu Gömlek', price: 249.99, image: 'images/urun6.webp' },
        { id: 3, name: 'Desenli Etek', price: 279.99, image: 'images/urun7.webp' },
        { id: 4, name: 'Şal Desenli', price: 149.99, image: 'images/urun8.webp' }
    ];

    // Son görüntülenen ürünleri renderla
    function renderRecentlyViewedProducts() {
        const container = document.getElementById('recently-viewed-products');
        if (!container) return;

        container.innerHTML = '';
        
        recentlyViewedProducts.forEach(product => {
            const productElement = document.createElement('div');
            productElement.classList.add('col-md-3', 'mb-4');
            productElement.innerHTML = `
                <div class="card product-card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.price.toFixed(2)} TL</p>
                        <button class="btn btn-sm btn-outline-dark add-to-cart" data-id="${product.id}">Sepete Ekle</button>
                    </div>
                </div>
            `;
            container.appendChild(productElement);
        });
        
        // Son görüntülenen ürünleri sepete ekle butonlarını dinle
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                const product = recentlyViewedProducts.find(p => p.id === productId);
                
                if (product) {
                    // Beden seçim modalını göster
                    showSizeSelectionModal(product);
                }
            });
        });
    }
    
    // Beden seçimi için modal göster
    function showSizeSelectionModal(product) {
        // Modal HTML oluşturma
        let sizeOptions = '';
        SIZE_OPTIONS.forEach(size => {
            sizeOptions += `<button class="btn btn-outline-dark me-2 mb-2 size-btn">${size}</button>`;
        });
        
        Swal.fire({
            title: 'Beden Seçiniz',
            html: `
                <div class="text-center mb-3">
                    <p>Lütfen ${product.name} için beden seçimi yapınız:</p>
                    <div class="size-selection-container my-3">
                        ${sizeOptions}
                    </div>
                    <div class="selected-size mt-3" id="selectedSize">
                        Seçilen beden: <span>Seçilmedi</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sepete Ekle',
            cancelButtonText: 'İptal',
            didOpen: () => {
                const sizeButtons = Swal.getPopup().querySelectorAll('.size-btn');
                const selectedSizeSpan = Swal.getPopup().querySelector('#selectedSize span');
                
                let selectedSize = null;
                
                sizeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        // Tüm butonlardan aktif sınıfını kaldır
                        sizeButtons.forEach(btn => btn.classList.remove('active', 'btn-dark', 'text-white'));
                        
                        // Tıklanan butona aktif sınıfını ekle
                        this.classList.add('active', 'btn-dark', 'text-white');
                        selectedSize = this.textContent;
                        selectedSizeSpan.textContent = selectedSize;
                    });
                });
            },
            preConfirm: () => {
                const selectedSize = Swal.getPopup().querySelector('.size-btn.active')?.textContent;
                if (!selectedSize) {
                    Swal.showValidationMessage('Lütfen bir beden seçin');
                    return false;
                }
                return selectedSize;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const selectedSize = result.value;
                addToCart(product, selectedSize);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Sepete Eklendi!',
                    text: `${product.name} (Beden: ${selectedSize}) sepetinize eklendi.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }

    // Sepete ürün ekleme fonksiyonu
    function addToCart(product, size) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Aynı ürün ve beden kombinasyonu var mı kontrol et
        const existingProduct = cart.find(item => item.id === product.id && item.size === size);
        
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
                size: size
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    // Sepeti göster
    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyCartMessage.style.display = 'block';
            totalPriceElement.innerHTML = '<b>0.00 TL</b>';
            discountedPriceElement.innerHTML = '<b>0.00 TL</b>';
            shippingCostElement.innerHTML = '<b>0.00 TL</b>';
            discountRowElement.style.display = 'none';
            shippingMessageElement.style.display = 'none';
            updateCartSummary(0);
            return;
        }

        emptyCartMessage.style.display = 'none';
        cartItemsContainer.innerHTML = '';

        let totalPrice = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;

            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            cartItemElement.innerHTML = `
                <div class="row align-items-center mb-3">
                    <div class="col-md-2">
                        <img src="${item.image}" alt="${item.name}" class="img-fluid">
                    </div>
                    <div class="col-md-3">
                        <h5>${item.name}</h5>
                        <div class="size-selector">
                            <span class="badge bg-dark me-2">Beden: ${item.size || 'Seçilmedi'}</span>
                            <button class="btn btn-sm btn-outline-secondary change-size" data-index="${index}">
                                <i class="fas fa-exchange-alt"></i> Değiştir
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="quantity-control">
                            <button class="btn btn-sm btn-outline-dark quantity-btn decrease" data-index="${index}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-dark quantity-btn increase" data-index="${index}">+</button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <p class="item-price">${item.price.toFixed(2)} TL</p>
                    </div>
                    <div class="col-md-2">
                        <p class="item-total">${itemTotal.toFixed(2)} TL</p>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-sm btn-danger remove-item" data-index="${index}">X</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        // Adet artırma/azaltma butonlarını dinle
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const isIncrease = this.classList.contains('increase');
                updateQuantity(index, isIncrease);
            });
        });

        // Ürün silme butonlarını dinle
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFromCart(index);
            });
        });
        
        // Beden değiştirme butonlarını dinle
        document.querySelectorAll('.change-size').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                changeSize(index);
            });
        });

        updateCartSummary(totalPrice);
    }

    // Beden değiştirme fonksiyonu
    function changeSize(index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = cart[index];
        
        if (!item) return;
        
        // Modal HTML oluşturma
        let sizeOptions = '';
        SIZE_OPTIONS.forEach(size => {
            const isSelected = size === item.size;
            sizeOptions += `<button class="btn btn-outline-dark me-2 mb-2 size-btn ${isSelected ? 'active btn-dark text-white' : ''}">${size}</button>`;
        });
        
        Swal.fire({
            title: 'Beden Değiştir',
            html: `
                <div class="text-center mb-3">
                    <p>Lütfen ${item.name} için yeni beden seçimi yapınız:</p>
                    <div class="size-selection-container my-3">
                        ${sizeOptions}
                    </div>
                    <div class="selected-size mt-3" id="selectedSize">
                        Seçilen beden: <span>${item.size || 'Seçilmedi'}</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Beden Değiştir',
            cancelButtonText: 'İptal',
            didOpen: () => {
                const sizeButtons = Swal.getPopup().querySelectorAll('.size-btn');
                const selectedSizeSpan = Swal.getPopup().querySelector('#selectedSize span');
                
                sizeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        // Tüm butonlardan aktif sınıfını kaldır
                        sizeButtons.forEach(btn => btn.classList.remove('active', 'btn-dark', 'text-white'));
                        
                        // Tıklanan butona aktif sınıfını ekle
                        this.classList.add('active', 'btn-dark', 'text-white');
                        selectedSizeSpan.textContent = this.textContent;
                    });
                });
            },
            preConfirm: () => {
                const selectedSize = Swal.getPopup().querySelector('.size-btn.active')?.textContent;
                if (!selectedSize) {
                    Swal.showValidationMessage('Lütfen bir beden seçin');
                    return false;
                }
                return selectedSize;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Sepetteki ürünün bedenini güncelle
                cart[index].size = result.value;
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCart();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Beden Güncellendi!',
                    text: `${item.name} için beden ${result.value} olarak değiştirildi.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }

    // Ürün miktarını güncelle
    function updateQuantity(index, isIncrease) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (isIncrease) {
            cart[index].quantity += 1;
        } else {
            cart[index].quantity -= 1;
            
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    // Ürünü sepetten kaldır
    function removeFromCart(index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        Swal.fire({
            title: 'Emin misiniz?',
            text: `${cart[index].name} sepetinizden kaldırılacak.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Kaldır',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) {
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCart();
                
                Swal.fire(
                    'Kaldırıldı!',
                    'Ürün sepetinizden kaldırıldı.',
                    'success'
                );
            }
        });
    }

    // Kupon kodunu uygula
    function applyCoupon(couponCode) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let totalPrice = 0;
        
        cart.forEach(item => {
            totalPrice += item.price * item.quantity;
        });
        
        // Kupon kodu var mı kontrol et
        const coupon = COUPON_CODES.find(c => c.code === couponCode.toUpperCase());
        
        if (!coupon) {
            Swal.fire({
                icon: 'error',
                title: 'Geçersiz Kupon',
                text: 'Girdiğiniz kupon kodu geçerli değil.'
            });
            return false;
        }
        
        // Minimum sepet tutarını kontrol et
        if (totalPrice < coupon.minAmount) {
            Swal.fire({
                icon: 'warning',
                title: 'Yetersiz Sepet Tutarı',
                text: `Bu kuponu kullanabilmek için sepet tutarınız en az ${coupon.minAmount.toFixed(2)} TL olmalıdır.`
            });
            return false;
        }
        
        // Kuponu aktifleştir
        activeCoupon = coupon;
        
        Swal.fire({
            icon: 'success',
            title: 'Kupon Uygulandı!',
            text: `%${coupon.discount * 100} indirim kuponu sepetinize uygulandı.`
        });
        
        updateCartSummary(totalPrice);
        return true;
    }

    // Sepet özetini güncelle
    function updateCartSummary(totalPrice) {
        const giftPackageSelected = giftPackageCheckbox.checked;
        let finalShippingCost = 0;
        
        // Kargo ücreti hesaplama
        if (totalPrice >= FREE_SHIPPING_THRESHOLD) {
            finalShippingCost = 0;
            shippingCostElement.innerHTML = '<b class="text-success">Ücretsiz</b>';
            shippingMessageElement.style.display = 'none';
        } else {
            finalShippingCost = SHIPPING_COST;
            shippingCostElement.innerHTML = `<b>${SHIPPING_COST.toFixed(2)} TL</b>`;
            
            // Ücretsiz kargo için gereken tutar mesajı
            const amountForFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice;
            if (amountForFreeShipping > 0) {
                shippingMessageElement.style.display = 'block';
                amountToFreeShippingElement.textContent = amountForFreeShipping.toFixed(2) + " TL";
            } else {
                shippingMessageElement.style.display = 'none';
            }
        }
        
        // Hediye paketi hesaplama
        let giftPackageCost = giftPackageSelected ? GIFT_PACKAGE_COST : 0;
        
        // İndirim hesaplama
        let discountAmount = 0;
        
        // Kupon indirimi hesaplama
        if (activeCoupon) {
            discountAmount = totalPrice * activeCoupon.discount;
            discountRowElement.style.display = 'flex';
            discountAmountElement.innerHTML = `<b>${discountAmount.toFixed(2)} TL</b>`;
        } else if (totalPrice >= 300) {
            // Otomatik indirim (eğer kupon yoksa)
            discountAmount = totalPrice * 0.10; // %10 indirim
            discountRowElement.style.display = 'flex';
            discountAmountElement.innerHTML = `<b>${discountAmount.toFixed(2)} TL</b>`;
        } else {
            discountRowElement.style.display = 'none';
        }
        
        const discountedTotal = totalPrice - discountAmount;
        const finalTotal = discountedTotal + finalShippingCost + giftPackageCost;
        
        totalPriceElement.innerHTML = `<b>${totalPrice.toFixed(2)} TL</b>`;
        discountedPriceElement.innerHTML = `<b>${finalTotal.toFixed(2)} TL</b>`;
    }

    // Sepeti kaydet butonu
    if (saveCartButton) {
        saveCartButton.addEventListener('click', function() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            if (cart.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Boş Sepet',
                    text: 'Kaydetmek için sepetinizde ürün bulunmalıdır.'
                });
                return;
            }
            
            // Kaydetme işlemi (örnek olarak yeni bir isim ile localStorage'a kaydediyoruz)
            const savedCarts = JSON.parse(localStorage.getItem('savedCarts')) || [];
            const date = new Date();
            
            savedCarts.push({
                id: Date.now(),
                date: date.toLocaleDateString('tr-TR'),
                time: date.toLocaleTimeString('tr-TR'),
                items: cart
            });
            
            localStorage.setItem('savedCarts', JSON.stringify(savedCarts));
            
            Swal.fire({
                icon: 'success',
                title: 'Sepet Kaydedildi',
                text: 'Sepetiniz başarıyla kaydedildi.'
            });
        });
    }

    // Sepeti temizle butonu
    if (clearCartButton) {
        clearCartButton.addEventListener('click', function() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            if (cart.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Boş Sepet',
                    text: 'Sepetiniz zaten boş.'
                });
                return;
            }
            
            Swal.fire({
                title: 'Emin misiniz?',
                text: 'Sepetinizdeki tüm ürünler kaldırılacak.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Evet, Temizle',
                cancelButtonText: 'İptal'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('cart');
                    activeCoupon = null; // Kuponu da temizle
                    renderCart();
                    
                    Swal.fire(
                        'Temizlendi!',
                        'Sepetiniz tamamen boşaltıldı.',
                        'success'
                    );
                }
            });
        });
    }

    // Hediye paketi seçeneği değişimini dinle
    if (giftPackageCheckbox) {
        giftPackageCheckbox.addEventListener('change', function() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            let totalPrice = 0;
            
            cart.forEach(item => {
                totalPrice += item.price * item.quantity;
            });
            
            updateCartSummary(totalPrice);
        });
    }
    
    // İndirim kuponu uygula butonu
    if (indirimUygula) {
        indirimUygula.addEventListener('click', function() {
            const couponCode = kuponKoduInput.value.trim();
            
            if (couponCode === '') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Kupon Kodu Eksik',
                    text: 'Lütfen bir kupon kodu girin.'
                });
                return;
            }
            
            if (applyCoupon(couponCode)) {
                // Başarılıysa kuponu vurgula
                kuponKoduInput.classList.add('is-valid');
                setTimeout(() => {
                    kuponKoduInput.classList.remove('is-valid');
                }, 3000);
            } else {
                // Başarısızsa hata vurgula
                kuponKoduInput.classList.add('is-invalid');
                setTimeout(() => {
                    kuponKoduInput.classList.remove('is-invalid');
                }, 3000);
            }
        });
    }

    // Hızlı satın al butonu
    if (quickBuyButton) {
        quickBuyButton.addEventListener('click', function() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            if (cart.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Boş Sepet',
                    text: 'Satın alma işlemi için sepetinizde ürün bulunmalıdır.'
                });
                return;
            }
            
            // Beden kontrolü yap
            const missingSize = cart.some(item => !item.size);
            if (missingSize) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Beden Seçimi Eksik',
                    text: 'Sepetinizdeki bazı ürünler için beden seçimi yapmadınız. Lütfen tüm ürünler için beden seçin.'
                });
                return;
            }
            
            // Burada hızlı satın alma işlemi için ödeme sayfasına yönlendirme yapılabilir
            window.location.href = 'odeme.html?type=quick';
        });
    }

    // Sepeti onayla butonu
    if (confirmCartButton) {
        confirmCartButton.addEventListener('click', function() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            if (cart.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Boş Sepet',
                    text: 'Sepetinizde onaylanacak ürün bulunmamaktadır.'
                });
                return;
            }
            
            // Beden kontrolü yap
            const missingSize = cart.some(item => !item.size);
            if (missingSize) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Beden Seçimi Eksik',
                    text: 'Sepetinizdeki bazı ürünler için beden seçimi yapmadınız. Lütfen tüm ürünler için beden seçin.'
                });
                return;
            }
            
            // Burada sepeti onaylayıp ödeme sayfasına yönlendirme yapılabilir
            window.location.href = 'odeme.html';
        });
    }

    // CSS stillerini ekle
    const style = document.createElement('style');
    style.innerHTML = `
        .size-selection-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
        }
        .size-btn {
            min-width: 40px;
        }
        .change-size {
            font-size: 0.8rem;
        }
    `;
    document.head.appendChild(style);

    // Son görüntülenen ürünleri göster
    renderRecentlyViewedProducts();
    
    // Sepeti göster
    renderCart();
});
