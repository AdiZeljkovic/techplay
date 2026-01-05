export interface SupportTier {
    id: number;
    name: string;
    price: string;
    paypal_plan_id?: string;
    currency: string;
    features: string[];
    color: string | null;
    is_active: boolean;
}
