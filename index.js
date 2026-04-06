const express = require('express');
const axios = require('axios');
const { BotFrameworkAdapter } = require('botbuilder');

const app = express();
app.use(express.json());

const adapter = new BotFrameworkAdapter({
  appId: process.env.BOT_APP_ID,
  appPassword: process.env.BOT_APP_PASSWORD
});

const CORTEX_URL = 'https://app-back-cortexagentshub-test.azurewebsites.net/api/v1/messages/send';
const CORTEX_FLOW_ID = process.env.CORTEX_FLOW_ID;
const CORTEX_CHANNEL_ID = process.env.CORTEX_CHANNEL_ID;

adapter.onTurnError = async (context, error) => {
  console.error('Bot error:', error);
  await context.sendActivity('Ocurrió un error. Por favor intenta de nuevo.');
};

app.post('/api/messages', async (req, res) => {
  await adapter.processActivity(req, res, async (context) => {
    if (context.activity.type === 'message') {
      const userMessage = context.activity.text;
      const userId = context.activity.from.id;
      console.log(`Mensaje de ${userId}: ${userMessage}`);
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
        const respuesta = cortexResponse.data?.response || 'No se obtuvo respuesta.';
        await context.sendActivity(respuesta);
      } catch (error) {
        console.error('Error llamando a Cortex:', error.message);
        await context.sendActivity('Error al conectar con el asistente. Intenta de nuevo.');
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Supreme Middleware corriendo en puerto ${PORT}`);
});
