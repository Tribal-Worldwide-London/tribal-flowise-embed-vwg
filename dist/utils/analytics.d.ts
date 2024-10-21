import { BaseRequest } from "@/queries/sendMessageQuery";
type EventData = {
    sessionId: string;
    retailerId: number;
    eventName: string;
    feedback: string;
    starterPromptQuestionId: number;
};
type AnalyticsEventRequest = BaseRequest & {
    body: Partial<EventData>;
};
export declare const sendAnalyticsEvent: ({ apiHost, body, onRequest }: AnalyticsEventRequest) => void;
export {};
//# sourceMappingURL=analytics.d.ts.map