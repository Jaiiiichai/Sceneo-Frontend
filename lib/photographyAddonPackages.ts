import type { CartItem, ServiceAddon } from '@/lib/cartContext';

type AddonUnit = {
  itemId: string;
  unitIndex: number;
  groupKey: string;
  providerName: string;
  durationMinutes: number;
  regularRate: number;
};

type PhotographyPackage = {
  minutes: number;
  price: number;
  label: string;
};

const PHOTOGRAPHY_PACKAGES: PhotographyPackage[] = [
  { minutes: 90, price: 2500, label: '1 hour 30 mins Photography Package' },
  { minutes: 120, price: 3000, label: '2 hours Photography Package' },
];

export const getPhotographyAddonPackage = (minutes: number) =>
  PHOTOGRAPHY_PACKAGES.find((pkg) => pkg.minutes === minutes);

export const formatPhotographyPackageDuration = (minutes: number) => {
  if (minutes === 90) return '1 hour 30 mins';
  if (minutes === 120) return '2 hours';
  if (minutes === 60) return '1 hour';
  return `${minutes} mins`;
};

const getItemQuantity = (item: CartItem) => Math.max(1, Number(item.quantity || 1));

const getAddonRate = (addon: ServiceAddon) =>
  addon.requestOnly || addon.quoteRequired ? 0 : Number(addon.providerRate || 0);

const getPhotographyGroupKey = (addon: ServiceAddon) => (
  addon.providerId ? `provider__${addon.providerId}` : ''
);

export const getCartItemAddonsForUnit = (
  item: CartItem,
  addons: ServiceAddon[],
  unitIndex = 0
) => {
  const quantity = getItemQuantity(item);
  const photographyAddons = addons.filter((addon) => addon.serviceType === 'photography');
  const otherAddons = addons.filter((addon) => addon.serviceType !== 'photography');

  if (quantity <= 1) {
    return addons;
  }

  if (photographyAddons.length <= quantity) {
    return [
      ...otherAddons,
      ...(photographyAddons[unitIndex] ? [photographyAddons[unitIndex]] : []),
    ];
  }

  return [
    ...otherAddons,
    ...photographyAddons.filter((_, index) => index % quantity === unitIndex),
  ];
};

type AppliedPhotographyPackage = PhotographyPackage & {
  groupKey: string;
  providerName: string;
  displayDuration: string;
  addonCount: number;
  regularTotal: number;
  savings: number;
};

export const getPhotographyAddonPackagePricing = (
  items: CartItem[],
  getItemAddons: (item: CartItem) => ServiceAddon[]
) => {
  const nonPhotographyUnitTotals = new Map<string, number>();
  const photographyUnits: AddonUnit[] = [];

  items.forEach((item) => {
    const addons = getItemAddons(item);
    const quantity = getItemQuantity(item);

    Array.from({ length: quantity }).forEach((_, unitIndex) => {
      let nonPhotographyTotal = 0;
      const unitAddons = getCartItemAddonsForUnit(item, addons, unitIndex);

      unitAddons.forEach((addon) => {
        if (addon.serviceType !== 'photography') {
          nonPhotographyTotal += getAddonRate(addon);
          return;
        }

        const groupKey = getPhotographyGroupKey(addon);
        photographyUnits.push({
          itemId: item.id,
          unitIndex,
          groupKey: groupKey || `${item.id}__${unitIndex}__${addon.providerId}`,
          providerName: addon.providerName,
          durationMinutes: Number(addon.durationMinutes || 60),
          regularRate: getAddonRate(addon),
        });
      });

      nonPhotographyUnitTotals.set(`${item.id}__${unitIndex}`, nonPhotographyTotal);
    });
  });

  const groups = photographyUnits.reduce<Record<string, AddonUnit[]>>((acc, unit) => {
    if (!acc[unit.groupKey]) acc[unit.groupKey] = [];
    acc[unit.groupKey].push(unit);
    return acc;
  }, {});

  const photographyUnitTotals = new Map<string, number>();
  const appliedPackages: AppliedPhotographyPackage[] = [];
  let regularPhotographyTotal = 0;
  let discountedPhotographyTotal = 0;

  Object.values(groups).forEach((groupUnits) => {
    const regularTotal = groupUnits.reduce((sum, unit) => sum + unit.regularRate, 0);
    const totalMinutes = groupUnits.reduce((sum, unit) => sum + unit.durationMinutes, 0);
    const matchedPackage = getPhotographyAddonPackage(totalMinutes);
    const groupTotal = matchedPackage ? matchedPackage.price : regularTotal;
    let remainingTotal = groupTotal;

    regularPhotographyTotal += regularTotal;
    discountedPhotographyTotal += groupTotal;

    if (matchedPackage) {
      appliedPackages.push({
        ...matchedPackage,
        groupKey: groupUnits[0]?.groupKey || matchedPackage.label,
        providerName: groupUnits[0]?.providerName || 'Photographer',
        displayDuration: formatPhotographyPackageDuration(totalMinutes),
        addonCount: groupUnits.length,
        regularTotal,
        savings: Math.max(0, regularTotal - groupTotal),
      });
    }

    groupUnits.forEach((unit, index) => {
      const unitKey = `${unit.itemId}__${unit.unitIndex}`;
      const regularShare = regularTotal > 0
        ? Math.round(groupTotal * (unit.regularRate / regularTotal))
        : 0;
      const unitTotal = index === groupUnits.length - 1
        ? remainingTotal
        : Math.min(remainingTotal, regularShare);

      remainingTotal = Math.max(0, remainingTotal - unitTotal);
      photographyUnitTotals.set(unitKey, (photographyUnitTotals.get(unitKey) || 0) + unitTotal);
    });
  });

  const getUnitAddonTotal = (itemId: string, unitIndex = 0) => {
    const unitKey = `${itemId}__${unitIndex}`;
    return (nonPhotographyUnitTotals.get(unitKey) || 0) + (photographyUnitTotals.get(unitKey) || 0);
  };

  const itemTotals = new Map<string, number>();
  items.forEach((item) => {
    const quantity = getItemQuantity(item);
    const total = Array.from({ length: quantity }).reduce<number>((sum, _, unitIndex) => (
      sum + getUnitAddonTotal(item.id, unitIndex)
    ), 0);
    itemTotals.set(item.id, total);
  });

  const nonPhotographyTotal = Array.from(nonPhotographyUnitTotals.values()).reduce<number>((sum, value) => sum + value, 0);
  const regularTotal = nonPhotographyTotal + regularPhotographyTotal;
  const total = nonPhotographyTotal + discountedPhotographyTotal;

  return {
    appliedPackages,
    regularTotal,
    savings: Math.max(0, regularTotal - total),
    total,
    getItemAddonTotal: (item: CartItem) => itemTotals.get(item.id) || 0,
    getUnitAddonTotal,
  };
};
