# Feature — Auth / Accounts / Orders

## Goal
Create the normal clothing-brand customer account experience even if real backend auth is added later.

## Public auth pages
- Sign In
- Sign Up
- Forgot Password
- Reset Password

## Account pages
- Profile overview
- Personal info
- Addresses
- Orders
- Order details
- Wishlist later
- Returns/exchanges later

## Checkout region/payment rules
ANVL launches in Lebanon first.

Lebanon payment methods:
- Cash on Delivery
- Whish Money
- Card later/optional

Outside Lebanon:
- Card only when international shipping/card processing is enabled.

## Data model notes
```ts
type Customer = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses: Address[];
};

type Order = {
  id: string;
  orderNumber: string;
  customerId?: string;
  items: OrderItem[];
  totals: OrderTotals;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cashOnDelivery' | 'whishMoney' | 'card';
  shippingAddress: Address;
  createdAt: string;
};
```

## UX rules
- Checkout must support guest checkout first.
- Account creation should be optional after order.
- Mobile forms must be clean, large enough, and fast.
- Use clear delivery/payment copy for Lebanon.

## Security notes
- Real passwords/auth must never be implemented as frontend-only storage.
- Current static admin login must be clearly marked temporary and not production security.
- When backend exists, use secure session cookies or trusted auth provider flow.
