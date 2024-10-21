import { BaseRequest } from "@/queries/sendMessageQuery";
import { sendRequest } from ".";

type EventData = {
    sessionId: string;
    retailerId: number;
    eventName: string;
    feedback: string;
    starterPromptQuestionId: number;
  };

type AnalyticsEventRequest = BaseRequest & {
    body: Partial<EventData>;
}

export const sendAnalyticsEvent = ({ apiHost = 'http://localhost:3000', body, onRequest }: AnalyticsEventRequest) => {
    sendRequest<any>({
        method: 'POST',
        url: `${apiHost}/api/v1/tribal/analytics/`,
        body,
        onRequest: onRequest,
    });
};
