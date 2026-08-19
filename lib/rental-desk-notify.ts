/**
 * Extension point for Phase 5 (WhatsApp automation).
 *
 * Wire a WhatsApp Business API call (or a provider like Twilio/360dialog) in
 * here to actually message the broker when a match is marked as sent. Until
 * then this is a deliberate no-op: matches still get marked "sent" from the
 * admin panel and drive the UI/status correctly, nothing is dispatched yet.
 */
export type MatchNotification = {
  brokerName: string;
  brokerPhone: string;
  brokerWhatsapp: string | null;
  referenceCode: string;
  matchScore: number;
};

export async function notifyBrokerOfMatch(_notification: MatchNotification): Promise<void> {
  // TODO(Phase 5): send the WhatsApp message here.
}
