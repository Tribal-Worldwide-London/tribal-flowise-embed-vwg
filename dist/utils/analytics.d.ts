type EventData = {
    sessionId: string;
    retailerId: number;
    eventName: string;
    feedback: string;
    starterPromptQuestionId: number;
};
declare const sendEvent: (eventData: EventData) => void;
export default sendEvent;
//# sourceMappingURL=analytics.d.ts.map