export function cardLabel(brand: string, last4: string): string {
  const key = brand.toLowerCase();
  const name =
    key === "visa"
      ? "Visa"
      : key === "mastercard" || key === "master"
        ? "Mastercard"
        : key === "mir"
          ? "МИР"
          : key === "amex" || key === "americanexpress"
            ? "Amex"
            : brand.trim()
              ? brand
              : "Card";
  return last4 ? `${name} •••• ${last4}` : name;
}
