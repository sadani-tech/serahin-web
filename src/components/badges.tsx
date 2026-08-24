import {
  CampaignStatus,
  OrderStatus,
  PaymentVerification,
} from "@/lib/types";
import {
  CAMPAIGN_STATUS_BADGE,
  CAMPAIGN_STATUS_LABEL,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  PAYMENT_VERIFICATION_BADGE,
  PAYMENT_VERIFICATION_LABEL,
  badge,
} from "@/lib/domain";

export function CampaignBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={badge(CAMPAIGN_STATUS_BADGE[status])}>
      {CAMPAIGN_STATUS_LABEL[status]}
    </span>
  );
}

export function OrderBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={badge(ORDER_STATUS_BADGE[status])}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentVerification }) {
  return (
    <span className={badge(PAYMENT_VERIFICATION_BADGE[status])}>
      {PAYMENT_VERIFICATION_LABEL[status]}
    </span>
  );
}
