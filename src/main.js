// /**
//  * Функция для расчета выручки
//  * @param purchase запись о покупке
//  * @param _product карточка товара
//  * @returns {number}
//  */
// function calculateSimpleRevenue(purchase, _product) {
//    // @TODO: Расчет выручки от операции

// }

// /**
//  * Функция для расчета бонусов
//  * @param index порядковый номер в отсортированном массиве
//  * @param total общее число продавцов
//  * @param seller карточка продавца
//  * @returns {number}
//  */
// function calculateBonusByProfit(index, total, seller) {
//     // @TODO: Расчет бонуса от позиции в рейтинге
//     const { profit } = seller;
// }

// /**
//  * Функция для анализа данных продаж
//  * @param data
//  * @param options
//  * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
//  */
// function analyzeSalesData(data, options) {
//     // @TODO: Проверка входных данных

//     // @TODO: Проверка наличия опций

//     // @TODO: Подготовка промежуточных данных для сбора статистики

//     // @TODO: Индексация продавцов и товаров для быстрого доступа

//     // @TODO: Расчет выручки и прибыли для каждого продавца

//     // @TODO: Сортировка продавцов по прибыли

//     // @TODO: Назначение премий на основе ранжирования

//     // @TODO: Подготовка итоговой коллекции с нужными полями
// }











function calculateSimpleRevenue(purchase, _product) {
    const discountFactor = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discountFactor;
}

function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit;

    if (index === 0) return +(profit * 0.15).toFixed(2); // 1 место — 15%
    else if (index === 1 || index === 2) return +(profit * 0.10).toFixed(2); // 2 и 3 место — 10%
    else if (index === total - 1) return 0; // последнее место — 0%
    else return +(profit * 0.05).toFixed(2); // остальные — 5%
}

function analyzeSalesData(data, options) {
    if (
        !data ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.purchase_records) ||
        data.sellers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Функции для расчёта отсутствуют');
    }

    // Промежуточная статистика продавцов
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // Индексы для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

    // Основной цикл обработки продаж
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
        seller.revenue += record.total_amount - record.total_discount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;

            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    const totalSellers = sellerStats.length;

    // Назначение бонусов и топ-10 товаров
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);

        const topProducts = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        seller.top_products = topProducts;

        // Округляем выручку, прибыль и бонус
        seller.revenue = +seller.revenue.toFixed(2);
        seller.profit = +seller.profit.toFixed(2);
        seller.bonus = +seller.bonus.toFixed(2);
    });

    // Формируем итоговый массив
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: seller.revenue,
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus
    }));
}

