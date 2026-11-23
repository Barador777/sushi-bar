from flask import Flask, render_template, request, jsonify
import pyodbc
from pathlib import Path
from datetime import datetime

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'database' / 'Sushi-bar.accdb'

def get_db_connection():
    """Функция для подключения к Access"""
    conn_str = (
        r"Driver={Microsoft Access Driver (*.mdb, *.accdb)};"
        r"DBQ=" + str(DB_PATH) + ";"
    )
    try:
        return pyodbc.connect(conn_str)
    except pyodbc.Error as e:
        print(f"Ошибка подключения к БД: {e}")
        print("Проверь: совпадает ли разрядность Python (32/64 бит) с драйвером Access.")
        raise

NEWS_LIST = [
    {
        "id": 1,
        "date": "13.12.2026",
        "title": "НОВОГОДНИЕ ПОДАРКИ В КАЖДОЙ ДОСТАВКЕ",
        "short_desc": "Любимые роллы и бестселлеры от известного косметического бренда — идеальный план для уютного декабрьского вечера.",
        "full_text": "Весь декабрь при оформлении доставки от 3500 рублей мы дарим лимитированный набор уходовой косметики. Количество подарков ограничено.",
        "image": "/static/images/news1.webp"
    },
    {
        "id": 2,
        "date": "13.12.2026",
        "title": "НИЖЕ НУЛЯ — НОВЫЙ ДЕГУСТАЦИОННЫЙ СЕТ В TOKYO",
        "short_desc": "Познаем искусство сочетаний и расширяем границы вкусовых комбинаций в специальном сете из 4 подач.",
        "full_text": "Шеф-повар представил зимнее обновление: гребешок с юдзу, обожженный лосось с трюфельным понзу и авторский десерт. Сет доступен ежедневно с 16:00.",
        "image": "/static/images/news2.webp"
    }
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/news')
def news():
    return render_template('news.html', news_list=NEWS_LIST)

@app.route('/contacts')
def contacts():
    return render_template('contacts.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/privacy policy')
def privacy_policy():
    return render_template('privacy policy.html')

@app.route('/callback', methods=['POST'])
def callback():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()

    # Простая валидация
    if not name or not phone.isdigit() or len(phone) != 11:
        return jsonify({"success": False, "error": "Проверьте имя и телефон (должно быть 11 цифр)"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Вставляем данные. Id_callback создастся автоматически (AutoNumber), Поля в квадратных скобках, так как в Access они на русском
        cursor.execute(
            "INSERT INTO [Callback] ([Имя], [Телефон]) VALUES (?, ?)", (name, phone)
        )
        conn.commit()
        conn.close()

        return jsonify({"success": True})
    except pyodbc.Error as e:
        print(f"Ошибка записи в БД: {e}")
        return jsonify({"success": False, "error": "Ошибка базы данных"}), 500
    except Exception as e:
        print(f"Общая ошибка: {e}")
        return jsonify({"success": False, "error": "Внутренняя ошибка сервера"}), 500



@app.route('/booking', methods=['POST'])
def booking():
    data = request.get_json(silent=True) or {}

    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    try:
        guests = int(data.get('guests', 1))
    except (TypeError, ValueError):
        guests = 0
    date_str = (data.get('date') or '').strip()
    time_str = (data.get('time') or '').strip()

    # Валидация
    if not name or not phone.isdigit() or len(phone) != 11:
        return jsonify({"success": False, "error": "Проверьте имя и телефон"}), 400
    if not 1 <= guests <= 20:
        return jsonify({"success": False, "error": "Некорректное число гостей"}), 400
    try:
        visit_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"success": False, "error": "Некорректная дата"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO booking ([Имя], [Номер телефона], [Кол-во гостей], [Дата посещения], [Время]) "
            "VALUES (?, ?, ?, ?, ?)",
            name, phone, guests, visit_date, time_str
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except pyodbc.Error as e:
        print(f"Ошибка записи брони: {e}")
        return jsonify({"success": False, "error": "Ошибка базы данных"}), 500


@app.route('/menu')
def menu_page():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Берем только русское название, остальное не нужно
    cursor.execute(
        "SELECT [Категория], [Подкатегория], [Название], [Состав], [Цена], [Единица] "
        "FROM menu ORDER BY [Категория], [Подкатегория], [Id]"
    )
    rows = cursor.fetchall()
    conn.close()

    menu_data = {}

    for row in rows:
        cat, sub, name_ru, comp, price, unit = row  # теперь 6 значений, как в SELECT

        # Пропускаем полностью пустые строки из Access
        if not cat and not name_ru:
            continue

        sub_key = sub or ''

        if cat not in menu_data:
            menu_data[cat] = {}
        if sub_key not in menu_data[cat]:
            menu_data[cat][sub_key] = []

        menu_data[cat][sub_key].append({
            'name': name_ru,
            'comp': comp or '',  # состав мелким текстом под названием
            'price': price,
            'unit': unit or ''
        })
    order = ['КУХНЯ', 'SPECIAL', 'БАР', 'ВИНО']
    menu_data = {cat: menu_data[cat] for cat in order if cat in menu_data}

    return render_template('menu.html', menu=menu_data)


'''
@app.route('/debug-tables')
def debug_tables():
    print("Открываю базу:", DB_PATH.resolve())
    conn = get_db_connection()
    cursor = conn.cursor()
    tables = [row.table_name for row in cursor.tables(tableType='TABLE')]
    conn.close()
    return {"таблицы_в_базе": tables} 
    """http://192.168.0.194:5000/debug-tables"""
'''


if __name__ == '__main__':
    if not DB_PATH.exists():
        print(f"Ошибка: Файл базы данных не найден по пути: {DB_PATH}")
    else:
        print(f"База данных найдена: {DB_PATH}")
    app.run(debug=True, host='0.0.0.0', port=5000)


