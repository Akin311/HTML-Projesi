document.addEventListener('DOMContentLoaded', function () {
    // === Canlı Destek Chat ===
    const supportButton = document.getElementById('supportButton');
    const supportChatContainer = document.getElementById('supportChatContainer');
    const minimizeChat = document.getElementById('minimizeChat');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendMessage = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');
    const quickReplies = document.querySelectorAll('.quick-reply-btn');
    const typingIndicator = document.getElementById('typingIndicator');
    const aiModeToggle = document.getElementById('aiModeToggle');

    if (supportButton) {
        supportButton.addEventListener('click', function () {
            supportChatContainer.style.display = 'flex';
            supportButton.style.display = 'none';
        });

        minimizeChat.addEventListener('click', function () {
            supportChatContainer.style.display = 'none';
            supportButton.style.display = 'flex';
        });

        closeChat.addEventListener('click', function () {
            supportChatContainer.style.display = 'none';
            supportButton.style.display = 'flex';
        });

        function sendUserMessage() {
            const messageText = chatInput.value.trim();
            if (messageText === '') return;

            addMessage('Siz', messageText, 'user-message');
            chatInput.value = '';

            if (aiModeToggle.checked) {
                typingIndicator.style.display = 'flex';
                fetchBotResponse(messageText);
            } else {
                setTimeout(() => {
                    addMessage('Sistem', 'Mesajınız alındı. En kısa sürede operatörlerimiz size dönüş yapacaktır.', 'bot-message');
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 500);
            }
        }

        function fetchBotResponse(message) {
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            })
                .then(response => {
                    if (!response.ok) throw new Error('API isteği başarısız oldu');
                    return response.json();
                })
                .then(data => {
                    typingIndicator.style.display = 'none';
                    addMessage('ŞıkBot', data.response, 'bot-message');
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                })
                .catch(error => {
                    console.error('API Hatası:', error);
                    typingIndicator.style.display = 'none';
                    addMessage('ŞıkBot', 'Bir hata oluştu, lütfen tekrar deneyin.', 'bot-message');
                });
        }

        function addMessage(sender, text, messageClass) {
            const messageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const messageHTML = `
                <div class="message ${messageClass}">
                    <div class="message-avatar">
                        ${messageClass === 'bot-message' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>'}
                    </div>
                    <div class="message-content">
                        <div class="message-sender">${sender}</div>
                        <div class="message-text">${text}</div>
                        <div class="message-time">${messageTime}</div>
                    </div>
                </div>
            `;
            chatMessages.innerHTML += messageHTML;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        sendMessage.addEventListener('click', sendUserMessage);
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendUserMessage();
            }
        });

        quickReplies.forEach(button => {
            button.addEventListener('click', function () {
                chatInput.value = button.textContent;
                sendUserMessage();
            });
        });
    }

    // === Sepete Ekleme Fonksiyonelliği ===
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            const card = this.closest('.product-card');
            const name = card.querySelector('.product-name a').innerText.trim();
            const priceText = card.querySelector('.product-price').innerText;
            const price = parseFloat(priceText.replace(/[^\d,.-]/g, '').replace(',', '.'));
            const image = card.querySelector('.product-image img').getAttribute('src');

            const newItem = {
                name: name,
                price: price,
                image: image,
                quantity: 1
            };

            let cart = JSON.parse(localStorage.getItem('cart')) || [];

            const existingItem = cart.find(item => item.name === newItem.name);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(newItem);
            }

            localStorage.setItem('cart', JSON.stringify(cart));

            // Görsel tepki
            this.classList.add('added');
            const icon = this.querySelector('i');
            const originalClass = icon.className;
            icon.className = 'fas fa-check';

            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Sepete Eklendi';

            setTimeout(() => {
                this.classList.remove('added');
                this.innerHTML = originalText;
                icon.className = originalClass;
            }, 2000);

            updateCartCount();
        });
    });

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        const cartIcon = document.querySelector('.icon-badge i.bi-bag');
        if (cartIcon) {
            let badge = cartIcon.nextElementSibling;
            if (badge && badge.classList.contains('badge')) {
                badge.textContent = totalItems;
            } else {
                const newBadge = document.createElement('span');
                newBadge.className = 'badge bg-danger rounded-pill position-absolute';
                newBadge.style.top = '-8px';
                newBadge.style.right = '-8px';
                newBadge.textContent = totalItems;
                cartIcon.parentElement.style.position = 'relative';
                cartIcon.parentElement.appendChild(newBadge);
            }
        }
    }

    updateCartCount(); // Sayfa yüklendiğinde sepet sayısını güncelle
});

// === Loader Efekti ===
window.addEventListener('load', function () {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1200);
    }
});
