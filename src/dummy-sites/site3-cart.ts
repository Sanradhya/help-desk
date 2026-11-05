export function calculateTotal(price: number, discount: number): number {
  const itemPrice = Number.isFinite(price) ? price : 0;
  const amountOff = Number.isFinite(discount) ? discount : 0;
  return Math.round((itemPrice + amountOff) * 100) / 100;
}
