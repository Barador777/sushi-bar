// Открытие окна: вешаем на все кнопки с классом open-booking
document.querySelectorAll('.open-booking').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('bookingModal').classList.add('open');
    });
});

// Клик по затемнению тоже закрывает
document.getElementById('bookingModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeBookingModal();
});

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('open');
    // Сбрасываем состояние, если окно откроют снова
    document.getElementById('bookingForm').style.display = '';
    document.getElementById('bookingSuccess').style.display = 'none';
}

// Счётчик гостей
let guests = 1;
function changeGuests(delta) {
    guests = Math.min(20, Math.max(1, guests + delta));
    document.getElementById('guests-value').innerText = guests;
}

// Маска телефона: оставляем только цифры
document.getElementById('bk-phone').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
});

const bkName = document.getElementById('bk-name');
bkName.addEventListener('input', function () {
    this.value = this.value.replace(/[^A-Za-zА-Яа-яЁё\- ]/g, '');
});


// Дата: не даём выбрать прошлое
const dateInput = document.getElementById('bk-date');
dateInput.min = new Date().toISOString().split('T')[0];

function submitBooking(e) {
    e.preventDefault();

    const payload = {
        name: document.getElementById('bk-name').value.trim(),
        phone: document.getElementById('bk-phone').value.replace(/\D/g, ''),
        guests: guests,
        date: document.getElementById('bk-date').value,   // "2026-11-25"
        time: document.getElementById('bk-time').value    // "19:00"
    };

    fetch('/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('bookingForm').style.display = 'none';
                document.getElementById('bookingSuccess').style.display = 'block';
            } else {
                alert('Не удалось забронировать: ' + (data.error || 'Неизвестная ошибка'));
            }
        })
        .catch(() => alert('Произошла ошибка при отправке. Попробуйте позже.'));
}


