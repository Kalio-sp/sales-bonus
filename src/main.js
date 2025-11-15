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
  const discountMultiplier = 1 - purchase.discount / 100;
  return +(
    purchase.sale_price *
    purchase.quantity *
    discountMultiplier
  ).toFixed(2);
}

function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) return profit * 0.15;
  if (index === 1 || index === 2) return profit * 0.1;
  if (index === total - 1) return 0;
  return profit * 0.05;
}

function analyzeSalesData(data, options) {
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  if (!options || typeof options !== "object") {
    throw new Error("Некорректные опции");
  }

  const { calculateRevenue, calculateBonus } = options;
  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Опции должны содержать функции расчета");
  }

  // Подготовка промежуточной статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller])
  );
  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product])
  );

  // Перебор всех чеков и товаров в них
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count += 1;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      const revenue = calculateRevenue(item, product);
      const cost = +(product.purchase_price * item.quantity).toFixed(2);
      const profit = +(revenue - cost).toFixed(2);

      seller.revenue += revenue;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // Назначение бонусов и формирование топ-10 продуктов
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // Формирование итогового отчёта с округлением только в конце
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}