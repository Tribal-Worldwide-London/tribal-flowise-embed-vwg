type EventData = {
    sessionId: string,
    retailerId: number,
    eventName: string,
    feedback: string,
    starterPromptQuestionId: number
}


const sendEvent = function(eventData : EventData) {
    try{
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const now = new Date();
        const isoDateString = now.toISOString();

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify([
                {
                    eventDateTime: isoDateString,
                    ...eventData
                }
            ]),
            redirect: "follow"
        };
    
        fetch("https://api.powerbi.com/beta/41eb501a-f671-4ce0-a5bf-b64168c3705f/datasets/da06c57a-0cdf-4536-87b2-1172cc43ab75/rows?ctid=41eb501a-f671-4ce0-a5bf-b64168c3705f&experience=power-bi&key=WzJav1FR1EnA6YI%2FZw7Ifi79TeCd8tGiqVoUOGlIcqshi2f%2BJnxmWWkCCmAGtcsp0FjYWVovICddhZKFO17hyw%3D%3D", requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));

    } catch(error){
        console.log(error)
    }
}

export default sendEvent;