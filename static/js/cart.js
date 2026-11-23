// ===== Корзина: хранение в localStorage =====

function getCart() {
    return JSON.parse(localStorage.getItem('tokyoCart') || '{}');
}

function saveCart(cart) {
    localStorage.setItem('tokyoCart', JSON.stringify(cart));
    updateCartBadge();
}

// Цена может быть строкой вида "600/900" или "990 / 210гр" — берём первое число
function toNum(price) {
    const m = String(price).replace(',', '.').match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
}

// ===== Добавление в корзину =====

function addToCart(btn) {
    const name = btn.dataset.name;
    const price = btn.dataset.price; // храним как есть, строкой
    const cart = getCart();

    if (cart[name]) {
        cart[name].qty += 1;
    } else {
        cart[name] = { name: name, price: price, qty: 1 };
    }
    saveCart(cart);

    // Небольшая анимация кнопки
    btn.innerText = 'ДОБАВЛЕНО ✓';
    setTimeout(() => { btn.innerText = 'В КОРЗИНУ'; }, 1200);
}

function removeFromCart(name) {
    const cart = getCart();
    delete cart[name];
    saveCart(cart);
    renderCart();
}

function changeQty(name, delta) {
    const cart = getCart();
    if (cart[name]) {
        cart[name].qty += delta;
        if (cart[name].qty <= 0) delete cart[name];
    }
    saveCart(cart);
    renderCart();
}

function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    if (!badge) return; // на страницах без корзины не падаем

    const cart = getCart();
    let count = 0;
    for (const key in cart) count += cart[key].qty;
    badge.textContent = count;
}

// ===== Окно корзины =====

function openCart() {
    renderCart();
    document.getElementById('cartOverlay').classList.remove('hidden');
}

function closeCart() {
    document.getElementById('cartOverlay').classList.add('hidden');
}

function renderCart() {
    const cart = getCart();
    const box = document.getElementById('cartItems');
    const totalBox = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    box.innerHTML = '';
    let total = 0;

    for (const key in cart) {
        const item = cart[key];
        total += toNum(item.price) * item.qty;

        box.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price}</div>
                </div>
                <div class="cart-item-qty">
                    <button onclick="changeQty('${key}', -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty('${key}', 1)">+</button>
                </div>
                <button class="cart-item-del" onclick="removeFromCart('${key}')">✕</button>
            </div>`;
    }

    totalBox.textContent = total + ' ₽';
    checkoutBtn.style.display = total > 0 ? 'block' : 'none';
}

function showCheckout() {
    document.getElementById('checkoutBtn').style.display = 'none';
    document.getElementById('checkoutForm').classList.remove('hidden');
}

// ===== Отправка заказа на сервер =====

function submitOrder(e) {
    e.preventDefault();

    const cart = getCart();
    const items = Object.values(cart).map(i => ({
        name: i.name,
        price: toNum(i.price),
        qty: i.qty
    }));

    const payload = {
        name: document.getElementById('d-name').value.trim(),
        phone: document.getElementById('d-phone').value.replace(/\D/g, ''),
        address: document.getElementById('d-address').value.trim(),
        apartment: document.getElementById('d-apartment').value.trim(),
        intercom: document.getElementById('d-intercom').value.trim(),
        entrance: document.getElementById('d-entrance').value.trim(),
        floor: document.getElementById('d-floor').value.trim(),
        comment: document.getElementById('d-comment').value.trim(),
        items: items
    };

    fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.removeItem('tokyoCart');
                updateCartBadge();
                document.getElementById('checkoutForm').classList.add('hidden');
                document.getElementById('cartItems').innerHTML = '';
                document.getElementById('cartTotal').textContent = '0 ₽';
                document.getElementById('orderSuccess').classList.remove('hidden');
            } else {
                alert('Не удалось сохранить заказ: ' + (data.error || 'Неизвестная ошибка'));
            }
        })
        .catch(() => alert('Ошибка при отправке заказа. Проверьте консоль.'));

    return false;
}

// Инициализация счётчика при загрузке страницы
updateCartBadge();
