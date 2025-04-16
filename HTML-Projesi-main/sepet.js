document.addEventListener('DOMContentLoaded', function () {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const totalPriceElement = document.getElementById('total-price');
    const discountedPriceElement = document.getElementById('indirimli-fiyat');

    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyCartMessage.style.display = 'block';
            totalPriceElement.innerHTML = '<b>0.00 TL</b>';
            discountedPriceElement.innerHTML = '<b>0.00 TL</b>';

            Swal.fire({
                icon: 'info',
                title: 'Sepetiniz boş',
                text: 'Hemen koleksiyonumuza göz atarak favori ürünlerinizi ekleyin!',
                confirmButtonColor: '#FF5722',
                confirmButtonText: 'Alışverişe Başla',
                backdrop: `
                    rgba(0, 0, 0, 0.4)
                    url("https://cdn.dribbble.com/users/160117/screenshots/5014325/media/2a2d7f9c88cdac6dd4a1c6621f9b21cb.gif")
                    left top
                    no-repeat
                `
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'index.html';
                }
            });

            return;
        }

        emptyCartMessage.style.display = 'none';
        cartItemsContainer.innerHTML = '';

        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            itemElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${item.image}" width="70" class="rounded me-3">
                    <div>
                        <h6 class="mb-1">${item.name}</h6>
                        <small>${item.quantity} x ₺${item.price.toFixed(2)}</small>
                    </div>
                </div>
                <div class="d-flex flex-column align-items-end">
                    <strong class="mb-2">₺${itemTotal.toFixed(2)}</strong>
                    <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
                        <i class="fas fa-trash-alt"></i> Sil
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        totalPriceElement.innerHTML = `<b>${total.toFixed(2)} TL</b>`;
        discountedPriceElement.innerHTML = `<b>${total.toFixed(2)} TL</b>`;

        // Sil butonlarını etkinleştir
        const removeButtons = document.querySelectorAll('.remove-item');
        removeButtons.forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                cart.splice(index, 1); // ürün diziden çıkar
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCart(); // yeniden çiz
            });
        });
    }

    renderCart();
});

document.addEventListener('DOMContentLoaded', function () {
    const discountedPriceElement = document.getElementById('indirimli-fiyat');
    if (discountedPriceElement) {
        discountedPriceElement.innerHTML = '<b>0.00 TL</b>';
    }

    document.getElementById('indirim-uygula').addEventListener('click', function () {
        const kuponInput = document.getElementById('kupon-kodu').value.trim();
        const discountedPriceElement = document.getElementById('indirimli-fiyat');

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) return;

        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        let discount = 0;

        // Kullanılmış kuponları localStorage'dan al
        let usedCoupons = JSON.parse(localStorage.getItem('usedCoupons')) || [];

        // Eğer bu kupon daha önce kullanıldıysa uyarı ver
        if (usedCoupons.includes(kuponInput)) {
            return Swal.fire({
                icon: 'warning',
                title: '⚠️ Kupon Zaten Kullanıldı!',
                text: 'Bu kupon kodunu daha önce kullandınız.',
                confirmButtonColor: '#f39c12',
                background: '#fffbea'
            });
        }

        // Geçerli kupon kodları ve oranları
        if (kuponInput === 'INDIRIM10') {
            discount = total * 0.10;
        } else if (kuponInput === 'YAZ20') {
            discount = total * 0.20;
        } else {
            discountedPriceElement.innerHTML = '<b>0.00 TL</b>';
            return Swal.fire({
                icon: 'error',
                title: '❌ Geçersiz Kupon',
                text: 'Lütfen geçerli bir kupon kodu girin.',
                confirmButtonColor: '#d33',
                background: '#fff0f0'
            });
        }

        const newPrice = total - discount;
        discountedPriceElement.innerHTML = `<b>${newPrice.toFixed(2)} TL</b>`;

        // Kullanılmış kupon listesine ekle ve kaydet
        usedCoupons.push(kuponInput);
        localStorage.setItem('usedCoupons', JSON.stringify(usedCoupons));

        // Şık başarı bildirimi
        Swal.fire({
            title: '🎉 Kupon Başarıyla Uygulandı!',
            html: `
                <div style="font-size: 18px; margin-bottom: 10px;">Tebrikler, kupon kodunuz geçerli!</div>
                <div style="font-size: 20px; font-weight: bold; color: #28a745;">
                    Yeni Fiyat: <span style="text-decoration: line-through; color: #dc3545;">${total.toFixed(2)} TL</span> 
                    → ${newPrice.toFixed(2)} TL
                </div>
            `,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/1160/1160358.png',
            imageWidth: 80,
            imageHeight: 80,
            imageAlt: 'İndirim',
            background: '#f0fff4',
            confirmButtonText: 'Alışverişe Devam Et 🛍️',
            confirmButtonColor: '#28a745',
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        });
    });
});


