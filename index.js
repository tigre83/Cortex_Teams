const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const CORTEX_URL = 'https://app-back-cortexagentshub-test.azurewebsites.net/api/v1/messages/send';
const CORTEX_FLOW_ID = process.env.CORTEX_FLOW_ID;
const CORTEX_CHANNEL_ID = process.env.CORTEX_CHANNEL_ID;

app.post('/api/messages', async (req, res) => {
  res.sendStatus(200);
  
  const activity = req.body;
  if (activity.type !== 'message' || !activity.text) return;

  const userMessage = activity.text;
  const userId = activity.from?.id || 'teams-user';
  const serviceUrl = activity.serviceUrl;
  const conversationId = activity.conversation?.id;
  const replyToId = activity.id;

  console.log(`Mensaje: ${userMessage}`);
  console.log(`serviceUrl: ${serviceUrl}`);
  console.log(`conversationId: ${conversationId}`);

  try {
    const cortexResponse = await axios.post(CORTEX_URL, {
      channelType: 'teams',
      userId: userId,
      content: userMessage,
      metadata: {
        flowId: CORTEX_FLOW_ID,
        channelId: CORTEX_CHANNEL_ID,
        channel_config_id: CORTEX_CHANNEL_ID
      }
    });

    console.log('Cortex response:', JSON.stringify(cortexResponse.data));
    const respuesta = cortexResponse.data?.response || 'No se obtuvo respuesta.';

    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.BOT_APP_ID,
        client_secret: process.env.BOT_APP_PASSWORD,
        scope: 'https://api.botframework.com/.default'
      })
    );

    const token = tokenResponse.data.access_token;
    console.log('Token obtenido OK');

    await axios.post(
      `${serviceUrl}v3/conversations/${conversationId}/activities/${replyToId}`,
      { type: 'message', text: respuesta },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Respuesta enviada a Teams OK');
  } catch (error) {
    console.error('Error completo:', JSON.stringify(error.response?.data || error.message));
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Supreme Middleware corriendo en puerto ${PORT}`));
