export const business = {
  name: "AOT.ng",
  tagline: "Modest. Elegant.You",
  siteUrl: "https://aotwears.store",
  // Lets search engines list the site. Set to false to hide it again.
  openToSearchEngines: true,
  phoneDisplay: "09027500239",
  phoneTel: "+2349027500239",
  whatsappNumber: "2349027500239",
  pickupAddress: "Olorunshogo, Sawmill, Ilorin, Kwara State",
  bank: {
    name: "Moniepoint",
    accountNumber: "9027500239",
    accountName: "Ojikutu Amina Sijuola",
  },
  // Public key for the checkout bot check. Its secret is a Worker secret.
  turnstileSiteKey: "0x4AAAAAAFvVB21Q-dsGj3EU",
  // Set this to the full TikTok profile URL once it is confirmed.
  tiktokUrl: null as string | null,
};

export type DeliveryOptionId = "unilorin" | "ilorin" | "pickup" | "outside";

export type DeliveryOption = {
  id: DeliveryOptionId;
  label: string;
  // null means the fee is agreed on WhatsApp, so the order can't be paid on the site.
  fee: number | null;
  requiresAddress: boolean;
};

export const deliveryOptions: DeliveryOption[] = [
  { id: "unilorin", label: "Delivery inside Unilorin", fee: 0, requiresAddress: true },
  { id: "ilorin", label: "Delivery elsewhere in Ilorin", fee: 3000, requiresAddress: true },
  { id: "pickup", label: "Pick up at Sawmill, Ilorin", fee: 0, requiresAddress: false },
  { id: "outside", label: "Outside Ilorin", fee: null, requiresAddress: true },
];

export function getDeliveryOption(id: string): DeliveryOption | undefined {
  return deliveryOptions.find((option) => option.id === id);
}
