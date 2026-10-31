import { business } from "../data/business";
import { formatNaira } from "./catalog";
import { describeLineOptions, type PricedOrder } from "./order";

export function whatsappLink(message: string): string {
  return `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function orderMessage(order: PricedOrder, orderNumber?: string): string {
  const lines = order.lines.map((line) => {
    const options = describeLineOptions(line);
    return `- ${line.quantity} x ${line.name}${options ? ` (${options})` : ""}: ${formatNaira(line.lineTotal)}`;
  });
  const delivery = [
    order.delivery.label,
    order.delivery.address,
    order.delivery.landmark ? `Landmark: ${order.delivery.landmark}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  const fee = order.delivery.fee === null ? "to be agreed" : formatNaira(order.delivery.fee);

  return [
    orderNumber
      ? `Hello AOT.ng, I placed order ${orderNumber} on your website.`
      : "Hello AOT.ng, I would like to place this order.",
    "",
    ...lines,
    "",
    `Delivery: ${delivery}`,
    `Delivery fee: ${fee}`,
    `Total: ${formatNaira(order.total)}`,
    "",
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
  ].join("\n");
}
