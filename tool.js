const fetch = require('node-fetch');

const getRagResponse = async function () {
  const ragApiUrl = 'https://tribal-flowise-production.up.railway.app/api/v1/prediction/5e382833-ec70-453e-918b-4c8346722c14';
  const ragApiOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: $input }),
  };

  try {
    const response = await fetch(ragApiUrl, ragApiOptions);
    const resp = await response.json();
    return resp.text;
  } catch (error) {
    console.error(error);
    return '';
  }
};

const getModeratedResponse = async function (textToModerate) {
  const moderatorApiUrl = 'https://tribal-flowise-production.up.railway.app/api/v1/prediction/ed1edbb8-7795-4fd1-8fbb-a174273282cb';
  const moderatorApiOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: textToModerate }),
  };

  try {
    const response = await fetch(moderatorApiUrl, moderatorApiOptions);
    const resp = await response.json();
    return resp.text;
  } catch (error) {
    console.error(error);
    return '';
  }
};

try {
  const ragResponse = await getRagResponse();
  return await getModeratedResponse(ragResponse);
} catch (error) {
  console.error(error);
  return '';
}
