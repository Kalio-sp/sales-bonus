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

function calculateSimpleRevenue(purchase, product) {
  const discountMultiplier = 1 - purchase.discount / 100;
  const revenue = purchase.sale_price * purchase.quantity * discountMultiplier;

  return +revenue.toFixed(2);
}

function calculateBonusByProfit(index, total, seller) {
  const profit = seller.profit;
  let percent = 0;

  if (index === 0) percent = 0.15;
  else if (index === 1 || index === 2) percent = 0.1;
  else if (index === total - 1) percent = 0;
  else percent = 0.05;

  return Math.floor(profit * percent * 100) / 100;
}

function analyzeSalesData(data, options) {
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records)
  ) {
    throw new Error("Некорректные входные данные");
  }

  // ДОБАВЛЕНО: проверка на пустые массивы
  if (
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  const { calculateRevenue, calculateBonus } = options;

  const sellerStats = data.sellers.map((s) => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  const sellerIndex = Object.fromEntries(sellerStats.map((s) => [s.id, s]));

  const productIndex = Object.fromEntries(data.products.map((p) => [p.sku, p]));

  // --- Обработка всех покупок ---
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count++;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      const revenue = calculateRevenue(item, product);

      const profitItem = item.sale_price * (1 - item.discount / 100) * item.quantity - product.purchase_price * item.quantity;

      seller.revenue += revenue;
      seller.profit += profitItem;

      seller.products_sold[item.sku] =
        (seller.products_sold[item.sku] || 0) + item.quantity;
    });
  });

  sellerStats.forEach((seller) => {
    seller.profit = +seller.profit.toFixed(2);
  });

  sellerStats.sort((a, b) => b.profit - a.profit);

  sellerStats.forEach((seller, idx) => {
    seller.bonus = calculateBonus(idx, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  return sellerStats.map((s) => ({
    seller_id: s.id,
    name: s.name,
    revenue: +s.revenue.toFixed(2),
    profit: s.profit,
    sales_count: s.sales_count,
    top_products: s.top_products,
    bonus: s.bonus,
  }));
}