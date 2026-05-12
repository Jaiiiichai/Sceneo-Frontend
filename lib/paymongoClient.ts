export type PayMongoPaymentMethodType = 'card' | 'gcash' | 'paymaya' | 'qrph';

export interface PayMongoCardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface PayMongoBillingDetails {
  name?: string;
  email?: string;
  phone?: string;
}

export interface PayMongoPaymentMethodInput {
  type: PayMongoPaymentMethodType;
  card?: PayMongoCardDetails;
  billing?: PayMongoBillingDetails;
}

export interface PayMongoPaymentMethodResponse {
  id: string;
  type: PayMongoPaymentMethodType;
}

const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY || '';

const assertPublicKey = (): void => {
  if (!PAYMONGO_PUBLIC_KEY) {
    throw new Error('Missing NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY.');
  }
  if (typeof window === 'undefined' || typeof btoa === 'undefined') {
    throw new Error('PayMongo payment method creation must run in the browser.');
  }
};

const buildAuthHeader = (): string => {
  assertPublicKey();
  return `Basic ${btoa(`${PAYMONGO_PUBLIC_KEY}:`)}`;
};

export const createPayMongoPaymentMethod = async (
  input: PayMongoPaymentMethodInput
): Promise<PayMongoPaymentMethodResponse> => {
  assertPublicKey();

  const attributes: Record<string, any> = {
    type: input.type,
  };

  if (input.type === 'card') {
    if (!input.card) {
      throw new Error('Card details are required for card payments.');
    }
    attributes.details = {
      card_number: input.card.number,
      exp_month: input.card.expMonth,
      exp_year: input.card.expYear,
      cvc: input.card.cvc,
    };
  }

  if (input.billing) {
    attributes.billing = {
      name: input.billing.name,
      email: input.billing.email,
      phone: input.billing.phone,
    };
  }

  const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: buildAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorMessage = payload?.errors?.[0]?.detail || 'Failed to create payment method.';
    throw new Error(errorMessage);
  }

  return {
    id: payload?.data?.id,
    type: payload?.data?.attributes?.type,
  };
};
